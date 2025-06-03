use actix_web::web;
use crate::handlers::user_profile::{get_user_profile, update_user_profile};
use crate::middleware::Authentication;

pub fn config(cfg: &mut web::ServiceConfig) {
    println!("=== 配置用户详细信息路由 ===");
    cfg.service(
        web::scope("/api/profile")
            .wrap(Authentication)
            .route("", web::get().to(get_user_profile))
            .route("", web::put().to(update_user_profile))
    );
    println!("用户详细信息路由已配置: /api/profile");
} 