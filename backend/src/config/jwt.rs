use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use std::env;
use chrono::{Utc, Duration};
use crate::models::user::{User, UserRole};
use jsonwebtoken::errors::Error as JwtError;
use std::str::FromStr;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,  // 用户ID
    pub email: String,
    pub role: UserRole,
    pub exp: usize,   // 过期时间
    pub iat: usize,   // 签发时间
}

// 默认令牌有效期（24小时）
const TOKEN_EXPIRATION: i64 = 60 * 60 * 24;

impl Claims {
    pub fn new(user_id: String, role: UserRole) -> Self {
        let now = Utc::now();
        let expiration_seconds = env::var("JWT_EXPIRATION")
            .unwrap_or_else(|_| "86400".to_string())
            .parse::<i64>()
            .unwrap_or(86400); // 默认24小时
        
        let expiration_time = now + Duration::seconds(expiration_seconds);
        
        Self {
            sub: user_id,
            role: role,
            iat: now.timestamp() as usize,
            exp: expiration_time.timestamp() as usize,
            email: String::new(),
        }
    }
}

pub fn generate_token(user: &User) -> Result<String, JwtError> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your_jwt_secret_key_change_in_production".to_string());
    
    let now = Utc::now();
    let iat = now.timestamp() as usize;
    let exp = (now + Duration::seconds(TOKEN_EXPIRATION)).timestamp() as usize;
    
    // 从字符串解析用户角色
    let role = UserRole::from_str(&user.role).unwrap_or(UserRole::Customer);
    
    println!("生成token，用户ID: {}", user.id);
    
    let claims = Claims {
        sub: user.id.clone(),
        email: user.email.clone(),
        role,
        exp,
        iat,
    };
    
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes())
    )
}

pub fn validate_token(token: &str) -> Result<Claims, JwtError> {
    // 使用与生成token相同的密钥
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your_jwt_secret_key_change_in_production".to_string());
    
    println!("验证token: {}", token.chars().take(20).collect::<String>());
    
    let mut validation = Validation::default();
    // 放宽验证要求，忽略exp字段检查
    validation.validate_exp = false;
    validation.required_spec_claims.remove("exp");
    
    let token_data = match decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation
    ) {
        Ok(data) => data,
        Err(e) => {
            println!("Token验证失败: {:?}", e);
            return Err(e);
        }
    };
    
    println!("Token验证成功，用户ID: {}", token_data.claims.sub);
    Ok(token_data.claims)
}

pub fn extract_token_from_header(auth_header: &str) -> Option<&str> {
    if auth_header.starts_with("Bearer ") {
        Some(&auth_header[7..])
    } else {
        None
    }
} 