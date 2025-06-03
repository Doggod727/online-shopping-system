use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    http::header,
    Error,
    HttpMessage,
    HttpRequest,
};
use futures::future::{ready, LocalBoxFuture, Ready};

use crate::config::jwt::{extract_token_from_header, validate_token, Claims};
use crate::models::user::UserRole;

// 认证中间件结构
pub struct Authentication;

// 定义需要的角色列表
pub struct RequireAuth(pub Vec<UserRole>);

// 实现中间件工厂
impl<S, B> Transform<S, ServiceRequest> for Authentication
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthenticationMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        println!("初始化认证中间件");
        ready(Ok(AuthenticationMiddleware { service }))
    }
}

// 认证中间件
pub struct AuthenticationMiddleware<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for AuthenticationMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        println!("=== 处理请求 ===");
        println!("请求路径: {}", req.path());
        println!("请求方法: {}", req.method());
        println!("请求头:");
        for (key, value) in req.headers().iter() {
            println!("  {}: {}", key, value.to_str().unwrap_or_default());
        }
        
        // 获取授权头
        let auth_header = req
            .headers()
            .get(header::AUTHORIZATION)
            .map(|h| h.to_str().unwrap_or_default())
            .unwrap_or_default();

        println!("授权头: {}", auth_header);

        // 如果没有授权头，拒绝请求
        if auth_header.is_empty() {
            println!("拒绝请求: 缺少授权头");
            return Box::pin(async move {
                Err(ErrorUnauthorized("Missing authorization header"))
            });
        }

        // 从授权头提取Token
        let token = match extract_token_from_header(auth_header) {
            Some(token) => {
                println!("成功提取token: {}", token.chars().take(20).collect::<String>());
                token
            },
            None => {
                println!("拒绝请求: 无效的授权头格式");
                return Box::pin(async move {
                    Err(ErrorUnauthorized("Invalid authorization header format"))
                });
            }
        };

        // 验证Token
        let claims = match validate_token(token) {
            Ok(claims) => {
                println!("Token验证成功，用户ID: {}, 角色: {:?}", claims.sub, claims.role);
                claims
            },
            Err(e) => {
                println!("Token验证失败: {:?}", e);
                return Box::pin(async move {
                    Err(ErrorUnauthorized("Invalid or expired token"))
                });
            }
        };

        // 将用户信息存储在请求扩展中
        println!("将用户信息添加到请求扩展中: {:?}", claims);
        let req = req;  // 显式绑定，避免编译器警告
        req.extensions_mut().insert(claims.clone());
        
        println!("手动验证token成功，用户ID: {}", claims.sub);

        let fut = self.service.call(req);
        Box::pin(async move {
            println!("等待服务响应...");
            let res = fut.await?;
            println!("服务响应成功，状态码: {}", res.status());
            Ok(res)
        })
    }
}

// 从请求中获取用户ID
pub fn get_user_id_from_request(req: &HttpRequest) -> Option<String> {
    println!("尝试从请求中获取用户ID");
    let extensions = req.extensions();
    println!("检查请求扩展中是否包含Claims");
    
    let user_id = extensions
        .get::<Claims>()
        .map(|claims| {
            println!("找到Claims，用户ID: {}", claims.sub);
            claims.sub.clone()
        });
    
    if user_id.is_none() {
        println!("在请求扩展中未找到Claims");
    } else {
        println!("成功获取用户ID: {:?}", user_id);
    }
    
    user_id
} 