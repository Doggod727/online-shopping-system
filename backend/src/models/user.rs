use serde::{Deserialize, Serialize};
use uuid::Uuid;
use diesel::prelude::*;
use std::fmt;
use std::str::FromStr;
use crate::schema::users;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum UserRole {
    Customer,
    Admin,
    Vendor,
}

impl fmt::Display for UserRole {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            UserRole::Customer => write!(f, "customer"),
            UserRole::Admin => write!(f, "admin"),
            UserRole::Vendor => write!(f, "vendor"),
        }
    }
}

impl FromStr for UserRole {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "customer" => Ok(UserRole::Customer),
            "admin" => Ok(UserRole::Admin),
            "vendor" => Ok(UserRole::Vendor),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Queryable, Identifiable, Selectable)]
#[diesel(table_name = users)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
#[diesel(primary_key(id))]
pub struct User {
    pub id: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String, // Stored as string in database
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Insertable)]
#[diesel(table_name = users)]
pub struct NewUser {
    pub id: String,
    pub email: String,
    pub password_hash: String,
    pub role: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

impl User {
    pub fn new(email: String, password_hash: String, role: UserRole) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            email,
            password_hash,
            role: role.to_string(),
            created_at: now.naive_utc(),
            updated_at: now.naive_utc(),
        }
    }
    
    pub fn get_role(&self) -> Result<UserRole, ()> {
        UserRole::from_str(&self.role)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserDto {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginDto {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub role: UserRole,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id.clone(),
            email: user.email.clone(),
            role: UserRole::from_str(&user.role).unwrap_or(UserRole::Customer),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub user: UserResponse,
    pub token: String,
}

impl From<CreateUserDto> for NewUser {
    fn from(dto: CreateUserDto) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            email: dto.email,
            password_hash: String::new(), // Will be set during creation
            role: UserRole::Customer.to_string(),
            created_at: now.naive_utc(),
            updated_at: now.naive_utc(),
        }
    }
} 