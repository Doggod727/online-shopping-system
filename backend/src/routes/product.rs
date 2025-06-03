use actix_web::web;
use crate::handlers::product;
use crate::middleware::auth::Authentication;

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/products")
            // 公开路由
            .route("", web::get().to(product::get_all_products))
            
            // 供应商专用路由 - 放在/{id}路由之前
            .route("/vendor", web::get().to(product::get_vendor_products).wrap(Authentication))
            
            // 公开路由 - 单个商品
            .route("/{id}", web::get().to(product::get_product_by_id))
            
            // 需要认证的路由
            .service(
                web::scope("")
                    .wrap(Authentication)
                    .route("", web::post().to(product::create_product))
                    .route("/{id}", web::put().to(product::update_product))
                    .route("/{id}", web::delete().to(product::delete_product))
            )
    );
}