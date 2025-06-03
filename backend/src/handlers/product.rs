use actix_web::{web, HttpResponse, Responder, HttpRequest, HttpMessage};
use serde_json::json;
use diesel::prelude::*;
use url;

use crate::models::product::{Product, CreateProductDto, UpdateProductDto, ProductResponse};
use crate::models::user::UserRole;
use crate::config::jwt::Claims;
use crate::schema::products;

// 获取所有产品
pub async fn get_all_products(
    req: HttpRequest,
    pool: web::Data<crate::config::database::DbPool>
) -> impl Responder {
    // 解析查询参数
    let query_string = req.query_string();
    
    // 手动解析查询参数
    let mut search = None;
    let mut category = None;
    let mut sort_by = "created_at".to_string();
    let mut sort_direction = "desc".to_string();
    let mut page: i64 = 1;
    let mut limit: i64 = 50;
    let mut min_price = None;
    let mut max_price = None;
    
    // 解析URL查询参数
    for (key, value) in url::form_urlencoded::parse(query_string.as_bytes()) {
        match key.as_ref() {
            "search" => search = Some(value.to_string().to_lowercase()),
            "category" => category = Some(value.to_string()),
            "sort_by" => sort_by = value.to_string(),
            "sort_direction" => sort_direction = value.to_string(),
            "page" => if let Ok(val) = value.parse::<i64>() { page = val },
            "limit" => if let Ok(val) = value.parse::<i64>() { limit = val },
            "min_price" => if let Ok(val) = value.parse::<f64>() { min_price = Some(val) },
            "max_price" => if let Ok(val) = value.parse::<f64>() { max_price = Some(val) },
            _ => {}
        }
    }
    
    // 计算偏移量
    let offset = (page - 1) * limit;
    
    // 从数据库获取产品数据
    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "无法获取数据库连接"
        })),
    };
    
    // 构建查询条件 - 先创建两个独立的查询对象
    let mut count_query = products::table.into_boxed();
    let mut query = products::table.into_boxed();
    
    // 应用搜索过滤
    if let Some(search_term) = search {
        let search_pattern = format!("%{}%", search_term);
        count_query = count_query.filter(
            products::name.like(search_pattern.clone())
            .or(products::description.like(search_pattern.clone()))
        );
        
        let search_pattern = format!("%{}%", search_term);
        query = query.filter(
            products::name.like(search_pattern.clone())
            .or(products::description.like(search_pattern))
        );
    }
    
    // 应用分类过滤
    if let Some(cat) = category {
        if !cat.is_empty() {
            count_query = count_query.filter(products::category.eq(cat.clone()));
            query = query.filter(products::category.eq(cat));
        }
    }
    
    // 应用价格范围过滤
    if let Some(min) = min_price {
        count_query = count_query.filter(products::price.ge(min));
        query = query.filter(products::price.ge(min));
    }
    
    if let Some(max) = max_price {
        count_query = count_query.filter(products::price.le(max));
        query = query.filter(products::price.le(max));
    }
    
    // 获取总数 - 使用count_query
    let total_count: i64 = match count_query.count().get_result(&mut conn) {
        Ok(count) => count,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "获取产品总数失败"
        })),
    };
    
    // 应用排序 - 只对主查询应用排序
    match sort_by.as_str() {
        "price" => {
            if sort_direction == "asc" {
                query = query.order(products::price.asc());
            } else {
                query = query.order(products::price.desc());
            }
        },
        "name" => {
            if sort_direction == "asc" {
                query = query.order(products::name.asc());
            } else {
                query = query.order(products::name.desc());
            }
        },
        _ => {
            // 默认按创建时间排序
            if sort_direction == "asc" {
                query = query.order(products::created_at.asc());
            } else {
                query = query.order(products::created_at.desc());
            }
        }
    }
    
    // 应用分页 - 只对主查询应用分页
    query = query.limit(limit).offset(offset);
    
    // 执行查询
    let products = match query.load::<Product>(&mut conn) {
        Ok(products) => products,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "获取产品列表失败"
        })),
    };
    
    // 构建响应
    let response_products: Vec<ProductResponse> = products.into_iter()
        .map(|p| ProductResponse::from(p))
        .collect();
    
    // 返回带有分页信息的响应
    HttpResponse::Ok().json(json!({
        "products": response_products,
        "total": total_count
    }))
}

// 获取单个产品
pub async fn get_product_by_id(
    pool: web::Data<crate::config::database::DbPool>,
    path: web::Path<String>
) -> impl Responder {
    let product_id = path.into_inner();
    
    // 从数据库获取连接
    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "无法获取数据库连接"
        })),
    };
    
    // 查询产品
    let product = match products::table
        .find(product_id)
        .first::<Product>(&mut conn)
        .optional() {
        Ok(product) => product,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "获取产品信息失败"
        })),
    };
    
    match product {
        Some(p) => HttpResponse::Ok().json(ProductResponse::from(p)),
        None => HttpResponse::NotFound().json(json!({
            "message": "产品不存在"
        })),
    }
}

// 创建产品（供应商）
pub async fn create_product(
    req: HttpRequest,
    pool: web::Data<crate::config::database::DbPool>,
    product_dto: web::Json<CreateProductDto>
) -> impl Responder {
    // 从请求扩展中获取Claims
    let extensions = req.extensions();
    let claims = extensions.get::<Claims>();
    
    // 验证用户角色
    match claims {
        Some(claims) if claims.role == UserRole::Vendor || claims.role == UserRole::Admin => {
            // 创建新产品
            let new_product = Product::new(
                product_dto.name.clone(),
                product_dto.description.clone(),
                product_dto.price,
                claims.sub.clone(), // 使用用户ID作为vendor_id
                product_dto.stock,
                product_dto.category.clone(),
            );
            
            // 获取数据库连接
            let mut conn = match pool.get() {
                Ok(conn) => conn,
                Err(_) => return HttpResponse::InternalServerError().json(json!({
                    "message": "无法获取数据库连接"
                })),
            };
            
            // 保存产品到数据库
            let result = diesel::insert_into(products::table)
                .values(&new_product)
                .execute(&mut conn);
                
            match result {
                Ok(_) => {
                    // 查询刚插入的产品
                    let product = products::table
                        .find(new_product.id.clone())
                        .first::<Product>(&mut conn);
                        
                    match product {
                        Ok(p) => HttpResponse::Created().json(ProductResponse::from(p)),
                        Err(_) => HttpResponse::InternalServerError().json(json!({
                            "message": "创建产品成功但获取详情失败"
                        })),
                    }
                },
                Err(_) => HttpResponse::InternalServerError().json(json!({
                    "message": "创建产品失败"
                })),
            }
        },
        _ => HttpResponse::Forbidden().json(json!({
            "message": "无权创建产品"
        })),
    }
}

// 更新产品（供应商）
pub async fn update_product(
    req: HttpRequest,
    pool: web::Data<crate::config::database::DbPool>,
    path: web::Path<String>,
    product_dto: web::Json<UpdateProductDto>
) -> impl Responder {
    let product_id = path.into_inner();
    
    // 从请求扩展中获取Claims
    let extensions = req.extensions();
    let claims = extensions.get::<Claims>();
    
    // 验证用户角色
    match claims {
        Some(claims) if claims.role == UserRole::Vendor || claims.role == UserRole::Admin => {
            // 获取数据库连接
            let mut conn = match pool.get() {
                Ok(conn) => conn,
                Err(_) => return HttpResponse::InternalServerError().json(json!({
                    "message": "无法获取数据库连接"
                })),
            };
            
            // 查询产品
            let product = match products::table
                .find(&product_id)
                .first::<Product>(&mut conn)
                .optional() {
                Ok(product) => product,
                Err(_) => return HttpResponse::InternalServerError().json(json!({
                    "message": "获取产品信息失败"
                })),
            };
            
            match product {
                Some(p) => {
                    // 验证产品所有权
                    if p.vendor_id != claims.sub && claims.role != UserRole::Admin {
                        return HttpResponse::Forbidden().json(json!({
                            "message": "无权更新此产品"
                        }));
                    }
                    
                    // 构建更新数据 - 使用单独的更新操作
                    let mut updates = vec![];
                    
                    if let Some(name) = &product_dto.name {
                        match diesel::update(products::table.find(&product_id))
                            .set(products::name.eq(name))
                            .execute(&mut conn) {
                            Ok(_) => updates.push("name"),
                            Err(_) => return HttpResponse::InternalServerError().json(json!({
                                "message": "更新产品名称失败"
                            })),
                        }
                    }
                    
                    if let Some(description) = &product_dto.description {
                        match diesel::update(products::table.find(&product_id))
                            .set(products::description.eq(description))
                            .execute(&mut conn) {
                            Ok(_) => updates.push("description"),
                            Err(_) => return HttpResponse::InternalServerError().json(json!({
                                "message": "更新产品描述失败"
                            })),
                        }
                    }
                    
                    if let Some(price) = product_dto.price {
                        match diesel::update(products::table.find(&product_id))
                            .set(products::price.eq(price))
                            .execute(&mut conn) {
                            Ok(_) => updates.push("price"),
                            Err(_) => return HttpResponse::InternalServerError().json(json!({
                                "message": "更新产品价格失败"
                            })),
                        }
                    }
                    
                    if let Some(stock) = product_dto.stock {
                        match diesel::update(products::table.find(&product_id))
                            .set(products::stock.eq(stock))
                            .execute(&mut conn) {
                            Ok(_) => updates.push("stock"),
                            Err(_) => return HttpResponse::InternalServerError().json(json!({
                                "message": "更新产品库存失败"
                            })),
                        }
                    }
                    
                    if let Some(category) = &product_dto.category {
                        match diesel::update(products::table.find(&product_id))
                            .set(products::category.eq(category))
                            .execute(&mut conn) {
                            Ok(_) => updates.push("category"),
                            Err(_) => return HttpResponse::InternalServerError().json(json!({
                                "message": "更新产品分类失败"
                            })),
                        }
                    }
                    
                    // 如果没有任何更新，返回原始产品
                    if updates.is_empty() {
                        return HttpResponse::Ok().json(ProductResponse::from(p));
                    }
                    
                    // 获取更新后的产品
                    match products::table.find(&product_id).first::<Product>(&mut conn) {
                        Ok(updated_product) => HttpResponse::Ok().json(ProductResponse::from(updated_product)),
                        Err(_) => HttpResponse::InternalServerError().json(json!({
                            "message": "更新产品成功但获取详情失败"
                        })),
                    }
                },
                None => HttpResponse::NotFound().json(json!({
                    "message": "产品不存在"
                })),
            }
        },
        _ => HttpResponse::Forbidden().json(json!({
            "message": "无权更新产品"
        })),
    }
}

// 删除产品（供应商）
pub async fn delete_product(
    req: HttpRequest,
    pool: web::Data<crate::config::database::DbPool>,
    path: web::Path<String>
) -> impl Responder {
    let product_id = path.into_inner();
    
    // 从请求扩展中获取Claims
    let extensions = req.extensions();
    let claims = extensions.get::<Claims>();
    
    // 验证用户角色
    match claims {
        Some(claims) if claims.role == UserRole::Vendor || claims.role == UserRole::Admin => {
            // 获取数据库连接
            let mut conn = match pool.get() {
                Ok(conn) => conn,
                Err(_) => return HttpResponse::InternalServerError().json(json!({
                    "message": "无法获取数据库连接"
                })),
            };
            
            // 查询产品
            let product = match products::table
                .find(&product_id)
                .first::<Product>(&mut conn)
                .optional() {
                Ok(product) => product,
                Err(_) => return HttpResponse::InternalServerError().json(json!({
                    "message": "获取产品信息失败"
                })),
            };
            
            match product {
                Some(p) => {
                    // 验证产品所有权
                    if p.vendor_id != claims.sub && claims.role != UserRole::Admin {
                        return HttpResponse::Forbidden().json(json!({
                            "message": "无权删除此产品"
                        }));
                    }
                    
                    // 执行删除
                    match diesel::delete(products::table.find(&product_id))
                        .execute(&mut conn) {
                        Ok(_) => HttpResponse::NoContent().finish(),
                        Err(_) => HttpResponse::InternalServerError().json(json!({
                            "message": "删除产品失败"
                        })),
                    }
                },
                None => HttpResponse::NotFound().json(json!({
                    "message": "产品不存在"
                })),
            }
        },
        _ => HttpResponse::Forbidden().json(json!({
            "message": "无权删除产品"
        })),
    }
}

// 获取供应商自己的产品
pub async fn get_vendor_products(
    req: HttpRequest,
    pool: web::Data<crate::config::database::DbPool>
) -> impl Responder {
    // 从请求扩展中获取Claims
    let extensions = req.extensions();
    let claims = extensions.get::<Claims>();
    
    // 验证用户角色
    match claims {
        Some(claims) if claims.role == UserRole::Vendor || claims.role == UserRole::Admin => {
            // 获取数据库连接
            let mut conn = match pool.get() {
                Ok(conn) => conn,
                Err(_) => return HttpResponse::InternalServerError().json(json!({
                    "message": "无法获取数据库连接"
                })),
            };
            
            // 查询产品
            let products = if claims.role == UserRole::Admin {
                // 管理员可以看到所有产品
                products::table
                    .load::<Product>(&mut conn)
            } else {
                // 供应商只能看到自己的产品
                products::table
                    .filter(products::vendor_id.eq(&claims.sub))
                    .load::<Product>(&mut conn)
            };
            
            match products {
                Ok(products) => {
                    // 构建响应
                    let response: Vec<ProductResponse> = products.into_iter()
                        .map(|p| ProductResponse::from(p))
                        .collect();
                    
                    HttpResponse::Ok().json(response)
                },
                Err(_) => HttpResponse::InternalServerError().json(json!({
                    "message": "获取产品列表失败"
                })),
            }
        },
        _ => HttpResponse::Forbidden().json(json!({
            "message": "无权访问"
        })),
    }
}