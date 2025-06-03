use actix_web::web;
use crate::handlers::order;
use crate::middleware::Authentication;
use crate::middleware::RequireAuth;
use crate::models::user::UserRole;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/orders")
            .wrap(Authentication)
            .route("", web::get().to(order::get_user_orders))
            .route("/vendor", web::get().to(order::get_vendor_orders))
            .service(
                web::resource("/all")
                    .app_data(RequireAuth(vec![UserRole::Admin]))
                    .route(web::get().to(order::get_all_orders))
            )
            .route("/{id}", web::get().to(order::get_order_by_id))
            .service(
                web::resource("/{id}/status")
                    .app_data(RequireAuth(vec![UserRole::Admin, UserRole::Vendor]))
                    .route(web::put().to(order::update_order_status))
            )
    );
} 