use actix_web::web;
use crate::handlers::admin::{get_admin_settings, update_admin_settings};
use crate::middleware::auth::Authentication;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/admin")
            .wrap(Authentication)
            .route("/settings/{user_id}", web::get().to(get_admin_settings))
            .route("/settings/{user_id}", web::put().to(update_admin_settings))
    );
} 