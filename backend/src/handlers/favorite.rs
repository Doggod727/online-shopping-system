use actix_web::{web, HttpResponse, Responder, HttpRequest, HttpMessage};
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager};
use diesel::mysql::MysqlConnection;
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;
use crate::schema::{favorites, products};
use crate::models::favorite::{Favorite, NewFavorite, FavoriteResponse, ProductInfo};
use crate::models::product::Product;
use crate::config::jwt::Claims;

type DbPool = r2d2::Pool<ConnectionManager<MysqlConnection>>;

// 从请求中获取用户ID
fn get_user_id_from_request(req: &HttpRequest) -> Option<String> {
    req.extensions().get::<Claims>().map(|claims| claims.sub.clone())
}

// 添加商品到收藏夹
pub async fn add_to_favorites(
    req: HttpRequest,
    pool: web::Data<DbPool>,
    product_dto: web::Json<AddToFavoritesDto>,
) -> impl Responder {
    println!("=== 添加商品到收藏夹 ===");
    
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
    
    // 检查用户是否为普通用户
    if user_role.to_string().to_lowercase() != "customer" {
        println!("非普通用户尝试使用收藏功能");
        return HttpResponse::Forbidden().json(json!({
            "message": "只有普通用户可以使用收藏功能"
        }));
    }
    
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
    
    // 检查商品是否存在
    let product_exists = match products::table
        .find(&product_dto.product_id)
        .select(products::id)
        .first::<String>(&mut conn) {
        Ok(_) => true,
        Err(_) => false
    };
    
    if !product_exists {
        println!("商品不存在: {}", product_dto.product_id);
        return HttpResponse::NotFound().json(json!({
            "message": "商品不存在"
        }));
    }
    
    // 检查是否已经收藏过该商品
    let already_favorited = favorites::table
        .filter(favorites::user_id.eq(&user_id))
        .filter(favorites::product_id.eq(&product_dto.product_id))
        .select(favorites::id)
        .first::<String>(&mut conn)
        .is_ok();
    
    if already_favorited {
        println!("商品已经在收藏夹中: {}", product_dto.product_id);
        return HttpResponse::BadRequest().json(json!({
            "message": "该商品已经在收藏夹中"
        }));
    }
    
    // 创建新收藏记录
    let new_favorite = NewFavorite::new(user_id, product_dto.product_id.clone());
    
    // 插入收藏记录
    match diesel::insert_into(favorites::table)
        .values(&new_favorite)
        .execute(&mut conn) {
        Ok(_) => {
            println!("商品成功添加到收藏夹");
            HttpResponse::Created().json(json!({
                "message": "商品已添加到收藏夹",
                "favorite_id": new_favorite.id
            }))
        },
        Err(e) => {
            println!("添加收藏失败: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "message": "添加收藏失败"
            }))
        }
    }
}

// 从收藏夹移除商品
pub async fn remove_from_favorites(
    req: HttpRequest,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    println!("=== 从收藏夹移除商品 ===");
    
    let product_id = path.into_inner();
    println!("商品ID: {}", product_id);
    
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
    
    // 检查用户是否为普通用户
    if user_role.to_string().to_lowercase() != "customer" {
        println!("非普通用户尝试使用收藏功能");
        return HttpResponse::Forbidden().json(json!({
            "message": "只有普通用户可以使用收藏功能"
        }));
    }
    
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
    
    // 删除收藏记录
    match diesel::delete(
        favorites::table
            .filter(favorites::user_id.eq(&user_id))
            .filter(favorites::product_id.eq(&product_id))
    ).execute(&mut conn) {
        Ok(count) => {
            if count > 0 {
                println!("商品已从收藏夹移除");
                HttpResponse::Ok().json(json!({
                    "message": "商品已从收藏夹移除"
                }))
            } else {
                println!("收藏夹中未找到该商品");
                HttpResponse::NotFound().json(json!({
                    "message": "收藏夹中未找到该商品"
                }))
            }
        },
        Err(e) => {
            println!("移除收藏失败: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "message": "移除收藏失败"
            }))
        }
    }
}

// 获取用户收藏夹
pub async fn get_user_favorites(
    req: HttpRequest,
    pool: web::Data<DbPool>,
) -> impl Responder {
    println!("=== 获取用户收藏夹 ===");
    
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
    
    // 检查用户是否为普通用户
    if user_role.to_string().to_lowercase() != "customer" {
        println!("非普通用户尝试使用收藏功能");
        return HttpResponse::Forbidden().json(json!({
            "message": "只有普通用户可以使用收藏功能"
        }));
    }
    
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
    
    // 查询用户收藏
    let favorites_result = favorites::table
        .filter(favorites::user_id.eq(&user_id))
        .select(Favorite::as_select())
        .load(&mut conn);
    
    let user_favorites = match favorites_result {
        Ok(favs) => favs,
        Err(e) => {
            println!("获取收藏失败: {:?}", e);
            return HttpResponse::InternalServerError().json(json!({
                "message": "获取收藏失败"
            }));
        }
    };
    
    if user_favorites.is_empty() {
        println!("用户收藏夹为空");
        return HttpResponse::Ok().json(json!({
            "favorites": []
        }));
    }
    
    // 构建收藏响应，包含商品信息
    let mut favorite_responses: Vec<FavoriteResponse> = Vec::new();
    
    for favorite in user_favorites {
        // 获取商品信息
        let product_result = products::table
            .find(&favorite.product_id)
            .select(Product::as_select())
            .first(&mut conn);
        
        let product_info = match product_result {
            Ok(product) => Some(ProductInfo {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                vendor_id: product.vendor_id,
                stock: product.stock,
                category: product.category,
            }),
            Err(_) => None
        };
        
        // 构建收藏响应
        let favorite_response = FavoriteResponse {
            id: favorite.id,
            user_id: favorite.user_id,
            product_id: favorite.product_id,
            created_at: favorite.created_at,
            product: product_info,
        };
        
        favorite_responses.push(favorite_response);
    }
    
    HttpResponse::Ok().json(json!({
        "favorites": favorite_responses
    }))
}

// 添加到收藏夹的DTO
#[derive(Debug, Deserialize, Serialize)]
pub struct AddToFavoritesDto {
    pub product_id: String,
}

// 检查商品是否已被收藏
pub async fn check_favorite(
    req: HttpRequest,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    println!("=== 检查商品是否已被收藏 ===");
    
    let product_id = path.into_inner();
    println!("商品ID: {}", product_id);
    
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
    
    // 检查用户是否为普通用户
    if user_role.to_string().to_lowercase() != "customer" {
        println!("非普通用户尝试使用收藏功能");
        return HttpResponse::Forbidden().json(json!({
            "message": "只有普通用户可以使用收藏功能"
        }));
    }
    
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
    
    // 检查商品是否已被收藏
    let is_favorited = favorites::table
        .filter(favorites::user_id.eq(&user_id))
        .filter(favorites::product_id.eq(&product_id))
        .select(favorites::id)
        .first::<String>(&mut conn)
        .is_ok();
    
    HttpResponse::Ok().json(json!({
        "favorited": is_favorited
    }))
} 