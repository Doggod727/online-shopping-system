use actix_web::web;
use crate::handlers::vendor_profile::{get_vendor_profile, update_vendor_profile};
use crate::middleware::Authentication;

pub fn config(cfg: &mut web::ServiceConfig) {
    println!("=== 配置供应商详细信息路由 ===");
    cfg.service(
        web::scope("/api/vendor/profile")
            .wrap(Authentication)
            .route("", web::get().to(get_vendor_profile))
            .route("", web::put().to(update_vendor_profile))
    );
    println!("供应商详细信息路由已配置: /api/vendor/profile");
} 