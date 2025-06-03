-- 创建admin_profiles表
CREATE TABLE IF NOT EXISTS admin_profiles (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    site_description TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    order_prefix VARCHAR(20) NOT NULL,
    items_per_page INT NOT NULL,
    allow_registration BOOLEAN NOT NULL,
    maintenance_mode BOOLEAN NOT NULL,
    theme VARCHAR(50) NOT NULL,
    currency_symbol VARCHAR(10) NOT NULL,
    tax_rate DOUBLE NOT NULL,
    payment_gateways TEXT NOT NULL,
    log_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
); 