pub mod auth;
pub mod product;
pub mod cart;
pub mod order;
pub mod favorite;
pub mod user_profile;
pub mod vendor_profile;
pub mod user;
pub mod analytics;
pub mod admin;

use actix_web::{HttpResponse, Responder};

// 健康检查路由
pub async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({ "status": "ok" }))
}