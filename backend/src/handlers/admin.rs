use actix_web::{web, HttpResponse, Error, HttpRequest};
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};
use diesel::mysql::MysqlConnection;
use serde_json::json;
use crate::models::admin_profile::{AdminProfile, NewAdminProfile, UpdateAdminProfile, AdminSettingsRequest, AdminSettingsResponse};
use crate::models::user::User;
use crate::schema::{admin_profiles, users};
use crate::middleware::get_user_id_from_request;

type DbPool = Pool<ConnectionManager<MysqlConnection>>;

// 获取管理员设置
pub async fn get_admin_settings(
    req: HttpRequest,
    user_id: web::Path<String>,
    pool: web::Data<DbPool>
) -> HttpResponse {
    println!("获取管理员设置");
    
    // 验证用户身份
    let auth_user_id = match get_user_id_from_request(&req) {
        Some(id) => id,
        None => {
            println!("未找到用户ID");
            return HttpResponse::Unauthorized().json(json!({
                "message": "未授权访问"
            }));
        }
    };
    
    // 确保只有管理员本人或超级管理员可以访问
    if auth_user_id != user_id.into_inner() {
        println!("用户无权访问此资源");
        return HttpResponse::Forbidden().json(json!({
            "message": "无权访问此资源"
        }));
    }
    
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
    
    // 查询用户信息，确认是管理员
    let user_result = users::table
        .filter(users::id.eq(&auth_user_id))
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
    
    // 检查用户角色是否为管理员
    if user.role.to_lowercase() != "admin" {
        println!("用户不是管理员");
        return HttpResponse::Forbidden().json(json!({
            "message": "只有管理员可以访问此资源"
        }));
    }
    
    // 查询管理员设置
    let admin_profile_result = admin_profiles::table
        .filter(admin_profiles::admin_id.eq(&auth_user_id))
        .first::<AdminProfile>(&mut conn);
    
    match admin_profile_result {
        Ok(profile) => {
            // 构建响应
            let response = AdminSettingsResponse {
                site_name: profile.site_name,
                site_description: profile.site_description,
                contact_email: profile.contact_email,
                order_prefix: profile.order_prefix,
                items_per_page: profile.items_per_page,
                allow_registration: profile.allow_registration,
                maintenance_mode: profile.maintenance_mode,
                theme: profile.theme,
                currency_symbol: profile.currency_symbol,
                tax_rate: profile.tax_rate,
                payment_gateways: profile.payment_gateways.split(',').map(|s| s.to_string()).collect(),
                log_level: profile.log_level,
            };
            
            println!("管理员设置获取成功");
            HttpResponse::Ok().json(response)
        },
        Err(diesel::result::Error::NotFound) => {
            // 如果未找到管理员设置，则创建默认设置
            let default_profile = AdminProfile::default(auth_user_id.clone());
            
            match diesel::insert_into(admin_profiles::table)
                .values(&default_profile)
                .execute(&mut conn) {
                Ok(_) => {
                    // 查询新创建的设置
                    match admin_profiles::table
                        .filter(admin_profiles::admin_id.eq(&auth_user_id))
                        .first::<AdminProfile>(&mut conn) {
                        Ok(new_profile) => {
                            let response = AdminSettingsResponse {
                                site_name: new_profile.site_name,
                                site_description: new_profile.site_description,
                                contact_email: new_profile.contact_email,
                                order_prefix: new_profile.order_prefix,
                                items_per_page: new_profile.items_per_page,
                                allow_registration: new_profile.allow_registration,
                                maintenance_mode: new_profile.maintenance_mode,
                                theme: new_profile.theme,
                                currency_symbol: new_profile.currency_symbol,
                                tax_rate: new_profile.tax_rate,
                                payment_gateways: new_profile.payment_gateways.split(',').map(|s| s.to_string()).collect(),
                                log_level: new_profile.log_level,
                            };
                            
                            println!("已创建默认管理员设置");
                            HttpResponse::Ok().json(response)
                        },
                        Err(e) => {
                            println!("获取新创建的管理员设置失败: {:?}", e);
                            HttpResponse::InternalServerError().json(json!({
                                "message": "创建默认管理员设置后无法获取"
                            }))
                        }
                    }
                },
                Err(e) => {
                    println!("创建默认管理员设置失败: {:?}", e);
                    HttpResponse::InternalServerError().json(json!({
                        "message": "创建默认管理员设置失败"
                    }))
                }
            }
        },
        Err(e) => {
            println!("查询管理员设置失败: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "message": "获取管理员设置失败"
            }))
        }
    }
}

// 更新管理员设置
pub async fn update_admin_settings(
    req: HttpRequest,
    user_id: web::Path<String>,
    settings: web::Json<AdminSettingsRequest>,
    pool: web::Data<DbPool>
) -> HttpResponse {
    println!("更新管理员设置");
    
    // 验证用户身份
    let auth_user_id = match get_user_id_from_request(&req) {
        Some(id) => id,
        None => {
            println!("未找到用户ID");
            return HttpResponse::Unauthorized().json(json!({
                "message": "未授权访问"
            }));
        }
    };
    
    // 确保只有管理员本人或超级管理员可以访问
    if auth_user_id != user_id.into_inner() {
        println!("用户无权访问此资源");
        return HttpResponse::Forbidden().json(json!({
            "message": "无权访问此资源"
        }));
    }
    
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
    
    // 查询用户信息，确认是管理员
    let user_result = users::table
        .filter(users::id.eq(&auth_user_id))
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
    
    // 检查用户角色是否为管理员
    if user.role.to_lowercase() != "admin" {
        println!("用户不是管理员");
        return HttpResponse::Forbidden().json(json!({
            "message": "只有管理员可以访问此资源"
        }));
    }
    
    // 准备更新数据
    let payment_gateways = settings.payment_gateways.as_ref()
        .map(|gateways| gateways.join(","));
    
    let update_data = UpdateAdminProfile {
        site_name: settings.site_name.clone(),
        site_description: settings.site_description.clone(),
        contact_email: settings.contact_email.clone(),
        order_prefix: settings.order_prefix.clone(),
        items_per_page: settings.items_per_page,
        allow_registration: settings.allow_registration,
        maintenance_mode: settings.maintenance_mode,
        theme: settings.theme.clone(),
        currency_symbol: settings.currency_symbol.clone(),
        tax_rate: settings.tax_rate,
        payment_gateways,
        log_level: settings.log_level.clone(),
        updated_at: chrono::Utc::now().naive_utc(),
    };
    
    // 查询管理员设置是否存在
    let profile_result = admin_profiles::table
        .filter(admin_profiles::admin_id.eq(&auth_user_id))
        .select(admin_profiles::id)
        .first::<String>(&mut conn);
    
    match profile_result {
        Ok(profile_id) => {
            // 更新现有的管理员设置
            match diesel::update(admin_profiles::table.find(&profile_id))
                .set(&update_data)
                .execute(&mut conn) {
                Ok(_) => {
                    println!("管理员设置更新成功");
                    
                    // 获取更新后的设置
                    match admin_profiles::table
                        .find(profile_id)
                        .first::<AdminProfile>(&mut conn) {
                        Ok(updated_profile) => {
                            let response = AdminSettingsResponse {
                                site_name: updated_profile.site_name,
                                site_description: updated_profile.site_description,
                                contact_email: updated_profile.contact_email,
                                order_prefix: updated_profile.order_prefix,
                                items_per_page: updated_profile.items_per_page,
                                allow_registration: updated_profile.allow_registration,
                                maintenance_mode: updated_profile.maintenance_mode,
                                theme: updated_profile.theme,
                                currency_symbol: updated_profile.currency_symbol,
                                tax_rate: updated_profile.tax_rate,
                                payment_gateways: updated_profile.payment_gateways.split(',').map(|s| s.to_string()).collect(),
                                log_level: updated_profile.log_level,
                            };
                            
                            HttpResponse::Ok().json(response)
                        },
                        Err(e) => {
                            println!("获取更新后的管理员设置失败: {:?}", e);
                            HttpResponse::Ok().json(json!({
                                "message": "管理员设置已更新，但无法获取最新信息"
                            }))
                        }
                    }
                },
                Err(e) => {
                    println!("更新管理员设置失败: {:?}", e);
                    HttpResponse::InternalServerError().json(json!({
                        "message": "更新管理员设置失败"
                    }))
                }
            }
        },
        Err(diesel::result::Error::NotFound) => {
            // 如果不存在，创建一个新设置
            let default_profile = AdminProfile::default(auth_user_id.clone());
            
            match diesel::insert_into(admin_profiles::table)
                .values(&default_profile)
                .execute(&mut conn) {
                Ok(_) => {
                    // 然后更新它
                    match admin_profiles::table
                        .filter(admin_profiles::admin_id.eq(&auth_user_id))
                        .select(admin_profiles::id)
                        .first::<String>(&mut conn) {
                        Ok(new_profile_id) => {
                            match diesel::update(admin_profiles::table.find(&new_profile_id))
                                .set(&update_data)
                                .execute(&mut conn) {
                                Ok(_) => {
                                    // 获取更新后的设置
                                    match admin_profiles::table
                                        .find(new_profile_id)
                                        .first::<AdminProfile>(&mut conn) {
                                        Ok(updated_profile) => {
                                            let response = AdminSettingsResponse {
                                                site_name: updated_profile.site_name,
                                                site_description: updated_profile.site_description,
                                                contact_email: updated_profile.contact_email,
                                                order_prefix: updated_profile.order_prefix,
                                                items_per_page: updated_profile.items_per_page,
                                                allow_registration: updated_profile.allow_registration,
                                                maintenance_mode: updated_profile.maintenance_mode,
                                                theme: updated_profile.theme,
                                                currency_symbol: updated_profile.currency_symbol,
                                                tax_rate: updated_profile.tax_rate,
                                                payment_gateways: updated_profile.payment_gateways.split(',').map(|s| s.to_string()).collect(),
                                                log_level: updated_profile.log_level,
                                            };
                                            
                                            HttpResponse::Ok().json(response)
                                        },
                                        Err(e) => {
                                            println!("获取更新后的管理员设置失败: {:?}", e);
                                            HttpResponse::Ok().json(json!({
                                                "message": "管理员设置已创建并更新，但无法获取最新信息"
                                            }))
                                        }
                                    }
                                },
                                Err(e) => {
                                    println!("更新新创建的管理员设置失败: {:?}", e);
                                    HttpResponse::InternalServerError().json(json!({
                                        "message": "创建管理员设置成功，但更新失败"
                                    }))
                                }
                            }
                        },
                        Err(e) => {
                            println!("获取新创建的管理员设置ID失败: {:?}", e);
                            HttpResponse::InternalServerError().json(json!({
                                "message": "创建管理员设置成功，但无法获取其ID"
                            }))
                        }
                    }
                },
                Err(e) => {
                    println!("创建管理员设置失败: {:?}", e);
                    HttpResponse::InternalServerError().json(json!({
                        "message": "创建管理员设置失败"
                    }))
                }
            }
        },
        Err(e) => {
            println!("查询管理员设置是否存在失败: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "message": "查询管理员设置失败"
            }))
        }
    }
}