use actix_cors::Cors;
use actix_web::{middleware as actix_middleware, App, HttpServer, web};
use diesel::r2d2::{self, ConnectionManager};
use diesel::mysql::MysqlConnection;
use dotenv::dotenv;
use std::env;

mod config;
mod models;
mod handlers;
mod routes;
mod middleware;
mod utils;
mod schema;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 加载环境变量
    dotenv().ok();
    
    // 设置日志
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // 创建数据库连接池
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let manager = ConnectionManager::<MysqlConnection>::new(database_url);
    let pool = r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create DB connection pool");
    
    // 获取配置
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let server_url = format!("{}:{}", host, port);
    
    println!("Starting server at http://{}", server_url);
    
    // 创建服务器
    HttpServer::new(move || {
        // 配置CORS
        let cors = Cors::default()
            .allow_any_origin()
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://127.0.0.1:3000")
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
        
        // 返回App实例
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(actix_middleware::Logger::default())
            .wrap(cors)
            .route("/", web::get().to(|| async { "Hello World!" }))
            // 添加路由配置
            .configure(routes::auth::config)
            .configure(routes::product::config)
            .configure(routes::cart::config)
            .configure(routes::order::config)
            .configure(routes::favorite::config)
            .configure(routes::user_profile::config)
            .configure(routes::vendor_profile::config)
            .configure(routes::user::config)
            .configure(routes::analytics::config)
            .configure(routes::admin::config)
    })
    .bind(&server_url)?
    .run()
    .await
}