use serde::{Deserialize, Serialize};
use uuid::Uuid;
use diesel::prelude::*;
use std::fmt;
use std::str::FromStr;
use crate::schema::{orders, order_items};
use chrono::Utc;
use diesel::sql_types::*;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum OrderStatus {
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
}

impl fmt::Display for OrderStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OrderStatus::Pending => write!(f, "pending"),
            OrderStatus::Processing => write!(f, "processing"),
            OrderStatus::Shipped => write!(f, "shipped"),
            OrderStatus::Delivered => write!(f, "delivered"),
            OrderStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

impl FromStr for OrderStatus {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" => Ok(OrderStatus::Pending),
            "processing" => Ok(OrderStatus::Processing),
            "shipped" => Ok(OrderStatus::Shipped),
            "delivered" => Ok(OrderStatus::Delivered),
            "cancelled" => Ok(OrderStatus::Cancelled),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Queryable, Identifiable, Selectable, Associations, QueryableByName, Clone)]
#[diesel(belongs_to(Order))]
#[diesel(table_name = order_items)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
pub struct OrderItem {
    #[diesel(sql_type = VarChar)]
    pub id: String,
    #[diesel(sql_type = VarChar)]
    pub order_id: String,
    #[diesel(sql_type = VarChar)]
    pub product_id: String,
    #[diesel(sql_type = Integer)]
    pub quantity: i32,
    #[diesel(sql_type = Double)]
    pub price: f64,
}

#[derive(Debug, Serialize, Deserialize, Queryable, Identifiable, Selectable, QueryableByName)]
#[diesel(table_name = orders)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
pub struct Order {
    #[diesel(sql_type = VarChar)]
    pub id: String,
    #[diesel(sql_type = VarChar)]
    pub user_id: String,
    #[diesel(sql_type = Double)]
    pub total: f64,
    #[diesel(sql_type = VarChar)]
    pub status: String,
    #[diesel(sql_type = Timestamp)]
    pub created_at: chrono::NaiveDateTime,
    #[diesel(sql_type = Timestamp)]
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Insertable)]
#[diesel(table_name = orders)]
pub struct NewOrder {
    pub id: String,
    pub user_id: String,
    pub status: String,
    pub total: f64,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Insertable)]
#[diesel(table_name = order_items)]
pub struct NewOrderItem {
    pub id: String,
    pub order_id: String,
    pub product_id: String,
    pub quantity: i32,
    pub price: f64,
}

// DTO for order responses
#[derive(Debug, Serialize, Deserialize)]
pub struct OrderResponse {
    pub id: String,
    pub user_id: String,
    pub total: f64,
    pub status: OrderStatus,
    pub items: Vec<OrderItemResponse>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderItemResponse {
    pub id: String,
    pub product_id: String,
    pub quantity: i32,
    pub price: f64,
}

// DTO for updating order status
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateOrderStatusDto {
    pub status: String,
}

impl Order {
    pub fn new(user_id: String, total: f64) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            user_id,
            total,
            status: OrderStatus::Pending.to_string(),
            created_at: now.naive_utc(),
            updated_at: now.naive_utc(),
        }
    }

    pub fn get_status(&self) -> Result<OrderStatus, ()> {
        OrderStatus::from_str(&self.status)
    }
    
    // 从数据库记录转换为Diesel兼容的Order
    pub fn from_db_order(order_id: i32, user_id: i32, status: &str, total: f64, created_at: chrono::NaiveDateTime, updated_at: chrono::NaiveDateTime) -> Self {
        Self {
            id: order_id.to_string(),
            user_id: user_id.to_string(),
            status: status.to_string(),
            total,
            created_at,
            updated_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateOrderDto {
    pub items: Vec<OrderItemDto>,
}

#[derive(Debug, Deserialize)]
pub struct OrderItemDto {
    pub product_id: String,
    pub quantity: i32,
} 