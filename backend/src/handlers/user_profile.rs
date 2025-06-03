use actix_web::{web, HttpResponse, Responder, HttpRequest, HttpMessage};
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager};
use diesel::mysql::MysqlConnection;
use serde_json::json;
use chrono::NaiveDate;
use std::str::FromStr;

use crate::schema::{users, user_profiles};
use crate::models::user::User;
use crate::models::user_profile::{UserProfile, NewUserProfile, UpdateUserProfile, UserProfileDto, UserProfileResponse};
use crate::config::jwt::Claims;

type DbPool = r2d2::Pool<ConnectionManager<MysqlConnection>>;

// 从请求中获取用户ID
fn get_user_id_from_request(req: &HttpRequest) -> Option<String> {
    req.extensions().get::<Claims>().map(|claims| claims.sub.clone())
}

// 获取用户详细信息
pub async fn get_user_profile(
    req: HttpRequest,
    pool: web::Data<DbPool>,
) -> impl Responder {
    println!("=== 获取用户详细信息 ===");
    
    // 获取用户ID
    let user_id = match get_user_id_from_request(&req) {
        Some(id) => {
            println!("用户ID: {}", id);
            id
        },
        None => {
            println!("无法获取用户ID");
            return HttpResponse::Unauthorized().json(json!({
                "message": "无法获取用户ID"
            }));
        }
    };
    
    // 获取数据库连接
    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => {
            println!("数据库连接失败");
            return HttpResponse::InternalServerError().json(json!({
                "message": "数据库连接错误"
            }));
        }
    };
    
    // 获取用户基本信息
    let user_result = users::table
        .find(&user_id)
        .select(User::as_select())
        .first(&mut conn);
    
    let user = match user_result {
        Ok(user) => user,
        Err(_) => {
            println!("用户不存在");
            return HttpResponse::NotFound().json(json!({
                "message": "用户不存在"
            }));
        }
    };
    
    // 获取用户详细信息
    let profile_result = user_profiles::table
        .filter(user_profiles::user_id.eq(&user_id))
        .select(UserProfile::as_select())
        .first(&mut conn);
    
    let profile = match profile_result {
        Ok(profile) => profile,
        Err(diesel::result::Error::NotFound) => {
            // 如果用户详细信息不存在，创建一个新的
            println!("用户详细信息不存在，创建新的");
            let new_profile = NewUserProfile::new(user_id.clone());
            
            match diesel::insert_into(user_profiles::table)
                .values(&new_profile)
                .execute(&mut conn) {
                Ok(_) => {
                    match user_profiles::table
                        .find(&new_profile.id)
                        .select(UserProfile::as_select())
                        .first(&mut conn) {
                        Ok(profile) => profile,
                        Err(_) => {
                            println!("创建后无法获取用户详细信息");
                            return HttpResponse::InternalServerError().json(json!({
                                "message": "创建用户详细信息失败"
                            }));
                        }
                    }
                },
                Err(_) => {
                    println!("创建用户详细信息失败");
                    return HttpResponse::InternalServerError().json(json!({
                        "message": "创建用户详细信息失败"
                    }));
                }
            }
        },
        Err(_) => {
            println!("获取用户详细信息失败");
            return HttpResponse::InternalServerError().json(json!({
                "message": "获取用户详细信息失败"
            }));
        }
    };
    
    // 构建响应
    let birth_date_str = profile.birth_date.map(|date| date.to_string());
    
    let response = UserProfileResponse {
        id: profile.id,
        user_id: user.id,
        email: user.email,
        username: profile.username,
        phone: profile.phone,
        address: profile.address,
        avatar_url: profile.avatar_url,
        gender: profile.gender,
        birth_date: birth_date_str,
        role: user.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
    };
    
    HttpResponse::Ok().json(response)
}

// 更新用户详细信息
pub async fn update_user_profile(
    req: HttpRequest,
    pool: web::Data<DbPool>,
    profile_dto: web::Json<UserProfileDto>,
) -> impl Responder {
    println!("=== 更新用户详细信息 ===");
    
    // 获取用户ID
    let user_id = match get_user_id_from_request(&req) {
        Some(id) => {
            println!("用户ID: {}", id);
            id
        },
        None => {
            println!("无法获取用户ID");
            return HttpResponse::Unauthorized().json(json!({
                "message": "无法获取用户ID"
            }));
        }
    };
    
    // 获取数据库连接
    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => {
            println!("数据库连接失败");
            return HttpResponse::InternalServerError().json(json!({
                "message": "数据库连接错误"
            }));
        }
    };
    
    // 检查用户是否存在
    let user_exists = users::table
        .find(&user_id)
        .select(users::id)
        .first::<String>(&mut conn)
        .is_ok();
    
    if !user_exists {
        println!("用户不存在");
        return HttpResponse::NotFound().json(json!({
            "message": "用户不存在"
        }));
    }
    
    // 解析出生日期
    let birth_date = if let Some(date_str) = &profile_dto.birth_date {
        match NaiveDate::from_str(date_str) {
            Ok(date) => Some(date),
            Err(_) => {
                println!("出生日期格式错误");
                return HttpResponse::BadRequest().json(json!({
                    "message": "出生日期格式错误，请使用YYYY-MM-DD格式"
                }));
            }
        }
    } else {
        None
    };
    
    // 准备更新数据
    let update_profile = UpdateUserProfile {
        username: profile_dto.username.clone(),
        phone: profile_dto.phone.clone(),
        address: profile_dto.address.clone(),
        avatar_url: profile_dto.avatar_url.clone(),
        gender: profile_dto.gender.clone(),
        birth_date,
    };
    
    // 检查用户详细信息是否存在
    let profile_result = user_profiles::table
        .filter(user_profiles::user_id.eq(&user_id))
        .select(user_profiles::id)
        .first::<String>(&mut conn);
    
    match profile_result {
        Ok(profile_id) => {
            // 更新现有的用户详细信息
            match diesel::update(user_profiles::table.find(&profile_id))
                .set(&update_profile)
                .execute(&mut conn) {
                Ok(_) => {
                    println!("用户详细信息更新成功");
                },
                Err(e) => {
                    println!("更新用户详细信息失败: {:?}", e);
                    return HttpResponse::InternalServerError().json(json!({
                        "message": "更新用户详细信息失败"
                    }));
                }
            }
        },
        Err(diesel::result::Error::NotFound) => {
            // 创建新的用户详细信息
            println!("用户详细信息不存在，创建新的");
            let mut new_profile = NewUserProfile::new(user_id.clone());
            new_profile.username = update_profile.username;
            new_profile.phone = update_profile.phone;
            new_profile.address = update_profile.address;
            new_profile.avatar_url = update_profile.avatar_url;
            new_profile.gender = update_profile.gender;
            new_profile.birth_date = update_profile.birth_date;
            
            match diesel::insert_into(user_profiles::table)
                .values(&new_profile)
                .execute(&mut conn) {
                Ok(_) => {
                    println!("用户详细信息创建成功");
                },
                Err(e) => {
                    println!("创建用户详细信息失败: {:?}", e);
                    return HttpResponse::InternalServerError().json(json!({
                        "message": "创建用户详细信息失败"
                    }));
                }
            }
        },
        Err(_) => {
            println!("查询用户详细信息失败");
            return HttpResponse::InternalServerError().json(json!({
                "message": "查询用户详细信息失败"
            }));
        }
    }
    
    // 获取更新后的用户详细信息
    let updated_profile_result = user_profiles::table
        .filter(user_profiles::user_id.eq(&user_id))
        .select(UserProfile::as_select())
        .first(&mut conn);
    
    let updated_profile = match updated_profile_result {
        Ok(profile) => profile,
        Err(_) => {
            println!("获取更新后的用户详细信息失败");
            return HttpResponse::InternalServerError().json(json!({
                "message": "获取更新后的用户详细信息失败"
            }));
        }
    };
    
    // 获取用户基本信息
    let user_result = users::table
        .find(&user_id)
        .select(User::as_select())
        .first(&mut conn);
    
    let user = match user_result {
        Ok(user) => user,
        Err(_) => {
            println!("获取用户基本信息失败");
            return HttpResponse::InternalServerError().json(json!({
                "message": "获取用户基本信息失败"
            }));
        }
    };
    
    // 构建响应
    let birth_date_str = updated_profile.birth_date.map(|date| date.to_string());
    
    let response = UserProfileResponse {
        id: updated_profile.id,
        user_id: user.id,
        email: user.email,
        username: updated_profile.username,
        phone: updated_profile.phone,
        address: updated_profile.address,
        avatar_url: updated_profile.avatar_url,
        gender: updated_profile.gender,
        birth_date: birth_date_str,
        role: user.role,
        created_at: updated_profile.created_at,
        updated_at: updated_profile.updated_at,
    };
    
    HttpResponse::Ok().json(json!({
        "message": "用户详细信息更新成功",
        "profile": response
    }))
} 