use serde::{Deserialize, Serialize};
use diesel::prelude::*;
use uuid::Uuid;
use chrono::NaiveDate;
use crate::schema::user_profiles;

#[derive(Debug, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = user_profiles)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
pub struct UserProfile {
    pub id: String,
    pub user_id: String,
    pub username: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, Insertable)]
#[diesel(table_name = user_profiles)]
pub struct NewUserProfile {
    pub id: String,
    pub user_id: String,
    pub username: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<NaiveDate>,
}

#[derive(Debug, Serialize, Deserialize, AsChangeset)]
#[diesel(table_name = user_profiles)]
pub struct UpdateUserProfile {
    pub username: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<NaiveDate>,
}

// DTO用于API请求和响应
#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfileDto {
    pub username: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<String>,
}

// 用于API响应的用户详细信息
#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfileResponse {
    pub id: String,
    pub user_id: String,
    pub email: String,
    pub username: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub avatar_url: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<String>,
    pub role: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

impl NewUserProfile {
    pub fn new(user_id: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            user_id,
            username: None,
            phone: None,
            address: None,
            avatar_url: None,
            gender: None,
            birth_date: None,
        }
    }
} 