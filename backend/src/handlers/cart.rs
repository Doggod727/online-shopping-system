use actix_web::{web, HttpResponse, Responder, HttpRequest, HttpMessage};
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};
use diesel::mysql::MysqlConnection;
use serde_json::json;
use uuid::Uuid;

use crate::models::cart::{CartItem, NewCartItem, AddToCartDto, UpdateCartItemDto, CartResponse, CartItemWithProductResponse};
use crate::models::product::Product;
use crate::middleware::get_user_id_from_request;
use crate::schema::{cart_items, products};
use crate::models::user::UserRole;
use crate::config::jwt::Claims;

type DbPool = Pool<ConnectionManager<MysqlConnection>>;

// 获取购物车
pub async fn get_cart(
    req: HttpRequest,
    pool: web::Data<DbPool>,
) -> impl Responder {
    // 检查用户角色，禁止管理员访问购物车功能
    if let Some(claims) = req.extensions().get::<Claims>() {
        if claims.role == UserRole::Admin {
            return HttpResponse::Forbidden().json(json!({
                "message": "管理员不能使用购物车功能"
            }));
        }
    }

    let user_id = match get_user_id_from_request(&req) {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().json(json!({
            "message": "无法获取用户ID"
        })),
    };

    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "数据库连接错误"
        })),
    };

    // 获取用户购物车物品
    let cart_items_result = cart_items::table
        .filter(cart_items::user_id.eq(&user_id))
        .select(CartItem::as_select())
        .load(&mut conn);

    let cart_items = match cart_items_result {
        Ok(items) => items,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "读取购物车失败"
        })),
    };

    if cart_items.is_empty() {
        return HttpResponse::Ok().json(CartResponse {
            items: vec![],
            total: 0.0,
        });
    }

    // 获取所有产品ID
    let product_ids: Vec<String> = cart_items.iter()
        .map(|item| item.product_id.clone())
        .collect();

    // 查询相关产品
    let products_result = products::table
        .filter(products::id.eq_any(&product_ids))
        .select(Product::as_select())
        .load(&mut conn);

    let products = match products_result {
        Ok(p) => p,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "读取产品信息失败"
        })),
    };

    // 创建购物车响应
    let mut cart_response_items: Vec<CartItemWithProductResponse> = Vec::new();
    let mut total: f64 = 0.0;

    for cart_item in cart_items {
        if let Some(product) = products.iter().find(|p| p.id == cart_item.product_id) {
            let subtotal = product.price * cart_item.quantity as f64;
            total += subtotal;

            cart_response_items.push(CartItemWithProductResponse {
                id: cart_item.id,
                product_id: product.id.clone(),
                product_name: product.name.clone(),
                product_price: product.price,
                quantity: cart_item.quantity,
                subtotal,
            });
        }
    }

    HttpResponse::Ok().json(CartResponse {
        items: cart_response_items,
        total,
    })
}

// 添加到购物车
pub async fn add_to_cart(
    req: HttpRequest,
    pool: web::Data<DbPool>,
    cart_dto: web::Json<AddToCartDto>,
) -> impl Responder {
    // 检查用户角色，禁止管理员访问购物车功能
    if let Some(claims) = req.extensions().get::<Claims>() {
        if claims.role == UserRole::Admin {
            return HttpResponse::Forbidden().json(json!({
                "message": "管理员不能使用购物车功能"
            }));
        }
    }

    let user_id = match get_user_id_from_request(&req) {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().json(json!({
            "message": "无法获取用户ID"
        })),
    };

    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "数据库连接错误"
        })),
    };

    // 检查产品是否存在
    let product_exists = products::table
        .find(&cart_dto.product_id)
        .select(Product::as_select())
        .first(&mut conn)
        .is_ok();

    if !product_exists {
        return HttpResponse::NotFound().json(json!({
            "message": "产品不存在"
        }));
    }

    // 检查购物车中是否已有该产品
    let existing_item_result = cart_items::table
        .filter(cart_items::user_id.eq(&user_id))
        .filter(cart_items::product_id.eq(&cart_dto.product_id))
        .select(CartItem::as_select())
        .first(&mut conn);

    match existing_item_result {
        Ok(mut item) => {
            // 更新现有项
            let new_quantity = item.quantity + cart_dto.quantity;
            if new_quantity <= 0 {
                // 如果数量为零或负数，删除项目
                match diesel::delete(cart_items::table.find(&item.id))
                    .execute(&mut conn) {
                    Ok(_) => {
                        return HttpResponse::Ok().json(json!({
                            "message": "已从购物车中删除项目",
                            "removed": true
                        }));
                    },
                    Err(_) => {
                        return HttpResponse::InternalServerError().json(json!({
                            "message": "无法从购物车中删除项目"
                        }));
                    }
                }
            }

            // 更新数量
            item.quantity = new_quantity;
            match diesel::update(cart_items::table.find(&item.id))
                .set(cart_items::quantity.eq(new_quantity))
                .execute(&mut conn) {
                Ok(_) => {
                    HttpResponse::Ok().json(json!({
                        "message": "购物车已更新",
                        "cart_item": item
                    }))
                },
                Err(_) => {
                    HttpResponse::InternalServerError().json(json!({
                        "message": "更新购物车失败"
                    }))
                }
            }
        },
        Err(_) => {
            // 创建新项目
            if cart_dto.quantity <= 0 {
                return HttpResponse::BadRequest().json(json!({
                    "message": "数量必须大于0"
                }));
            }

            let now = chrono::Utc::now();
            let new_item = NewCartItem {
                id: Uuid::new_v4().to_string(),
                user_id: user_id.clone(),
                product_id: cart_dto.product_id.clone(),
                quantity: cart_dto.quantity,
                created_at: now.naive_utc(),
                updated_at: now.naive_utc(),
            };

            match diesel::insert_into(cart_items::table)
                .values(&new_item)
                .execute(&mut conn) {
                Ok(_) => {
                    // 查询并返回新创建的项目
                    match cart_items::table
                        .find(&new_item.id)
                        .select(CartItem::as_select())
                        .first(&mut conn) {
                        Ok(new_cart_item) => {
                            HttpResponse::Created().json(json!({
                                "message": "已添加到购物车",
                                "cart_item": new_cart_item
                            }))
                        },
                        Err(_) => {
                            HttpResponse::InternalServerError().json(json!({
                                "message": "无法检索新创建的购物车项目"
                            }))
                        }
                    }
                },
                Err(_) => HttpResponse::InternalServerError().json(json!({
                    "message": "无法添加到购物车"
                })),
            }
        }
    }
}

// 更新购物车项目
pub async fn update_cart_item(
    req: HttpRequest,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    update_dto: web::Json<UpdateCartItemDto>,
) -> impl Responder {
    // 检查用户角色，禁止管理员访问购物车功能
    if let Some(claims) = req.extensions().get::<Claims>() {
        if claims.role == UserRole::Admin {
            return HttpResponse::Forbidden().json(json!({
                "message": "管理员不能使用购物车功能"
            }));
        }
    }

    let user_id = match get_user_id_from_request(&req) {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().json(json!({
            "message": "无法获取用户ID"
        })),
    };

    let item_id = path.into_inner();
    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "数据库连接错误"
        })),
    };

    // 验证项目存在并属于用户
    let item_result = cart_items::table
        .find(&item_id)
        .filter(cart_items::user_id.eq(&user_id))
        .select(CartItem::as_select())
        .first(&mut conn);

    match item_result {
        Ok(item) => {
            if update_dto.quantity <= 0 {
                // 如果数量为零或负数，删除项目
                match diesel::delete(cart_items::table.find(&item.id))
                    .execute(&mut conn) {
                    Ok(_) => {
                        return HttpResponse::Ok().json(json!({
                            "message": "已从购物车中删除项目",
                            "removed": true
                        }));
                    },
                    Err(_) => {
                        return HttpResponse::InternalServerError().json(json!({
                            "message": "无法从购物车中删除项目"
                        }));
                    }
                }
            }

            // 更新数量
            match diesel::update(cart_items::table.find(&item.id))
                .set(cart_items::quantity.eq(update_dto.quantity))
                .execute(&mut conn) {
                Ok(_) => {
                    // 获取更新后的项目
                    match cart_items::table
                        .find(&item.id)
                        .select(CartItem::as_select())
                        .first(&mut conn) {
                        Ok(updated_item) => {
                            HttpResponse::Ok().json(json!({
                                "message": "购物车已更新",
                                "cart_item": updated_item
                            }))
                        },
                        Err(_) => {
                            HttpResponse::InternalServerError().json(json!({
                                "message": "无法检索更新后的购物车项目"
                            }))
                        }
                    }
                },
                Err(_) => {
                    HttpResponse::InternalServerError().json(json!({
                        "message": "更新购物车失败"
                    }))
                }
            }
        },
        Err(_) => HttpResponse::NotFound().json(json!({
            "message": "购物车项目不存在或不属于当前用户"
        })),
    }
}

// 从购物车中删除
pub async fn remove_from_cart(
    req: HttpRequest,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    // 检查用户角色，禁止管理员访问购物车功能
    if let Some(claims) = req.extensions().get::<Claims>() {
        if claims.role == UserRole::Admin {
            return HttpResponse::Forbidden().json(json!({
                "message": "管理员不能使用购物车功能"
            }));
        }
    }

    let user_id = match get_user_id_from_request(&req) {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().json(json!({
            "message": "无法获取用户ID"
        })),
    };

    let item_id = path.into_inner();
    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "数据库连接错误"
        })),
    };

    // 验证项目存在并属于用户
    let item_exists = cart_items::table
        .find(&item_id)
        .filter(cart_items::user_id.eq(&user_id))
        .select(CartItem::as_select())
        .first(&mut conn)
        .is_ok();

    if !item_exists {
        return HttpResponse::NotFound().json(json!({
            "message": "购物车项目不存在或不属于当前用户"
        }));
    }

    // 删除项目
    match diesel::delete(cart_items::table.find(&item_id))
        .execute(&mut conn) {
        Ok(_) => HttpResponse::Ok().json(json!({
            "message": "已从购物车中删除项目"
        })),
        Err(_) => HttpResponse::InternalServerError().json(json!({
            "message": "无法从购物车中删除项目"
        })),
    }
}

// 结账
pub async fn checkout(
    req: HttpRequest,
    pool: web::Data<DbPool>,
) -> impl Responder {
    // 检查用户角色，禁止管理员访问购物车功能
    if let Some(claims) = req.extensions().get::<Claims>() {
        if claims.role == UserRole::Admin {
            return HttpResponse::Forbidden().json(json!({
                "message": "管理员不能使用购物车功能"
            }));
        }
    }

    let user_id = match get_user_id_from_request(&req) {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().json(json!({
            "message": "无法获取用户ID"
        })),
    };

    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "数据库连接错误"
        })),
    };

    // 1. 获取所有购物车项目
    let cart_items_result = cart_items::table
        .filter(cart_items::user_id.eq(&user_id))
        .select(CartItem::as_select())
        .load(&mut conn);

    let cart_items = match cart_items_result {
        Ok(items) => items,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "读取购物车失败"
        })),
    };

    if cart_items.is_empty() {
        return HttpResponse::BadRequest().json(json!({
            "message": "购物车为空，无法结账"
        }));
    }

    // 获取所有产品ID
    let product_ids: Vec<String> = cart_items.iter()
        .map(|item| item.product_id.clone())
        .collect();

    // 查询相关产品
    let products_result = products::table
        .filter(products::id.eq_any(&product_ids))
        .select(Product::as_select())
        .load(&mut conn);

    let products = match products_result {
        Ok(p) => p,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "读取产品信息失败"
        })),
    };

    // 2. 检查库存
    let mut unavailable_products = Vec::new();
    for cart_item in &cart_items {
        if let Some(product) = products.iter().find(|p| p.id == cart_item.product_id) {
            if product.stock < cart_item.quantity {
                unavailable_products.push(json!({
                    "product_id": product.id,
                    "product_name": product.name,
                    "requested_quantity": cart_item.quantity,
                    "available_stock": product.stock
                }));
            }
        } else {
            unavailable_products.push(json!({
                "product_id": cart_item.product_id,
                "message": "产品不存在"
            }));
        }
    }

    if !unavailable_products.is_empty() {
        return HttpResponse::BadRequest().json(json!({
            "message": "部分产品库存不足或不可用",
            "unavailable_products": unavailable_products
        }));
    }

    // 开始事务
    let transaction_result = conn.transaction::<_, diesel::result::Error, _>(|conn| {
        // 3. 创建订单
        let now = chrono::Utc::now().naive_utc();
        let order_id = Uuid::new_v4().to_string();
        
        // 计算订单总价
        let mut total: f64 = 0.0;
        let mut order_items_to_insert = Vec::new();
        
        for cart_item in &cart_items {
            if let Some(product) = products.iter().find(|p| p.id == cart_item.product_id) {
                let item_price = product.price;
                let subtotal = item_price * cart_item.quantity as f64;
                total += subtotal;
                
                // 创建订单项
                let order_item = crate::models::order::NewOrderItem {
                    id: Uuid::new_v4().to_string(),
                    order_id: order_id.clone(),
                    product_id: product.id.clone(),
                    quantity: cart_item.quantity,
                    price: item_price,
                };
                
                order_items_to_insert.push(order_item);
            }
        }
        
        // 创建订单记录
        let new_order = crate::models::order::NewOrder {
            id: order_id.clone(),
            user_id: user_id.clone(),
            total,
            status: crate::models::order::OrderStatus::Pending.to_string(),
            created_at: now,
            updated_at: now,
        };
        
        // 插入订单
        diesel::insert_into(crate::schema::orders::table)
            .values(&new_order)
            .execute(conn)?;
        
        // 插入订单项
        for order_item in &order_items_to_insert {
            diesel::insert_into(crate::schema::order_items::table)
                .values(order_item)
                .execute(conn)?;
        }
        
        // 4. 更新产品库存
        for cart_item in &cart_items {
            diesel::update(products::table.find(&cart_item.product_id))
                .set(products::stock.eq(products::stock - cart_item.quantity))
                .execute(conn)?;
        }
        
        // 5. 清空购物车
        diesel::delete(cart_items::table.filter(cart_items::user_id.eq(&user_id)))
            .execute(conn)?;
        
        Ok(order_id)
    });

    // 处理事务结果
    match transaction_result {
        Ok(order_id) => {
            // 6. 返回新订单信息
            // 获取创建的订单详情
            match crate::schema::orders::table
                .find(&order_id)
                .first::<crate::models::order::Order>(&mut conn) {
                Ok(order) => {
                    // 获取订单项
                    match crate::schema::order_items::table
                        .filter(crate::schema::order_items::order_id.eq(&order_id))
                        .load::<crate::models::order::OrderItem>(&mut conn) {
                        Ok(items) => {
                            let order_status = order.get_status().unwrap_or(crate::models::order::OrderStatus::Pending);
                            
                            // 构建订单响应
                            let item_responses: Vec<crate::models::order::OrderItemResponse> = items
                                .into_iter()
                                .map(|item| crate::models::order::OrderItemResponse {
                                    id: item.id,
                                    product_id: item.product_id,
                                    quantity: item.quantity,
                                    price: item.price,
                                })
                                .collect();
                            
                            let order_response = crate::models::order::OrderResponse {
                                id: order.id,
                                user_id: order.user_id,
                                total: order.total,
                                status: order_status,
                                items: item_responses,
                                created_at: order.created_at,
                                updated_at: order.updated_at,
                            };
                            
                            HttpResponse::Created().json(json!({
                                "message": "订单创建成功",
                                "order": order_response
                            }))
                        },
                        Err(_) => HttpResponse::InternalServerError().json(json!({
                            "message": "订单创建成功但无法获取订单详情",
                            "order_id": order_id
                        })),
                    }
                },
                Err(_) => HttpResponse::InternalServerError().json(json!({
                    "message": "订单创建成功但无法获取订单详情",
                    "order_id": order_id
                })),
            }
        },
        Err(_) => HttpResponse::InternalServerError().json(json!({
            "message": "订单创建失败"
        })),
    }
} 