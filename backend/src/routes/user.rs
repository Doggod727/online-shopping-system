use actix_web::web;
use crate::handlers::user::{get_all_users, get_user_by_id, update_user, delete_user, create_user};
use crate::middleware::{Authentication, RequireAuth};
use crate::models::user::UserRole;

pub fn config(cfg: &mut web::ServiceConfig) {
    println!("=== 配置用户管理路由 ===");
    cfg.service(
        web::scope("/api/admin/users")
            .wrap(Authentication)
            .app_data(RequireAuth(vec![UserRole::Admin]))
            .route("", web::get().to(get_all_users))
            .route("", web::post().to(create_user))
            .route("/{id}", web::get().to(get_user_by_id))
            .route("/{id}", web::put().to(update_user))
            .route("/{id}", web::delete().to(delete_user))
    );
    println!("用户管理路由已配置: /api/admin/users");
} 