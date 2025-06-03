use serde::{Deserialize, Serialize};
use diesel::prelude::*;
use uuid::Uuid;
use crate::schema::vendor_profiles;

#[derive(Debug, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = vendor_profiles)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
pub struct VendorProfile {
    pub id: String,
    pub vendor_id: String,
    pub store_name: Option<String>,
    pub store_description: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub store_address: Option<String>,
    pub store_logo_url: Option<String>,
    pub store_banner_url: Option<String>,
    pub business_hours: Option<String>,
    pub accepts_returns: bool,
    pub return_policy: Option<String>,
    pub shipping_methods: Option<String>,
    pub payment_methods: Option<String>,
    pub notification_settings: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, Insertable)]
#[diesel(table_name = vendor_profiles)]
pub struct NewVendorProfile {
    pub id: String,
    pub vendor_id: String,
    pub store_name: Option<String>,
    pub store_description: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub store_address: Option<String>,
    pub store_logo_url: Option<String>,
    pub store_banner_url: Option<String>,
    pub business_hours: Option<String>,
    pub accepts_returns: bool,
    pub return_policy: Option<String>,
    pub shipping_methods: Option<String>,
    pub payment_methods: Option<String>,
    pub notification_settings: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, AsChangeset)]
#[diesel(table_name = vendor_profiles)]
pub struct UpdateVendorProfile {
    pub store_name: Option<String>,
    pub store_description: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub store_address: Option<String>,
    pub store_logo_url: Option<String>,
    pub store_banner_url: Option<String>,
    pub business_hours: Option<String>,
    pub accepts_returns: Option<bool>,
    pub return_policy: Option<String>,
    pub shipping_methods: Option<String>,
    pub payment_methods: Option<String>,
    pub notification_settings: Option<String>,
}

// DTO用于API请求和响应
#[derive(Debug, Serialize, Deserialize)]
pub struct VendorProfileDto {
    pub store_name: Option<String>,
    pub store_description: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub store_address: Option<String>,
    pub store_logo_url: Option<String>,
    pub store_banner_url: Option<String>,
    pub business_hours: Option<String>,
    pub accepts_returns: Option<bool>,
    pub return_policy: Option<String>,
    pub shipping_methods: Option<String>,
    pub payment_methods: Option<String>,
    pub notification_settings: Option<String>,
}

// 用于API响应的详细信息
#[derive(Debug, Serialize, Deserialize)]
pub struct VendorProfileResponse {
    pub id: String,
    pub vendor_id: String,
    pub email: String,
    pub store_name: Option<String>,
    pub store_description: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub store_address: Option<String>,
    pub store_logo_url: Option<String>,
    pub store_banner_url: Option<String>,
    pub business_hours: Option<String>,
    pub accepts_returns: bool,
    pub return_policy: Option<String>,
    pub shipping_methods: Option<String>,
    pub payment_methods: Option<String>,
    pub notification_settings: Option<String>,
    pub role: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

impl NewVendorProfile {
    pub fn new(vendor_id: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            vendor_id,
            store_name: None,
            store_description: None,
            contact_email: None,
            contact_phone: None,
            store_address: None,
            store_logo_url: None,
            store_banner_url: None,
            business_hours: None,
            accepts_returns: true,
            return_policy: None,
            shipping_methods: None,
            payment_methods: None,
            notification_settings: None,
        }
    }
} 