use serde::{Deserialize, Serialize};
use uuid::Uuid;
use diesel::prelude::*;
use crate::schema::cart_items;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = cart_items)]
#[diesel(primary_key(id))]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
pub struct CartItem {
    pub id: String,
    pub user_id: String,
    pub product_id: String,
    pub quantity: i32,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Insertable)]
#[diesel(table_name = cart_items)]
pub struct NewCartItem {
    pub id: String,
    pub user_id: String,
    pub product_id: String,
    pub quantity: i32,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

impl CartItem {
    pub fn new(user_id: String, product_id: String, quantity: i32) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            user_id,
            product_id,
            quantity,
            created_at: now.naive_utc(),
            updated_at: now.naive_utc(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddToCartDto {
    pub product_id: String,
    pub quantity: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCartItemDto {
    pub quantity: i32,
}

#[derive(Debug, Serialize)]
pub struct CartItemResponse {
    pub id: String,
    pub product_id: String,
    pub quantity: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<CartItem> for CartItemResponse {
    fn from(item: CartItem) -> Self {
        Self {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            created_at: chrono::DateTime::from_naive_utc_and_offset(item.created_at, chrono::Utc),
            updated_at: chrono::DateTime::from_naive_utc_and_offset(item.updated_at, chrono::Utc),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CartResponse {
    pub items: Vec<CartItemWithProductResponse>,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CartItemWithProductResponse {
    pub id: String,
    pub product_id: String,
    pub product_name: String,
    pub product_price: f64,
    pub quantity: i32,
    pub subtotal: f64,
} 