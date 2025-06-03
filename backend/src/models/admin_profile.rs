use serde::{Deserialize, Serialize};
use diesel::prelude::*;
use uuid::Uuid;
use crate::schema::admin_profiles;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = admin_profiles)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
pub struct AdminProfile {
    pub id: String,
    pub admin_id: String,
    pub site_name: String,
    pub site_description: String,
    pub contact_email: String,
    pub order_prefix: String,
    pub items_per_page: i32,
    pub allow_registration: bool,
    pub maintenance_mode: bool,
    pub theme: String,
    pub currency_symbol: String,
    pub tax_rate: f64,
    pub payment_gateways: String,
    pub log_level: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, Insertable)]
#[diesel(table_name = admin_profiles)]
pub struct NewAdminProfile {
    pub id: String,
    pub admin_id: String,
    pub site_name: String,
    pub site_description: String,
    pub contact_email: String,
    pub order_prefix: String,
    pub items_per_page: i32,
    pub allow_registration: bool,
    pub maintenance_mode: bool,
    pub theme: String,
    pub currency_symbol: String,
    pub tax_rate: f64,
    pub payment_gateways: String,
    pub log_level: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, AsChangeset)]
#[diesel(table_name = admin_profiles)]
pub struct UpdateAdminProfile {
    pub site_name: Option<String>,
    pub site_description: Option<String>,
    pub contact_email: Option<String>,
    pub order_prefix: Option<String>,
    pub items_per_page: Option<i32>,
    pub allow_registration: Option<bool>,
    pub maintenance_mode: Option<bool>,
    pub theme: Option<String>,
    pub currency_symbol: Option<String>,
    pub tax_rate: Option<f64>,
    pub payment_gateways: Option<String>,
    pub log_level: Option<String>,
    pub updated_at: chrono::NaiveDateTime,
}

// DTO用于API请求和响应
#[derive(Debug, Serialize, Deserialize)]
pub struct AdminSettingsRequest {
    pub site_name: Option<String>,
    pub site_description: Option<String>,
    pub contact_email: Option<String>,
    pub order_prefix: Option<String>,
    pub items_per_page: Option<i32>,
    pub allow_registration: Option<bool>,
    pub maintenance_mode: Option<bool>,
    pub theme: Option<String>,
    pub currency_symbol: Option<String>,
    pub tax_rate: Option<f64>,
    pub payment_gateways: Option<Vec<String>>,
    pub log_level: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdminSettingsResponse {
    pub site_name: String,
    pub site_description: String,
    pub contact_email: String,
    pub order_prefix: String,
    pub items_per_page: i32,
    pub allow_registration: bool,
    pub maintenance_mode: bool,
    pub theme: String,
    pub currency_symbol: String,
    pub tax_rate: f64,
    pub payment_gateways: Vec<String>,
    pub log_level: String,
}

impl AdminProfile {
    pub fn default(admin_id: String) -> NewAdminProfile {
        NewAdminProfile {
            id: Uuid::new_v4().to_string(),
            admin_id,
            site_name: "在线购物管理系统".to_string(),
            site_description: "基于React+TypeScript前端和Rust后端的在线购物管理系统".to_string(),
            contact_email: "admin@example.com".to_string(),
            order_prefix: "ORD-".to_string(),
            items_per_page: 10,
            allow_registration: true,
            maintenance_mode: false,
            theme: "light".to_string(),
            currency_symbol: "¥".to_string(),
            tax_rate: 13.0,
            payment_gateways: "alipay,wechatpay".to_string(),
            log_level: "info".to_string(),
            created_at: Utc::now().naive_utc(),
            updated_at: Utc::now().naive_utc(),
        }
    }
} 