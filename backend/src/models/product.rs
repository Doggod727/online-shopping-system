use serde::{Deserialize, Serialize};
use uuid::Uuid;
use diesel::prelude::*;
use chrono::Utc;
use crate::schema::products;

#[derive(Debug, Serialize, Deserialize, Clone, Queryable, Identifiable, Selectable)]
#[diesel(table_name = products)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
pub struct Product {
    pub id: String,
    pub name: String,
    pub description: String,
    pub price: f64,
    pub vendor_id: String,
    pub stock: i32,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
    pub category: Option<String>,
}

#[derive(Insertable)]
#[diesel(table_name = products)]
pub struct NewProduct {
    pub id: String,
    pub name: String,
    pub description: String,
    pub price: f64,
    pub vendor_id: String,
    pub stock: i32,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
    pub category: Option<String>,
}

impl Product {
    pub fn new(name: String, description: String, price: f64, vendor_id: String, stock: i32, category: Option<String>) -> NewProduct {
        let now = Utc::now();
        NewProduct {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            price,
            vendor_id,
            stock,
            created_at: now.naive_utc(),
            updated_at: now.naive_utc(),
            category,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductResponse {
    pub id: String,
    pub name: String,
    pub description: String,
    pub price: f64,
    pub vendor_id: String,
    pub stock: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub category: Option<String>,
    pub in_stock: bool,
}

impl From<Product> for ProductResponse {
    fn from(product: Product) -> Self {
        Self {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            vendor_id: product.vendor_id,
            stock: product.stock,
            created_at: chrono::DateTime::from_naive_utc_and_offset(product.created_at, chrono::Utc),
            updated_at: chrono::DateTime::from_naive_utc_and_offset(product.updated_at, chrono::Utc),
            category: product.category,
            in_stock: product.stock > 0,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProductDto {
    pub name: String,
    pub description: String,
    pub price: f64,
    pub stock: i32,
    pub category: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProductDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub price: Option<f64>,
    pub stock: Option<i32>,
    pub category: Option<String>,
}

impl From<CreateProductDto> for NewProduct {
    fn from(dto: CreateProductDto) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name: dto.name,
            description: dto.description,
            price: dto.price,
            vendor_id: String::new(), // Will be set during creation
            stock: dto.stock,
            created_at: now.naive_utc(),
            updated_at: now.naive_utc(),
            category: dto.category,
        }
    }
}

impl From<NewProduct> for ProductResponse {
    fn from(product: NewProduct) -> Self {
        Self {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            vendor_id: product.vendor_id,
            stock: product.stock,
            created_at: chrono::DateTime::from_naive_utc_and_offset(product.created_at, chrono::Utc),
            updated_at: chrono::DateTime::from_naive_utc_and_offset(product.updated_at, chrono::Utc),
            category: product.category,
            in_stock: product.stock > 0,
        }
    }
}