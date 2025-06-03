use serde::{Deserialize, Serialize};
use uuid::Uuid;
use diesel::prelude::*;
use crate::schema::favorites;
use chrono::Utc;
use diesel::sql_types::*;

#[derive(Debug, Serialize, Deserialize, Queryable, Identifiable, Selectable, QueryableByName)]
#[diesel(table_name = favorites)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
pub struct Favorite {
    #[diesel(sql_type = VarChar)]
    pub id: String,
    #[diesel(sql_type = VarChar)]
    pub user_id: String,
    #[diesel(sql_type = VarChar)]
    pub product_id: String,
    #[diesel(sql_type = Timestamp)]
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Insertable)]
#[diesel(table_name = favorites)]
pub struct NewFavorite {
    pub id: String,
    pub user_id: String,
    pub product_id: String,
    pub created_at: chrono::NaiveDateTime,
}

// DTO for favorite responses
#[derive(Debug, Serialize, Deserialize)]
pub struct FavoriteResponse {
    pub id: String,
    pub user_id: String,
    pub product_id: String,
    pub created_at: chrono::NaiveDateTime,
    pub product: Option<ProductInfo>,
}

// 简化的产品信息，用于收藏夹响应
#[derive(Debug, Serialize, Deserialize)]
pub struct ProductInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub price: f64,
    pub vendor_id: String,
    pub stock: i32,
    pub category: Option<String>,
}

impl NewFavorite {
    pub fn new(user_id: String, product_id: String) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            user_id,
            product_id,
            created_at: now.naive_utc(),
        }
    }
} 