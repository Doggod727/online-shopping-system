use actix_web::{web, HttpResponse, HttpRequest};
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};
use diesel::mysql::MysqlConnection;
use serde_json::json;
use crate::models::vendor_profile::{VendorProfile, NewVendorProfile, UpdateVendorProfile, VendorProfileDto, VendorProfileResponse};
use crate::models::user::User;
use crate::schema::{vendor_profiles, users};
use crate::middleware::get_user_id_from_request;

type DbPool = Pool<ConnectionManager<MysqlConnection>>;

// 获取供应商详细信息
pub async fn get_vendor_profile(
    req: HttpRequest,
    pool: web::Data<DbPool>
) -> HttpResponse {
    println!("获取供应商详细信息");
    
    // 从请求中获取用户ID
    let user_id = match get_user_id_from_request(&req) {
        Some(id) => id,
        None => {
            println!("未找到用户ID");
            return HttpResponse::Unauthorized().json(json!({
                "message": "未授权访问"
            }));
        }
    };
    
    println!("用户ID: {}", user_id);
    
    // 连接数据库
    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => {
            println!("数据库连接失败: {:?}", e);
            return HttpResponse::InternalServerError().json(json!({
                "message": "服务器内部错误"
            }));
        }
    };
    
    // 查询用户信息，确认是供应商
    let user_result = users::table
        .filter(users::id.eq(&user_id))
        .first::<User>(&mut conn);
    
    let user = match user_result {
        Ok(user) => user,
        Err(e) => {
            println!("查询用户信息失败: {:?}", e);
            return HttpResponse::InternalServerError().json(json!({
                "message": "获取用户信息失败"
            }));
        }
    };
    
    // 检查用户角色是否为供应商
    if user.role.to_lowercase() != "vendor" {
        println!("用户不是供应商");
        return HttpResponse::Forbidden().json(json!({
            "message": "只有供应商可以访问此资源"
        }));
    }
    
    // 查询供应商详细信息
    let vendor_profile_result = vendor_profiles::table
        .filter(vendor_profiles::vendor_id.eq(&user_id))
        .first::<VendorProfile>(&mut conn);
    
    match vendor_profile_result {
        Ok(profile) => {
            // 构建响应
            let response = VendorProfileResponse {
                id: profile.id,
                vendor_id: profile.vendor_id,
                email: user.email,
                store_name: profile.store_name,
                store_description: profile.store_description,
                contact_email: profile.contact_email,
                contact_phone: profile.contact_phone,
                store_address: profile.store_address,
                store_logo_url: profile.store_logo_url,
                store_banner_url: profile.store_banner_url,
                business_hours: profile.business_hours,
                accepts_returns: profile.accepts_returns,
                return_policy: profile.return_policy,
                shipping_methods: profile.shipping_methods,
                payment_methods: profile.payment_methods,
                notification_settings: profile.notification_settings,
                role: user.role,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
            };
            
            println!("供应商详细信息获取成功");
            HttpResponse::Ok().json(response)
        },
        Err(diesel::result::Error::NotFound) => {
            // 如果未找到供应商详情，则返回基本信息
            let response = json!({
                "vendor_id": user.id,
                "email": user.email,
                "role": user.role,
                "store_name": null,
                "message": "未找到供应商详细信息"
            });
            
            println!("未找到供应商详细信息");
            HttpResponse::Ok().json(response)
        },
        Err(e) => {
            println!("查询供应商详细信息失败: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "message": "获取供应商详细信息失败"
            }))
        }
    }
}

// 更新供应商详细信息
pub async fn update_vendor_profile(
    req: HttpRequest, 
    profile_data: web::Json<VendorProfileDto>,
    pool: web::Data<DbPool>
) -> HttpResponse {
    println!("更新供应商详细信息");
    
    // 从请求中获取用户ID
    let user_id = match get_user_id_from_request(&req) {
        Some(id) => id,
        None => {
            println!("未找到用户ID");
            return HttpResponse::Unauthorized().json(json!({
                "message": "未授权访问"
            }));
        }
    };
    
    println!("用户ID: {}", user_id);
    
    // 连接数据库
    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => {
            println!("数据库连接失败: {:?}", e);
            return HttpResponse::InternalServerError().json(json!({
                "message": "服务器内部错误"
            }));
        }
    };
    
    // 查询用户信息，确认是供应商
    let user_result = users::table
        .filter(users::id.eq(&user_id))
        .first::<User>(&mut conn);
    
    let user = match user_result {
        Ok(user) => user,
        Err(e) => {
            println!("查询用户信息失败: {:?}", e);
            return HttpResponse::InternalServerError().json(json!({
                "message": "获取用户信息失败"
            }));
        }
    };
    
    // 检查用户角色是否为供应商
    if user.role.to_lowercase() != "vendor" {
        println!("用户不是供应商");
        return HttpResponse::Forbidden().json(json!({
            "message": "只有供应商可以访问此资源"
        }));
    }
    
    // 准备更新数据
    let update_profile = UpdateVendorProfile {
        store_name: profile_data.store_name.clone(),
        store_description: profile_data.store_description.clone(),
        contact_email: profile_data.contact_email.clone(),
        contact_phone: profile_data.contact_phone.clone(),
        store_address: profile_data.store_address.clone(),
        store_logo_url: profile_data.store_logo_url.clone(),
        store_banner_url: profile_data.store_banner_url.clone(),
        business_hours: profile_data.business_hours.clone(),
        accepts_returns: profile_data.accepts_returns,
        return_policy: profile_data.return_policy.clone(),
        shipping_methods: profile_data.shipping_methods.clone(),
        payment_methods: profile_data.payment_methods.clone(),
        notification_settings: profile_data.notification_settings.clone(),
    };
    
    // 查询供应商详细信息是否存在
    let profile_result = vendor_profiles::table
        .filter(vendor_profiles::vendor_id.eq(&user_id))
        .select(vendor_profiles::id)
        .first::<String>(&mut conn);
    
    match profile_result {
        Ok(profile_id) => {
            // 更新现有的供应商详细信息
            match diesel::update(vendor_profiles::table.find(&profile_id))
                .set(&update_profile)
                .execute(&mut conn) {
                Ok(_) => {
                    println!("供应商详细信息更新成功");
                    
                    // 获取更新后的详细信息
                    match vendor_profiles::table
                        .find(profile_id)
                        .first::<VendorProfile>(&mut conn) {
                        Ok(updated_profile) => {
                            let response = VendorProfileResponse {
                                id: updated_profile.id,
                                vendor_id: updated_profile.vendor_id,
                                email: user.email,
                                store_name: updated_profile.store_name,
                                store_description: updated_profile.store_description,
                                contact_email: updated_profile.contact_email,
                                contact_phone: updated_profile.contact_phone,
                                store_address: updated_profile.store_address,
                                store_logo_url: updated_profile.store_logo_url,
                                store_banner_url: updated_profile.store_banner_url,
                                business_hours: updated_profile.business_hours,
                                accepts_returns: updated_profile.accepts_returns,
                                return_policy: updated_profile.return_policy,
                                shipping_methods: updated_profile.shipping_methods,
                                payment_methods: updated_profile.payment_methods,
                                notification_settings: updated_profile.notification_settings,
                                role: user.role,
                                created_at: updated_profile.created_at,
                                updated_at: updated_profile.updated_at,
                            };
                            
                            HttpResponse::Ok().json(response)
                        },
                        Err(e) => {
                            println!("获取更新后的供应商详细信息失败: {:?}", e);
                            HttpResponse::Ok().json(json!({
                                "message": "供应商详细信息已更新，但无法获取最新信息"
                            }))
                        }
                    }
                },
                Err(e) => {
                    println!("更新供应商详细信息失败: {:?}", e);
                    HttpResponse::InternalServerError().json(json!({
                        "message": "更新供应商详细信息失败"
                    }))
                }
            }
        },
        Err(diesel::result::Error::NotFound) => {
            // 创建新的供应商详细信息
            println!("供应商详细信息不存在，创建新的");
            let mut new_profile = NewVendorProfile::new(user_id.clone());
            new_profile.store_name = profile_data.store_name.clone();
            new_profile.store_description = profile_data.store_description.clone();
            new_profile.contact_email = profile_data.contact_email.clone();
            new_profile.contact_phone = profile_data.contact_phone.clone();
            new_profile.store_address = profile_data.store_address.clone();
            new_profile.store_logo_url = profile_data.store_logo_url.clone();
            new_profile.store_banner_url = profile_data.store_banner_url.clone();
            new_profile.business_hours = profile_data.business_hours.clone();
            new_profile.accepts_returns = profile_data.accepts_returns.unwrap_or(true);
            new_profile.return_policy = profile_data.return_policy.clone();
            new_profile.shipping_methods = profile_data.shipping_methods.clone();
            new_profile.payment_methods = profile_data.payment_methods.clone();
            new_profile.notification_settings = profile_data.notification_settings.clone();
            
            match diesel::insert_into(vendor_profiles::table)
                .values(&new_profile)
                .execute(&mut conn) {
                Ok(_) => {
                    println!("供应商详细信息创建成功");
                    
                    // 获取新创建的详细信息
                    match vendor_profiles::table
                        .find(&new_profile.id)
                        .first::<VendorProfile>(&mut conn) {
                        Ok(created_profile) => {
                            let response = VendorProfileResponse {
                                id: created_profile.id,
                                vendor_id: created_profile.vendor_id,
                                email: user.email,
                                store_name: created_profile.store_name,
                                store_description: created_profile.store_description,
                                contact_email: created_profile.contact_email,
                                contact_phone: created_profile.contact_phone,
                                store_address: created_profile.store_address,
                                store_logo_url: created_profile.store_logo_url,
                                store_banner_url: created_profile.store_banner_url,
                                business_hours: created_profile.business_hours,
                                accepts_returns: created_profile.accepts_returns,
                                return_policy: created_profile.return_policy,
                                shipping_methods: created_profile.shipping_methods,
                                payment_methods: created_profile.payment_methods,
                                notification_settings: created_profile.notification_settings,
                                role: user.role,
                                created_at: created_profile.created_at,
                                updated_at: created_profile.updated_at,
                            };
                            
                            HttpResponse::Created().json(response)
                        },
                        Err(e) => {
                            println!("获取新创建的供应商详细信息失败: {:?}", e);
                            HttpResponse::Created().json(json!({
                                "message": "供应商详细信息已创建，但无法获取最新信息"
                            }))
                        }
                    }
                },
                Err(e) => {
                    println!("创建供应商详细信息失败: {:?}", e);
                    HttpResponse::InternalServerError().json(json!({
                        "message": "创建供应商详细信息失败"
                    }))
                }
            }
        },
        Err(e) => {
            println!("查询供应商详细信息失败: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "message": "更新供应商详细信息失败"
            }))
        }
    }
} 