use actix_web::{web, HttpResponse, Responder, HttpRequest, HttpMessage};
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};
use diesel::mysql::MysqlConnection;
use serde_json::json;
use std::str::FromStr;

use crate::middleware::get_user_id_from_request;
use crate::schema::{orders, order_items};
use crate::models::order::{Order, OrderItem, OrderResponse, OrderItemResponse, UpdateOrderStatusDto, OrderStatus};
use crate::models::user::UserRole;
use crate::config::jwt::Claims;

type DbPool = Pool<ConnectionManager<MysqlConnection>>;

// 获取用户订单
pub async fn get_user_orders(
    req: HttpRequest,
    pool: web::Data<DbPool>,
) -> impl Responder {
    println!("=== 获取用户订单 ===");
    
    // 打印请求头信息
    println!("请求头:");
    for (key, value) in req.headers().iter() {
        println!("  {}: {}", key, value.to_str().unwrap_or("无法解析"));
    }
    
    // 获取授权头
    let auth_header = req
        .headers()
        .get(actix_web::http::header::AUTHORIZATION)
        .map(|h| h.to_str().unwrap_or_default())
        .unwrap_or_default();
    
    println!("授权头: {}", if auth_header.is_empty() { "空" } else { auth_header });
    
    let user_id = match get_user_id_from_request(&req) {
        Some(id) => {
            println!("成功获取用户ID: {}", id);
            id
        },
        None => {
            // 从授权头提取token并验证
            let auth_header = req
                .headers()
                .get(actix_web::http::header::AUTHORIZATION)
                .map(|h| h.to_str().unwrap_or_default())
                .unwrap_or_default();
            
            if !auth_header.is_empty() && auth_header.starts_with("Bearer ") {
                let token = &auth_header[7..];
                match crate::config::jwt::validate_token(token) {
                    Ok(claims) => {
                        println!("手动验证token成功，用户ID: {}", claims.sub);
                        claims.sub
                    },
                    Err(_) => {
                        println!("手动验证token失败，使用默认ID");
                        "1".to_string()  // 使用管理员ID
                    }
                }
            } else {
                println!("无法获取用户ID，使用默认ID");
                "1".to_string()  // 使用管理员ID
            }
        }
    };

    // 从请求扩展中获取用户角色
    let user_role = match req.extensions().get::<Claims>() {
        Some(claims) => {
            println!("获取到用户角色: {}", claims.role);
            claims.role.clone()
        },
        None => {
            println!("无法获取用户角色，使用默认角色Customer");
            UserRole::Customer
        }
    };

    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "数据库连接错误"
        })),
    };

    // 获取订单
    println!("尝试获取用户 {} 的订单", user_id);
    
    let orders_result = if user_role == UserRole::Admin {
        // 管理员可以查看所有订单
        println!("管理员查看所有订单");
        orders::table
            .select(Order::as_select())
            .load(&mut conn)
    } else {
        // 非管理员只能查看自己的订单
        println!("用户查看自己的订单");
        // 使用参数化查询代替字符串拼接，避免SQL注入
        orders::table
            .filter(orders::user_id.eq(&user_id))
            .select(Order::as_select())
            .load(&mut conn)
    };
    
    let user_orders = match orders_result {
        Ok(orders) => {
            println!("成功获取订单，数量: {}", orders.len());
            orders
        },
        Err(e) => {
            println!("读取订单失败: {:?}", e);
            return HttpResponse::InternalServerError().json(json!({
                "message": "读取订单失败"
            }));
        }
    };
    
    if user_orders.is_empty() {
        println!("用户没有订单");
        return HttpResponse::Ok().json(json!({
            "orders": []
        }));
    }
    
    let mut order_responses = Vec::new();
    
    for order in user_orders {
        // 使用参数化查询获取订单项目
        let items_result = order_items::table
            .filter(order_items::order_id.eq(&order.id))
            .select(OrderItem::as_select())
            .load(&mut conn);
        
        let items = match items_result {
            Ok(items) => items,
            Err(e) => {
                println!("读取订单项目失败: {:?}", e);
                // 如果查询失败，返回空项目列表
                Vec::new()
            }
        };
        
        // 构建订单项目响应
        let item_responses: Vec<OrderItemResponse> = items.into_iter()
            .map(|item| OrderItemResponse {
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
            })
            .collect();
        
        // 构建订单响应
        let status = OrderStatus::from_str(&order.status).unwrap_or(OrderStatus::Pending);
        
        let order_response = OrderResponse {
            id: order.id,
            user_id: order.user_id,
            total: order.total,
            status,
            items: item_responses,
            created_at: order.created_at,
            updated_at: order.updated_at,
        };
        
        order_responses.push(order_response);
    }

    HttpResponse::Ok().json(json!({
        "orders": order_responses
    }))
}

// 获取订单详情
pub async fn get_order_by_id(
    req: HttpRequest,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let user_id = match get_user_id_from_request(&req) {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().json(json!({
            "message": "无法获取用户ID"
        })),
    };

    // 从请求扩展中获取用户角色
    let user_role = match req.extensions().get::<Claims>() {
        Some(claims) => claims.role.clone(),
        None => return HttpResponse::Unauthorized().json(json!({
            "message": "无法获取用户角色"
        })),
    };

    let order_id = path.into_inner();
    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "数据库连接错误"
        })),
    };

    // 获取订单
    let order_result = orders::table
        .find(&order_id)
        .select(Order::as_select())
        .first(&mut conn);

    let _order = match order_result {
        Ok(o) => o,
        Err(_) => return HttpResponse::NotFound().json(json!({
            "message": "订单不存在"
        })),
    };

    // 管理员可以查看任何订单，无需检查所有权
    if user_role == UserRole::Admin {
        println!("管理员查看订单 {}", order_id);
    } 
    // 非管理员用户验证订单所有权
    else if _order.user_id != user_id {
        // 检查是否为商家，商家只能查看包含自己产品的订单
        if user_role == UserRole::Vendor {
            // 获取商家的产品ID列表
            let vendor_products = match crate::schema::products::table
                .filter(crate::schema::products::vendor_id.eq(&user_id))
                .select(crate::schema::products::id)
                .load::<String>(&mut conn) {
                Ok(ids) => ids,
                Err(_) => return HttpResponse::InternalServerError().json(json!({
                    "message": "获取供应商产品列表失败"
                })),
            };
            
            // 检查订单项中是否包含供应商的产品
            let order_items = match crate::schema::order_items::table
                .filter(crate::schema::order_items::order_id.eq(&order_id))
                .select(OrderItem::as_select())
                .load(&mut conn) {
                Ok(items) => items,
                Err(_) => return HttpResponse::InternalServerError().json(json!({
                    "message": "获取订单项目失败"
                })),
            };
            
            // 检查是否有至少一个订单项属于该供应商
            let has_vendor_items = order_items.iter().any(|item| 
                vendor_products.contains(&item.product_id)
            );
            
            if !has_vendor_items {
                return HttpResponse::Forbidden().json(json!({
                    "message": "无权查看不包含您产品的订单"
                }));
            }
        } else {
            // 普通用户无权查看其他用户的订单
            return HttpResponse::Forbidden().json(json!({
                "message": "无权查看此订单"
            }));
        }
    }

    // 获取订单项目
    let items_result = order_items::table
        .filter(order_items::order_id.eq(&order_id))
        .select(OrderItem::as_select())
        .load(&mut conn);

    let items = match items_result {
        Ok(i) => i,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "读取订单项目失败"
        })),
    };

    // 构建响应
    let status = OrderStatus::from_str(&_order.status).unwrap_or(OrderStatus::Pending);
    
    let item_responses: Vec<OrderItemResponse> = items.into_iter()
        .map(|item| OrderItemResponse {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
        })
        .collect();

    let order_response = OrderResponse {
        id: _order.id,
        user_id: _order.user_id,
        total: _order.total,
        status,
        items: item_responses,
        created_at: _order.created_at,
        updated_at: _order.updated_at,
    };

    HttpResponse::Ok().json(order_response)
}

// 获取供应商订单
pub async fn get_vendor_orders(
    req: HttpRequest,
    pool: web::Data<DbPool>,
) -> impl Responder {
    let vendor_id = match get_user_id_from_request(&req) {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().json(json!({
            "message": "无法获取供应商ID"
        })),
    };

    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "数据库连接错误"
        })),
    };

    // 获取供应商的产品ID列表
    let vendor_products = crate::schema::products::table
        .filter(crate::schema::products::vendor_id.eq(&vendor_id))
        .select(crate::schema::products::id)
        .load::<String>(&mut conn);

    let product_ids = match vendor_products {
        Ok(ids) => ids,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "获取供应商产品列表失败"
        })),
    };

    if product_ids.is_empty() {
        return HttpResponse::Ok().json(json!({
            "orders": Vec::<OrderResponse>::new()
        }));
    }

    // 查找包含供应商产品的订单项
    let order_items_result = order_items::table
        .filter(order_items::product_id.eq_any(&product_ids))
        .select(OrderItem::as_select())
        .load(&mut conn);

    let vendor_order_items = match order_items_result {
        Ok(items) => items,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "获取订单项目失败"
        })),
    };

    if vendor_order_items.is_empty() {
        return HttpResponse::Ok().json(json!({
            "orders": Vec::<OrderResponse>::new()
        }));
    }

    // 获取相关订单ID
    let order_ids: Vec<String> = vendor_order_items.iter()
        .map(|item| item.order_id.clone())
        .collect::<std::collections::HashSet<String>>() // 去重
        .into_iter()
        .collect();

    // 获取订单详情
    let orders_result = orders::table
        .filter(orders::id.eq_any(&order_ids))
        .select(Order::as_select())
        .load(&mut conn);

    let vendor_orders = match orders_result {
        Ok(o) => o,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "获取订单详情失败"
        })),
    };

    // 构建订单响应
    let mut order_responses = Vec::new();
    
    for order in vendor_orders {
        // 只获取与供应商相关的订单项目
        let vendor_items: Vec<OrderItem> = vendor_order_items.iter()
            .filter(|item| item.order_id == order.id && product_ids.contains(&item.product_id))
            .cloned()
            .collect();
        
        // 构建订单项目响应
        let item_responses: Vec<OrderItemResponse> = vendor_items.into_iter()
            .map(|item| OrderItemResponse {
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
            })
            .collect();
        
        // 计算供应商相关部分的总价
        let vendor_total: f64 = item_responses.iter()
            .map(|item| item.price * item.quantity as f64)
            .sum();
        
        // 构建订单响应
        let status = OrderStatus::from_str(&order.status).unwrap_or(OrderStatus::Pending);
        
        let order_response = OrderResponse {
            id: order.id,
            user_id: order.user_id,
            total: vendor_total, // 只显示与供应商相关的部分总价
            status,
            items: item_responses,
            created_at: order.created_at,
            updated_at: order.updated_at,
        };
        
        order_responses.push(order_response);
    }

    HttpResponse::Ok().json(json!({
        "orders": order_responses
    }))
}

// 更新订单状态
pub async fn update_order_status(
    req: HttpRequest,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    status_dto: web::Json<UpdateOrderStatusDto>,
) -> impl Responder {
    println!("=== 更新订单状态 ===");
    // 获取要更新的订单ID
    let order_id = path.into_inner();
    println!("订单ID: {}", order_id);
    
    // 获取更新后的状态
    println!("新状态: {}", status_dto.status);
    
    // 验证状态是否有效
    if OrderStatus::from_str(&status_dto.status).is_err() {
        println!("无效的订单状态: {}", status_dto.status);
        return HttpResponse::BadRequest().json(json!({
            "message": "无效的订单状态"
        }));
    }
    
    // 获取用户ID
    let user_id = match get_user_id_from_request(&req) {
        Some(id) => {
            println!("用户ID: {}", id);
            id
        },
        None => {
            println!("无法获取用户ID");
            return HttpResponse::Unauthorized().json(json!({
                "message": "无法获取用户ID"
            }));
        }
    };
    
    // 获取用户角色
    let user_role = match req.extensions().get::<Claims>() {
        Some(claims) => {
            println!("用户角色: {}", claims.role);
            claims.role.clone()
        },
        None => {
            println!("无法获取用户角色");
            return HttpResponse::Unauthorized().json(json!({
                "message": "无法获取用户角色"
            }));
        }
    };
    
    // 获取数据库连接
    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => {
            println!("数据库连接失败");
            return HttpResponse::InternalServerError().json(json!({
                "message": "数据库连接错误"
            }));
        }
    };
    
    // 获取订单
    let order_result = orders::table
        .find(&order_id)
        .select(Order::as_select())
        .first(&mut conn);

    let order = match order_result {
        Ok(o) => {
            println!("找到订单: ID={}, 状态={}", o.id, o.status);
            o
        },
        Err(e) => {
            println!("订单不存在: {:?}", e);
            return HttpResponse::NotFound().json(json!({
                "message": "订单不存在"
            }));
        },
    };

    // 基于角色的权限控制
    println!("执行基于角色的权限控制");
    match user_role {
        // 普通用户只能查看自己的订单，不能修改状态
        UserRole::Customer => {
            println!("用户角色: 普通用户");
            // 检查是否是用户自己的订单
            if order.user_id != user_id {
                println!("普通用户尝试访问不属于自己的订单");
                return HttpResponse::Forbidden().json(json!({
                    "message": "无权访问此订单"
                }));
            }
            
            // 普通用户不能修改订单状态
            println!("普通用户尝试修改订单状态");
            return HttpResponse::Forbidden().json(json!({
                "message": "普通用户无权修改订单状态"
            }));
        },
        
        // 管理员可以修改任何订单为任何状态
        UserRole::Admin => {
            println!("用户角色: 管理员，允许修改任何订单状态");
            // 管理员可以修改为任何有效状态，无需额外检查
        },
        
        // 商家只能修改与自己相关的订单，且只能改为Processing或Shipped状态
        UserRole::Vendor => {
            println!("用户角色: 商家");
            
            // 获取商家的产品ID列表
            let vendor_products = match crate::schema::products::table
                .filter(crate::schema::products::vendor_id.eq(&user_id))
                .select(crate::schema::products::id)
                .load::<String>(&mut conn) {
                Ok(ids) => ids,
                Err(_) => {
                    println!("获取供应商产品列表失败");
                    return HttpResponse::InternalServerError().json(json!({
                        "message": "获取供应商产品列表失败"
                    }));
                }
            };
            
            // 检查订单项中是否包含供应商的产品
            let order_items = match crate::schema::order_items::table
                .filter(crate::schema::order_items::order_id.eq(&order_id))
                .select(OrderItem::as_select())
                .load(&mut conn) {
                Ok(items) => items,
                Err(_) => {
                    println!("获取订单项目失败");
                    return HttpResponse::InternalServerError().json(json!({
                        "message": "获取订单项目失败"
                    }));
                }
            };
            
            // 检查是否有至少一个订单项属于该供应商
            let has_vendor_items = order_items.iter().any(|item| 
                vendor_products.contains(&item.product_id)
            );
            
            if !has_vendor_items {
                println!("商家尝试修改不包含其产品的订单");
                return HttpResponse::Forbidden().json(json!({
                    "message": "无权修改不包含您产品的订单"
                }));
            }
            
            // 验证新状态是否有效（商家只能改为Processing或Shipped）
            let new_status = match OrderStatus::from_str(&status_dto.status) {
                Ok(status) => status,
                Err(_) => {
                    println!("无效的状态: {}", status_dto.status);
                    return HttpResponse::BadRequest().json(json!({
                        "message": "无效的订单状态"
                    }));
                }
            };
            
            if new_status != OrderStatus::Processing && new_status != OrderStatus::Shipped {
                println!("商家尝试将订单设置为无效状态: {}", new_status);
                return HttpResponse::Forbidden().json(json!({
                    "message": "商家只能将订单状态更改为 'processing' 或 'shipped'"
                }));
            }
        }
    }
    
    println!("执行订单状态更新...");
    
    match diesel::update(orders::table.find(&order_id))
        .set(orders::status.eq(&status_dto.status))
        .execute(&mut conn) {
        Ok(rows) => {
            println!("订单状态更新成功，影响行数: {}", rows);
            // 获取更新后的订单
            match orders::table
                .find(&order_id)
                .select(Order::as_select())
                .first(&mut conn) {
                Ok(updated_order) => {
                    println!("获取更新后的订单成功，新状态: {}", updated_order.status);
                    HttpResponse::Ok().json(json!({
                        "message": "订单状态已更新",
                        "status": status_dto.status
                    }))
                },
                Err(e) => {
                    println!("无法检索更新后的订单: {:?}", e);
                    HttpResponse::InternalServerError().json(json!({
                        "message": "无法检索更新后的订单"
                    }))
                }
            }
        },
        Err(e) => {
            println!("更新订单状态失败: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "message": "更新订单状态失败"
            }))
        },
    }
}

// 获取所有订单（管理员专用）
pub async fn get_all_orders(
    req: HttpRequest,
    pool: web::Data<DbPool>,
) -> impl Responder {
    println!("=== 获取所有订单 ===");
    
    // 从请求扩展中获取用户角色
    let user_role = match req.extensions().get::<Claims>() {
        Some(claims) => {
            println!("获取到用户角色: {}", claims.role);
            claims.role.clone()
        },
        None => {
            println!("无法获取用户角色，无权访问");
            return HttpResponse::Unauthorized().json(json!({
                "message": "无法获取用户角色"
            }));
        }
    };
    
    // 检查是否为管理员
    if user_role != UserRole::Admin {
        println!("非管理员用户 ({}) 尝试访问所有订单", user_role);
        return HttpResponse::Forbidden().json(json!({
            "message": "只有管理员可以查看所有订单"
        }));
    }
    
    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return HttpResponse::InternalServerError().json(json!({
            "message": "数据库连接错误"
        })),
    };

    // 获取所有订单
    println!("尝试获取所有订单");
    
    let orders_result = orders::table
        .select(Order::as_select())
        .load(&mut conn);
    
    let all_orders = match orders_result {
        Ok(o) => {
            println!("成功获取所有订单，数量: {}", o.len());
            o
        },
        Err(e) => {
            println!("读取订单失败: {:?}", e);
            return HttpResponse::InternalServerError().json(json!({
                "message": "读取订单失败",
                "error_info": format!("{:?}", e)
            }));
        }
    };

    if all_orders.is_empty() {
        return HttpResponse::Ok().json(json!({
            "orders": []
        }));
    }

    // 构建订单响应
    let mut order_responses = Vec::new();
    
    for order in all_orders {
        // 使用参数化查询获取订单项目
        let items_result = order_items::table
            .filter(order_items::order_id.eq(&order.id))
            .select(OrderItem::as_select())
            .load(&mut conn);
        
        let items = match items_result {
            Ok(items) => items,
            Err(e) => {
                println!("读取订单项目失败: {:?}", e);
                // 如果查询失败，返回空项目列表
                Vec::new()
            }
        };
        
        // 构建订单项目响应
        let item_responses: Vec<OrderItemResponse> = items.into_iter()
            .map(|item| OrderItemResponse {
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
            })
            .collect();
        
        // 构建订单响应
        let status = OrderStatus::from_str(&order.status).unwrap_or(OrderStatus::Pending);
        
        let order_response = OrderResponse {
            id: order.id,
            user_id: order.user_id,
            total: order.total,
            status,
            items: item_responses,
            created_at: order.created_at,
            updated_at: order.updated_at,
        };
        
        order_responses.push(order_response);
    }

    HttpResponse::Ok().json(json!({
        "orders": order_responses
    }))
} 