use actix_web::web;
use crate::handlers::auth::{login, register, get_me, change_password};
use crate::middleware::{Authentication, RequireAuth};
use crate::models::user::UserRole;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/auth")
            .route("/register", web::post().to(register))
            .route("/login", web::post().to(login))
            .service(
                web::resource("/me")
                    .wrap(Authentication)
                    .app_data(RequireAuth(vec![
                        UserRole::Customer,
                        UserRole::Admin,
                        UserRole::Vendor,
                    ]))
                    .route(web::get().to(get_me)),
            )
            .service(
                web::resource("/password")
                    .wrap(Authentication)
                    .route(web::put().to(change_password)),
            ),
    );
} 