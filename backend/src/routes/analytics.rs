use actix_web::web;
use crate::handlers::analytics::get_analytics_summary;
use crate::middleware::{Authentication, RequireAuth};
use crate::models::user::UserRole;

pub fn config(cfg: &mut web::ServiceConfig) {
    println!("=== 配置数据分析路由 ===");
    cfg.service(
        web::scope("/api/admin/analytics")
            .wrap(Authentication)
            .app_data(RequireAuth(vec![UserRole::Admin]))
            .route("", web::get().to(get_analytics_summary))
    );
    println!("数据分析路由已配置: /api/admin/analytics");
} 