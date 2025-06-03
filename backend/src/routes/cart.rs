use actix_web::web;
use crate::handlers::cart;
use crate::middleware::Authentication;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/cart")
            .wrap(Authentication)
            .route("", web::get().to(cart::get_cart))
            .route("/add", web::post().to(cart::add_to_cart))
            .route("/{id}", web::put().to(cart::update_cart_item))
            .route("/{id}", web::delete().to(cart::remove_from_cart))
            .route("/checkout", web::post().to(cart::checkout))
    );
} 