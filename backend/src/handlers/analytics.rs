use actix_web::{web, HttpResponse, Responder};
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager};
use serde::{Deserialize, Serialize};
use chrono::{NaiveDateTime, Utc, Duration};
use serde_json::json;

use crate::models::user::User;
use crate::models::order::{Order, OrderItem};
use crate::models::product::Product;
use crate::schema::{users, orders, order_items, products};

type DbPool = r2d2::Pool<ConnectionManager<diesel::mysql::MysqlConnection>>;

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalyticsParams {
    pub start_date: Option<String>,  // 格式: YYYY-MM-DD
    pub end_date: Option<String>,    // 格式: YYYY-MM-DD
    pub time_period: Option<String>, // daily, weekly, monthly, yearly
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalyticsSummary {
    pub total_users: i64,
    pub total_orders: i64,
    pub total_revenue: f64,
    pub total_products: i64,
    pub average_order_value: f64,
    pub new_users_count: i64,
    pub conversion_rate: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimeSeriesData {
    pub label: String,
    pub value: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryData {
    pub category: String,
    pub count: i64,
    pub value: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalyticsResponse {
    pub summary: AnalyticsSummary,
    pub sales_over_time: Vec<TimeSeriesData>,
    pub orders_over_time: Vec<TimeSeriesData>,
    pub top_products: Vec<CategoryData>,
    pub revenue_by_category: Vec<CategoryData>,
    pub users_by_role: Vec<CategoryData>,
}

// 获取数据分析摘要
pub async fn get_analytics_summary(
    query: web::Query<AnalyticsParams>,
    pool: web::Data<DbPool>,
) -> impl Responder {
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => return HttpResponse::InternalServerError().json(format!("数据库连接失败: {}", e)),
    };
    
    let mut conn = conn;
    
    // 处理日期范围
    let (start_date, end_date) = parse_date_range(&query);
    
    // 获取基本统计数据
    let summary = match get_summary(&mut conn, &start_date, &end_date) {
        Ok(summary) => summary,
        Err(e) => return HttpResponse::InternalServerError().json(format!("获取统计数据失败: {}", e)),
    };
    
    // 获取时间序列数据
    let sales_over_time = match get_sales_over_time(&mut conn, &start_date, &end_date, &query.time_period) {
        Ok(data) => data,
        Err(e) => return HttpResponse::InternalServerError().json(format!("获取销售时间序列数据失败: {}", e)),
    };
    
    let orders_over_time = match get_orders_over_time(&mut conn, &start_date, &end_date, &query.time_period) {
        Ok(data) => data,
        Err(e) => return HttpResponse::InternalServerError().json(format!("获取订单时间序列数据失败: {}", e)),
    };
    
    // 获取产品和类别数据
    let top_products = match get_top_products(&mut conn, &start_date, &end_date) {
        Ok(data) => data,
        Err(e) => return HttpResponse::InternalServerError().json(format!("获取热门产品数据失败: {}", e)),
    };
    
    let revenue_by_category = match get_revenue_by_category(&mut conn, &start_date, &end_date) {
        Ok(data) => data,
        Err(e) => return HttpResponse::InternalServerError().json(format!("获取类别收入数据失败: {}", e)),
    };
    
    // 获取用户角色分布
    let users_by_role = match get_users_by_role(&mut conn) {
        Ok(data) => data,
        Err(e) => return HttpResponse::InternalServerError().json(format!("获取用户角色分布失败: {}", e)),
    };
    
    // 构建响应
    let response = AnalyticsResponse {
        summary,
        sales_over_time,
        orders_over_time,
        top_products,
        revenue_by_category,
        users_by_role,
    };
    
    HttpResponse::Ok().json(response)
}

// 解析日期范围
fn parse_date_range(params: &web::Query<AnalyticsParams>) -> (NaiveDateTime, NaiveDateTime) {
    let now = Utc::now().naive_utc();
    let one_month_ago = now - Duration::days(30);
    
    let end_date = match &params.end_date {
        Some(date_str) => {
            match NaiveDateTime::parse_from_str(&format!("{} 23:59:59", date_str), "%Y-%m-%d %H:%M:%S") {
                Ok(date) => date,
                Err(_) => now,
            }
        },
        None => now,
    };
    
    let start_date = match &params.start_date {
        Some(date_str) => {
            match NaiveDateTime::parse_from_str(&format!("{} 00:00:00", date_str), "%Y-%m-%d %H:%M:%S") {
                Ok(date) => date,
                Err(_) => one_month_ago,
            }
        },
        None => one_month_ago,
    };
    
    (start_date, end_date)
}

// 获取统计摘要
fn get_summary(
    conn: &mut diesel::mysql::MysqlConnection,
    start_date: &NaiveDateTime,
    end_date: &NaiveDateTime,
) -> Result<AnalyticsSummary, diesel::result::Error> {
    use diesel::dsl::count;
    use diesel::dsl::sum;
    
    // 总用户数
    let total_users = users::table
        .select(count(users::id))
        .first::<i64>(conn)?;
    
    // 总订单数
    let total_orders = orders::table
        .select(count(orders::id))
        .filter(orders::created_at.between(start_date, end_date))
        .first::<i64>(conn)?;
    
    // 总收入
    let total_revenue: f64 = orders::table
        .select(sum(orders::total))
        .filter(orders::created_at.between(start_date, end_date))
        .first::<Option<f64>>(conn)?
        .unwrap_or(0.0);
    
    // 总产品数
    let total_products = products::table
        .select(count(products::id))
        .first::<i64>(conn)?;
    
    // 平均订单价值
    let average_order_value = if total_orders > 0 {
        total_revenue / total_orders as f64
    } else {
        0.0
    };
    
    // 新用户数
    let new_users_count = users::table
        .select(count(users::id))
        .filter(users::created_at.between(start_date, end_date))
        .first::<i64>(conn)?;
    
    // 转化率 (简化计算：订单数/用户数)
    let conversion_rate = if total_users > 0 {
        (total_orders as f64 / total_users as f64) * 100.0
    } else {
        0.0
    };
    
    Ok(AnalyticsSummary {
        total_users,
        total_orders,
        total_revenue,
        total_products,
        average_order_value,
        new_users_count,
        conversion_rate,
    })
}

// 获取销售时间序列
fn get_sales_over_time(
    conn: &mut diesel::mysql::MysqlConnection,
    start_date: &NaiveDateTime,
    end_date: &NaiveDateTime,
    time_period: &Option<String>,
) -> Result<Vec<TimeSeriesData>, diesel::result::Error> {
    // 这里简化实现，返回模拟数据
    // 实际实现应使用SQL分组查询或聚合函数
    
    let period = time_period.as_deref().unwrap_or("daily");
    let mut result = Vec::new();
    
    // 模拟数据生成
    match period {
        "daily" => {
            for i in 0..30 {
                let day = (Utc::now() - Duration::days(i)).format("%m-%d").to_string();
                let value = 1000.0 + (i as f64 * 100.0) * (1.0 + (i as f64 * 0.01).sin());
                result.push(TimeSeriesData {
                    label: day,
                    value,
                });
            }
        },
        "weekly" => {
            for i in 0..12 {
                let week = format!("第{}周", i + 1);
                let value = 7000.0 + (i as f64 * 500.0) * (1.0 + (i as f64 * 0.1).sin());
                result.push(TimeSeriesData {
                    label: week,
                    value,
                });
            }
        },
        "monthly" => {
            for i in 0..12 {
                let month = format!("{}月", i + 1);
                let value = 30000.0 + (i as f64 * 2000.0) * (1.0 + (i as f64 * 0.2).sin());
                result.push(TimeSeriesData {
                    label: month,
                    value,
                });
            }
        },
        "yearly" => {
            for i in 0..5 {
                let year = format!("202{}年", i);
                let value = 365000.0 + (i as f64 * 50000.0);
                result.push(TimeSeriesData {
                    label: year,
                    value,
                });
            }
        },
        _ => {
            for i in 0..30 {
                let day = (Utc::now() - Duration::days(i)).format("%m-%d").to_string();
                let value = 1000.0 + (i as f64 * 100.0) * (1.0 + (i as f64 * 0.01).sin());
                result.push(TimeSeriesData {
                    label: day,
                    value,
                });
            }
        },
    }
    
    result.reverse();
    Ok(result)
}

// 获取订单时间序列
fn get_orders_over_time(
    conn: &mut diesel::mysql::MysqlConnection,
    start_date: &NaiveDateTime,
    end_date: &NaiveDateTime,
    time_period: &Option<String>,
) -> Result<Vec<TimeSeriesData>, diesel::result::Error> {
    // 简化实现，返回模拟数据
    let period = time_period.as_deref().unwrap_or("daily");
    let mut result = Vec::new();
    
    // 模拟数据生成
    match period {
        "daily" => {
            for i in 0..30 {
                let day = (Utc::now() - Duration::days(i)).format("%m-%d").to_string();
                let value = 10.0 + (i as f64 * 1.0) * (1.0 + (i as f64 * 0.05).sin());
                result.push(TimeSeriesData {
                    label: day,
                    value,
                });
            }
        },
        "weekly" => {
            for i in 0..12 {
                let week = format!("第{}周", i + 1);
                let value = 70.0 + (i as f64 * 5.0) * (1.0 + (i as f64 * 0.1).sin());
                result.push(TimeSeriesData {
                    label: week,
                    value,
                });
            }
        },
        "monthly" => {
            for i in 0..12 {
                let month = format!("{}月", i + 1);
                let value = 300.0 + (i as f64 * 20.0) * (1.0 + (i as f64 * 0.2).sin());
                result.push(TimeSeriesData {
                    label: month,
                    value,
                });
            }
        },
        "yearly" => {
            for i in 0..5 {
                let year = format!("202{}年", i);
                let value = 3650.0 + (i as f64 * 500.0);
                result.push(TimeSeriesData {
                    label: year,
                    value,
                });
            }
        },
        _ => {
            for i in 0..30 {
                let day = (Utc::now() - Duration::days(i)).format("%m-%d").to_string();
                let value = 10.0 + (i as f64 * 1.0) * (1.0 + (i as f64 * 0.05).sin());
                result.push(TimeSeriesData {
                    label: day,
                    value,
                });
            }
        },
    }
    
    result.reverse();
    Ok(result)
}

// 获取热门产品
fn get_top_products(
    conn: &mut diesel::mysql::MysqlConnection,
    start_date: &NaiveDateTime,
    end_date: &NaiveDateTime,
) -> Result<Vec<CategoryData>, diesel::result::Error> {
    // 简化实现，返回模拟数据
    Ok(vec![
        CategoryData {
            category: "智能手机".to_string(),
            count: 150,
            value: 45000.0,
        },
        CategoryData {
            category: "笔记本电脑".to_string(),
            count: 75,
            value: 75000.0,
        },
        CategoryData {
            category: "耳机".to_string(),
            count: 200,
            value: 20000.0,
        },
        CategoryData {
            category: "手表".to_string(),
            count: 90,
            value: 18000.0,
        },
        CategoryData {
            category: "平板电脑".to_string(),
            count: 60,
            value: 30000.0,
        },
    ])
}

// 获取类别收入
fn get_revenue_by_category(
    conn: &mut diesel::mysql::MysqlConnection,
    start_date: &NaiveDateTime,
    end_date: &NaiveDateTime,
) -> Result<Vec<CategoryData>, diesel::result::Error> {
    // 简化实现，返回模拟数据
    Ok(vec![
        CategoryData {
            category: "电子产品".to_string(),
            count: 350,
            value: 105000.0,
        },
        CategoryData {
            category: "家居".to_string(),
            count: 200,
            value: 40000.0,
        },
        CategoryData {
            category: "服装".to_string(),
            count: 450,
            value: 36000.0,
        },
        CategoryData {
            category: "食品".to_string(),
            count: 600,
            value: 24000.0,
        },
        CategoryData {
            category: "书籍".to_string(),
            count: 250,
            value: 15000.0,
        },
    ])
}

// 获取用户角色分布
fn get_users_by_role(
    conn: &mut diesel::mysql::MysqlConnection,
) -> Result<Vec<CategoryData>, diesel::result::Error> {
    // 简化实现，返回模拟数据
    Ok(vec![
        CategoryData {
            category: "普通用户".to_string(),
            count: 2000,
            value: 2000.0,
        },
        CategoryData {
            category: "供应商".to_string(),
            count: 50,
            value: 50.0,
        },
        CategoryData {
            category: "管理员".to_string(),
            count: 5,
            value: 5.0,
        },
    ])
} 