use actix_web::web;
use crate::handlers::favorite::{
    add_to_favorites,
    remove_from_favorites,
    get_user_favorites,
    check_favorite,
};
use crate::middleware::Authentication;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/favorites")
            .wrap(Authentication)
            .route("", web::get().to(get_user_favorites))
            .route("", web::post().to(add_to_favorites))
            .route("/{product_id}", web::delete().to(remove_from_favorites))
            .route("/check/{product_id}", web::get().to(check_favorite))
    );
} 