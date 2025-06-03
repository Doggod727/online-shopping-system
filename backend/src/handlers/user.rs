use actix_web::{web, HttpResponse, Responder};
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::models::user::User;
use crate::schema::users;
use serde_json::json;
// 导入所需的DSL项
use crate::schema::users::dsl::*;

type DbPool = r2d2::Pool<ConnectionManager<diesel::mysql::MysqlConnection>>;

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateUserDto {
    pub role: Option<String>,
    pub status: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserDto {
    pub email: String,
    pub password: String,
    pub role: String,
}

// 获取所有用户
pub async fn get_all_users(pool: web::Data<DbPool>) -> impl Responder {
    let conn = pool.get();
    if let Err(e) = conn {
        return HttpResponse::InternalServerError().json(format!("数据库连接失败: {}", e));
    }
    
    let mut conn = conn.unwrap();
    
    let result = users.load::<User>(&mut conn);
    
    match result {
        Ok(users_list) => {
            HttpResponse::Ok().json(users_list)
        },
        Err(e) => {
            HttpResponse::InternalServerError().json(format!("获取用户列表失败: {}", e))
        }
    }
}

// 获取单个用户
pub async fn get_user_by_id(
    path: web::Path<String>,
    pool: web::Data<DbPool>
) -> impl Responder {
    let user_id = path.into_inner();
    
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => return HttpResponse::InternalServerError().json(format!("数据库连接失败: {}", e)),
    };
    
    let mut conn = conn;
    
    let uuid = match Uuid::parse_str(&user_id) {
        Ok(uuid) => uuid,
        Err(_) => return HttpResponse::BadRequest().json("无效的用户ID格式"),
    };
    
    let result = users.find(uuid.to_string())
        .first::<User>(&mut conn);
    
    match result {
        Ok(user) => {
            HttpResponse::Ok().json(user)
        },
        Err(diesel::NotFound) => {
            HttpResponse::NotFound().json("用户不存在")
        },
        Err(e) => {
            HttpResponse::InternalServerError().json(format!("获取用户失败: {}", e))
        }
    }
}

// 更新用户
pub async fn update_user(
    path: web::Path<String>,
    user_dto: web::Json<UpdateUserDto>,
    pool: web::Data<DbPool>
) -> impl Responder {
    let user_id = path.into_inner();
    
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => return HttpResponse::InternalServerError().json(format!("数据库连接失败: {}", e)),
    };
    
    let mut conn = conn;
    
    let uuid = match Uuid::parse_str(&user_id) {
        Ok(uuid) => uuid,
        Err(_) => return HttpResponse::BadRequest().json("无效的用户ID格式"),
    };
    
    // 首先检查用户是否存在
    let user_exists = users.find(uuid.to_string())
        .first::<User>(&mut conn)
        .is_ok();
    
    if !user_exists {
        return HttpResponse::NotFound().json("用户不存在");
    }
    
    // 准备更新的字段
    let mut update_successful = false;
    
    // 更新角色
    if let Some(role_value) = &user_dto.role {
        match diesel::update(users.filter(id.eq(uuid.to_string())))
            .set((
                role.eq(role_value),
                updated_at.eq(diesel::dsl::now)
            ))
            .execute(&mut conn) {
            Ok(_) => {
                update_successful = true;
            },
            Err(e) => {
                return HttpResponse::InternalServerError().json(format!("更新用户角色失败: {}", e));
            }
        }
    }
    
    // 更新密码
    if let Some(password_value) = &user_dto.password {
        match diesel::update(users.filter(id.eq(uuid.to_string())))
            .set((
                password_hash.eq(password_value),
                updated_at.eq(diesel::dsl::now)
            ))
            .execute(&mut conn) {
            Ok(_) => {
                update_successful = true;
            },
            Err(e) => {
                return HttpResponse::InternalServerError().json(format!("更新用户密码失败: {}", e));
            }
        }
    }
    
    // 如果没有更新字段或更新成功
    if update_successful {
        // 获取更新后的用户
        match users.find(uuid.to_string()).first::<User>(&mut conn) {
            Ok(updated_user) => HttpResponse::Ok().json(updated_user),
            Err(e) => HttpResponse::InternalServerError().json(format!("获取更新后的用户失败: {}", e)),
        }
    } else if !user_dto.role.is_some() && !user_dto.password.is_some() {
        // 没有提供任何更新字段
        HttpResponse::BadRequest().json("没有提供需要更新的字段")
    } else {
        HttpResponse::InternalServerError().json("更新用户失败")
    }
}

// 删除用户
pub async fn delete_user(
    path: web::Path<String>,
    pool: web::Data<DbPool>
) -> impl Responder {
    let user_id = path.into_inner();
    
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => return HttpResponse::InternalServerError().json(format!("数据库连接失败: {}", e)),
    };
    
    let mut conn = conn;
    
    let uuid = match Uuid::parse_str(&user_id) {
        Ok(uuid) => uuid,
        Err(_) => return HttpResponse::BadRequest().json("无效的用户ID格式"),
    };
    
    // 执行删除
    match diesel::delete(users.filter(id.eq(uuid.to_string()))).execute(&mut conn) {
        Ok(deleted) => {
            if deleted > 0 {
                HttpResponse::Ok().json(json!({"success": true, "message": "用户已删除"}))
            } else {
                HttpResponse::NotFound().json("用户不存在")
            }
        },
        Err(e) => {
            HttpResponse::InternalServerError().json(format!("删除用户失败: {}", e))
        }
    }
}

// 创建用户
pub async fn create_user(
    user_dto: web::Json<CreateUserDto>,
    pool: web::Data<DbPool>
) -> impl Responder {
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => return HttpResponse::InternalServerError().json(format!("数据库连接失败: {}", e)),
    };
    
    let mut conn = conn;
    
    // 检查邮箱是否已存在
    let email_exists = users.filter(email.eq(&user_dto.email))
        .first::<User>(&mut conn)
        .is_ok();
    
    if email_exists {
        return HttpResponse::BadRequest().json("该邮箱已被注册");
    }
    
    // 创建新用户
    let new_id = Uuid::new_v4().to_string();
    
    // 使用Diesel插入数据
    match diesel::insert_into(users)
        .values((
            id.eq(new_id.clone()),
            email.eq(&user_dto.email),
            password_hash.eq(&user_dto.password), // 实际应用中要哈希
            role.eq(&user_dto.role),
            created_at.eq(diesel::dsl::now),
            updated_at.eq(diesel::dsl::now)
        ))
        .execute(&mut conn) {
        Ok(_) => {
            // 获取新创建的用户
            match users.find(new_id).first::<User>(&mut conn) {
                Ok(new_user) => HttpResponse::Created().json(new_user),
                Err(e) => HttpResponse::InternalServerError().json(format!("获取新创建的用户失败: {}", e))
            }
        },
        Err(e) => {
            HttpResponse::InternalServerError().json(format!("创建用户失败: {}", e))
        }
    }
} 