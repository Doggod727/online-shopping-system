-- Online Shopping System Database Initialization Script
-- Create database
CREATE DATABASE IF NOT EXISTS online_shopping;
USE online_shopping;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DOUBLE NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    category VARCHAR(255),
    FOREIGN KEY (vendor_id) REFERENCES users(id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    total DOUBLE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    price DOUBLE NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY user_product (user_id, product_id)
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY user_product (user_id, product_id)
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    username VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    avatar_url VARCHAR(255),
    gender ENUM('male', 'female', 'other'),
    birth_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (user_id)
);

-- Vendor profiles table
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id VARCHAR(36) PRIMARY KEY,
    vendor_id VARCHAR(36) NOT NULL,
    store_name VARCHAR(255),
    store_description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    store_address TEXT,
    store_logo_url VARCHAR(255),
    store_banner_url VARCHAR(255),
    business_hours VARCHAR(255),
    accepts_returns BOOLEAN DEFAULT TRUE,
    return_policy TEXT,
    shipping_methods TEXT,
    payment_methods TEXT,
    notification_settings TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Admin profiles table
CREATE TABLE IF NOT EXISTS admin_profiles (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    site_name VARCHAR(255),
    site_description TEXT,
    contact_email VARCHAR(255),
    order_prefix VARCHAR(10),
    items_per_page INT DEFAULT 10,
    allow_registration BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    theme VARCHAR(50) DEFAULT 'light',
    currency_symbol VARCHAR(10) DEFAULT '¥',
    tax_rate DOUBLE DEFAULT 13.0,
    payment_gateways TEXT,
    log_level VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (admin_id)
);

-- Clean up old sample data (if exists)
-- Note: If this is the first run, these DELETE statements may not affect any rows, which is normal.
-- For safety, delete in reverse order of dependencies
DELETE FROM products;
DELETE FROM admin_profiles;
DELETE FROM vendor_profiles;
DELETE FROM user_profiles;
DELETE FROM users WHERE role IN ('admin', 'vendor', 'customer'); -- Only delete specific role users, avoid deleting other important users (if any)

-- Initialize user data
-- Admin user (1)
INSERT INTO users (id, email, password_hash, role) VALUES
('admin-001', 'admin@example.com', 'admin123', 'admin'); -- Warning: This is a plaintext password, should use hashed passwords in production

-- Vendor users (3)
INSERT INTO users (id, email, password_hash, role) VALUES
('vendor-001', 'vendor1@example.com', 'vendor1123', 'vendor'), -- Warning: This is a plaintext password, should use hashed passwords in production
('vendor-002', 'vendor2@example.com', 'vendor2123', 'vendor'), -- Warning: This is a plaintext password, should use hashed passwords in production
('vendor-003', 'vendor3@example.com', 'vendor3123', 'vendor'); -- Warning: This is a plaintext password, should use hashed passwords in production

-- Customer users (10)
INSERT INTO users (id, email, password_hash, role) VALUES
('customer-001', 'customer1@example.com', 'customer1123', 'customer'), -- Warning: This is a plaintext password, should use hashed passwords in production
('customer-002', 'customer2@example.com', 'customer2123', 'customer'), -- Warning: This is a plaintext password, should use hashed passwords in production
('customer-003', 'customer3@example.com', 'customer3123', 'customer'), -- Warning: This is a plaintext password, should use hashed passwords in production
('customer-004', 'customer4@example.com', 'customer4123', 'customer'), -- Warning: This is a plaintext password, should use hashed passwords in production
('customer-005', 'customer5@example.com', 'customer5123', 'customer'), -- Warning: This is a plaintext password, should use hashed passwords in production
('customer-006', 'customer6@example.com', 'customer6123', 'customer'), -- Warning: This is a plaintext password, should use hashed passwords in production
('customer-007', 'customer7@example.com', 'customer7123', 'customer'), -- Warning: This is a plaintext password, should use hashed passwords in production
('customer-008', 'customer8@example.com', 'customer8123', 'customer'), -- Warning: This is a plaintext password, should use hashed passwords in production
('customer-009', 'customer9@example.com', 'customer9123', 'customer'), -- Warning: This is a plaintext password, should use hashed passwords in production
('customer-010', 'customer10@example.com', 'customer10123', 'customer'); -- Warning: This is a plaintext password, should use hashed passwords in production

-- Initialize user profiles
-- Admin Profile
INSERT INTO user_profiles (id, user_id, username, phone, address, avatar_url, gender, birth_date) VALUES
(UUID(), 'admin-001', 'Administrator', '10000000000', '123 Admin St, Control City', 'https://example.com/avatars/admin.png', 'other', '1990-01-01');

-- Vendor Profiles
INSERT INTO user_profiles (id, user_id, username, phone, address, avatar_url, gender, birth_date) VALUES
(UUID(), 'vendor-001', 'Vendor One Store', '10000000001', '1 Vendor Rd, Market Town', 'https://example.com/avatars/vendor1.png', 'male', '1985-05-10'),
(UUID(), 'vendor-002', 'Vendor Two Emporium', '10000000002', '2 Emporium Ave, Trade City', 'https://example.com/avatars/vendor2.png', 'female', '1992-08-15'),
(UUID(), 'vendor-003', 'Vendor Three Goods', '10000000003', '3 Goods Ln, Supply Village', 'https://example.com/avatars/vendor3.png', 'male', '1988-12-01');

-- Customer Profiles
INSERT INTO user_profiles (id, user_id, username, phone, address, avatar_url, gender, birth_date) VALUES
(UUID(), 'customer-001', 'Alice Wonderland', '10000000011', '1 Wonder St, Fantasy Land', 'https://example.com/avatars/alice.png', 'female', '2000-03-10'),
(UUID(), 'customer-002', 'Bob The Builder', '10000000012', '2 Build It Rd, Construction City', 'https://example.com/avatars/bob.png', 'male', '1995-07-20'),
(UUID(), 'customer-003', 'Charlie Brown', '10000000013', '3 Peanut Ave, Comic Strip Town', 'https://example.com/avatars/charlie.png', 'male', '2002-11-05'),
(UUID(), 'customer-004', 'Diana Prince', '10000000014', '4 Amazon Cir, Themyscira', 'https://example.com/avatars/diana.png', 'female', '1998-06-17'),
(UUID(), 'customer-005', 'Edward Scissorhands', '10000000015', '5 Shear St, Gothic Suburbia', 'https://example.com/avatars/edward.png', 'male', '1993-02-25'),
(UUID(), 'customer-006', 'Fiona Apple', '10000000016', '6 Orchard Ln, Music Ville', 'https://example.com/avatars/fiona.png', 'female', '1999-09-13'),
(UUID(), 'customer-007', 'George Jetson', '10000000017', '7 SkyPad Apts, Orbit City', 'https://example.com/avatars/george.png', 'male', '1989-04-30'),
(UUID(), 'customer-008', 'Harley Quinn', '10000000018', '8 Funhouse Rd, Gotham City', 'https://example.com/avatars/harley.png', 'female', '1997-10-08'),
(UUID(), 'customer-009', 'Indiana Jones', '10000000019', '9 Adventure Trl, Discovery Land', 'https://example.com/avatars/indy.png', 'male', '1991-07-14'),
(UUID(), 'customer-010', 'Jane Doe', '10000000020', '10 Anonymous St, Every Town', 'https://example.com/avatars/jane.png', 'female', '2001-01-20');

-- Initialize vendor profiles
INSERT INTO vendor_profiles (id, vendor_id, store_name, store_description, contact_email, contact_phone, store_address, store_logo_url, business_hours, accepts_returns, return_policy, shipping_methods, payment_methods) VALUES
(UUID(), 'vendor-001', 'Digital Dreams Electronics', 'Your one-stop shop for the latest gadgets and electronics.', 'contact@digitaldreams.com', '10000000001', '1 Tech Park, Silicon Valley', 'https://example.com/logos/digitaldreams.png', 'Mon-Sat: 9am-7pm', TRUE, '30-day return policy', 'Standard, Express', 'Credit Card, PayPal'),
(UUID(), 'vendor-002', 'Fashion Forward Boutique', 'Curated collection of trendy apparel and accessories.', 'support@fashionforward.com', '10000000002', '5th Avenue, Fashion District', 'https://example.com/logos/fashionforward.png', 'Mon-Sun: 10am-8pm', TRUE, '14-day return for unworn items', 'Standard Shipping', 'Credit Card, Apple Pay, WeChat Pay'),
(UUID(), 'vendor-003', 'Home Comforts Co.', 'Everything you need to make your house a home.', 'info@homecomforts.co', '10000000003', '10 Cosy Lane, Suburbia', 'https://example.com/logos/homecomforts.png', 'Tue-Sun: 10am-6pm', FALSE, 'Final sale on discounted items', 'Local Delivery, Standard Post', 'Credit Card, Alipay');

-- Initialize admin profiles
INSERT INTO admin_profiles (
    id, admin_id, site_name, site_description, contact_email, order_prefix, items_per_page, allow_registration, maintenance_mode, theme, currency_symbol, tax_rate, payment_gateways, log_level
) VALUES (
    UUID(), 'admin-001', 'Online Shopping System Pro', 'Upgraded online shopping system with powerful features!', 'admin_pro@example.com', 'PRO-', 12, TRUE, FALSE, 'dark', '$', 13.5, 'alipay,wechatpay,card', 'debug'
);

-- Initialize product data
-- 50 products per vendor, 150 products in total
-- Product categories: Electronics, Books, Clothing & Accessories, Home & Kitchen, Sports & Outdoors, Beauty & Personal Care, Toys & Games, Automotive, Groceries & Gourmet Food, Office Supplies, Pet Supplies, Handmade

-- Vendor 1 ('vendor-001'): Digital Dreams Electronics (Focus on Electronics, Office Supplies, some Toys & Games)
INSERT INTO products (id, name, description, price, vendor_id, stock, category, created_at, updated_at) VALUES 
-- Electronics (20)
(UUID(), 'Ultra HD Smart TV 65"', 'Stunning 4K resolution, smart features, HDR.', 4999.0, 'vendor-001', 30, 'Electronics', NOW(), NOW()),
(UUID(), 'Noise Cancelling Headphones X200', 'Immersive sound, long battery life, comfortable fit.', 1299.0, 'vendor-001', 50, 'Electronics', NOW(), NOW()),
(UUID(), 'Gaming Laptop Predator Z', 'High-performance for gamers, RTX 4090, 32GB RAM.', 18999.0, 'vendor-001', 15, 'Electronics', NOW(), NOW()),
(UUID(), 'Wireless Charging Pad Duo', 'Charge two devices simultaneously, fast charging.', 299.0, 'vendor-001', 100, 'Electronics', NOW(), NOW()),
(UUID(), 'Smartwatch Series 8', 'Health tracking, GPS, waterproof.', 2899.0, 'vendor-001', 60, 'Electronics', NOW(), NOW()),
(UUID(), 'Portable Bluetooth Speaker Rocker', 'Loud sound, waterproof, 24h playtime.', 499.0, 'vendor-001', 70, 'Electronics', NOW(), NOW()),
(UUID(), 'Digital Camera Alpha Pro', 'Mirrorless, 4K video, interchangeable lenses.', 7999.0, 'vendor-001', 25, 'Electronics', NOW(), NOW()),
(UUID(), 'E-Reader Voyage', 'Paper-like display, waterproof, weeks of battery.', 999.0, 'vendor-001', 40, 'Electronics', NOW(), NOW()),
(UUID(), 'Action Camera Hero 12', '4K 60fps, image stabilization, rugged design.', 2599.0, 'vendor-001', 35, 'Electronics', NOW(), NOW()),
(UUID(), 'VR Headset RealityMax', 'Immersive virtual reality experiences.', 3299.0, 'vendor-001', 20, 'Electronics', NOW(), NOW()),
(UUID(), 'Drone Skywalker Pro', '4K camera, 30min flight time, GPS.', 6999.0, 'vendor-001', 18, 'Electronics', NOW(), NOW()),
(UUID(), 'Home Security Camera System (4 pack)', '1080p, night vision, motion detection.', 1599.0, 'vendor-001', 40, 'Electronics', NOW(), NOW()),
(UUID(), 'Tablet Pro 11 inch', 'Powerful processor, stunning display, great for productivity.', 4599.0, 'vendor-001', 30, 'Electronics', NOW(), NOW()),
(UUID(), 'Wireless Mouse ErgoComfort', 'Ergonomic design, multi-device support.', 199.0, 'vendor-001', 120, 'Electronics', NOW(), NOW()),
(UUID(), 'Mechanical Keyboard ClickMaster', 'RGB backlighting, customizable keys.', 699.0, 'vendor-001', 50, 'Electronics', NOW(), NOW()),
(UUID(), 'USB-C Hub Multiport Adapter', 'Expand your connectivity options.', 249.0, 'vendor-001', 90, 'Electronics', NOW(), NOW()),
(UUID(), 'High-Speed SSD 2TB NVMe', 'Blazing fast storage for your PC or laptop.', 1299.0, 'vendor-001', 40, 'Electronics', NOW(), NOW()),
(UUID(), 'Wi-Fi 6 Mesh Router System (3 pack)', 'Whole-home coverage, fast speeds.', 1899.0, 'vendor-001', 25, 'Electronics', NOW(), NOW()),
(UUID(), 'Power Bank 20000mAh SuperCharge', 'Charge your devices on the go, multiple ports.', 349.0, 'vendor-001', 80, 'Electronics', NOW(), NOW()),
(UUID(), 'Graphics Tablet ArtistPad', 'For digital artists and designers.', 1199.0, 'vendor-001', 30, 'Electronics', NOW(), NOW()),
-- Office Supplies (15)
(UUID(), 'Ergonomic Office Chair ProSupport', 'Adjustable lumbar support, breathable mesh.', 1599.0, 'vendor-001', 20, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Standing Desk Converter RiseUp', 'Easily switch between sitting and standing.', 899.0, 'vendor-001', 30, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Laser Printer All-in-One', 'Print, scan, copy, fax. High speed.', 1299.0, 'vendor-001', 25, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Monitor Arm Dual Mount', 'Free up desk space, ergonomic positioning.', 399.0, 'vendor-001', 40, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Document Shredder SecureX', 'Cross-cut, 10-sheet capacity.', 459.0, 'vendor-001', 30, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Noise-Cancelling Office Headset Focus', 'Clear calls, comfortable for long use.', 799.0, 'vendor-001', 35, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Desk Organizer Set Premium Wood', 'Keeps your desk tidy and stylish.', 299.0, 'vendor-001', 50, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Whiteboard Magnetic 48x36"', 'Includes markers and eraser.', 349.0, 'vendor-001', 20, 'Office Supplies', NOW(), NOW()),
(UUID(), 'LED Desk Lamp with USB Charging', 'Adjustable brightness and color temperature.', 189.0, 'vendor-001', 60, 'Office Supplies', NOW(), NOW()),
(UUID(), 'High-Quality Printer Paper (5 Reams)', 'Bright white, 20lb, 500 sheets/ream.', 199.0, 'vendor-001', 100, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Sticky Notes Super Pack (12 pads)', 'Assorted colors, strong adhesive.', 79.0, 'vendor-001', 200, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Filing Cabinet 3-Drawer Metal', 'Lockable, durable construction.', 799.0, 'vendor-001', 15, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Professional Pen Set (3 Pens)', 'Ballpoint, Rollerball, Fountain pen.', 259.0, 'vendor-001', 70, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Cable Management Box Large', 'Hide messy cables and power strips.', 129.0, 'vendor-001', 80, 'Office Supplies', NOW(), NOW()),
(UUID(), 'Heavy Duty Stapler PowerPunch', 'Staples up to 100 sheets.', 229.0, 'vendor-001', 40, 'Office Supplies', NOW(), NOW()),
-- Toys & Games (15)
(UUID(), 'Remote Control Car TurboRacer', 'High speed, all-terrain.', 399.0, 'vendor-001', 40, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Building Blocks Mega Set (1000 pcs)', 'Compatible with major brands.', 299.0, 'vendor-001', 60, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Educational Tablet for Kids LearnPad', 'Pre-loaded with games and learning apps.', 699.0, 'vendor-001', 30, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Strategy Board Game Settlers of World', 'Award-winning game for family and friends.', 349.0, 'vendor-001', 50, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Plush Toy Giant Teddy Bear (4ft)', 'Soft and cuddly, perfect gift.', 499.0, 'vendor-001', 20, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Drone for Kids MiniFlyer', 'Easy to control, safe for indoor use.', 249.0, 'vendor-001', 50, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Science Experiment Kit Explorer', 'Over 50 exciting experiments.', 199.0, 'vendor-001', 40, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Puzzles Collection (5 in 1)', 'Various difficulty levels, 500-1000 pieces.', 229.0, 'vendor-001', 30, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Walkie Talkies Long Range (Pair)', 'Up to 3 miles range, great for adventures.', 189.0, 'vendor-001', 45, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Art Easel for Kids Double Sided', 'Whiteboard and chalkboard, includes accessories.', 329.0, 'vendor-001', 25, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Toy Kitchen Set Deluxe', 'Realistic design with lights and sounds.', 599.0, 'vendor-001', 15, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Magic Kit Astonish', 'Learn amazing magic tricks.', 159.0, 'vendor-001', 35, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Kids Smartwatch PlayTime', 'Games, camera, activity tracker.', 499.0, 'vendor-001', 30, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Interactive Globe Explorer Kids', 'Learn about countries, cultures, and animals.', 399.0, 'vendor-001', 20, 'Toys & Games', NOW(), NOW()),
(UUID(), 'Card Game Exploding Kittens', 'Hilarious and strategic card game.', 149.0, 'vendor-001', 70, 'Toys & Games', NOW(), NOW());

-- Vendor 2 ('vendor-002'): Fashion Forward Boutique (Focus on Clothing & Accessories, Beauty & Personal Care, some Handmade)
INSERT INTO products (id, name, description, price, vendor_id, stock, category, created_at, updated_at) VALUES 
-- Clothing & Accessories (25)
(UUID(), 'Luxury Silk Scarf Blossom', '100% Mulberry silk, hand-rolled edges.', 499.0, 'vendor-002', 50, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Designer Handbag Elegance', 'Genuine leather, timeless design.', 2999.0, 'vendor-002', 20, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Cashmere Sweater SoftCloud', 'Ultra-soft 100% cashmere, various colors.', 1299.0, 'vendor-002', 40, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Tailored Wool Blazer ClassicFit', 'Premium wool blend, perfect for formal occasions.', 1599.0, 'vendor-002', 30, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Leather Belt ArtisanCraft', 'Handcrafted full-grain leather belt.', 399.0, 'vendor-002', 60, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Sunglasses Aviator Pro', 'Polarized lenses, UV400 protection.', 799.0, 'vendor-002', 45, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Denim Jacket VintageWash', 'Classic style, comfortable fit.', 699.0, 'vendor-002', 50, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Little Black Dress Chic', 'Versatile and elegant for any occasion.', 899.0, 'vendor-002', 35, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Sports Bra PerformanceMax', 'High support, moisture-wicking fabric.', 299.0, 'vendor-002', 70, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Yoga Pants FlexFit', 'Comfortable and stretchy for yoga and workouts.', 349.0, 'vendor-002', 80, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Men\'s Dress Shirt SlimFit Cotton', 'Premium cotton, wrinkle-resistant.', 459.0, 'vendor-002', 60, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Women\'s Trench Coat Timeless', 'Water-resistant, classic double-breasted design.', 1899.0, 'vendor-002', 25, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Winter Beanie WarmKnit', 'Wool blend, fleece-lined for extra warmth.', 199.0, 'vendor-002', 90, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Leather Gloves TouchScreen', 'Warm and stylish, compatible with touchscreens.', 329.0, 'vendor-002', 50, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Running Shoes Speedster Pro', 'Lightweight, cushioned, high performance.', 999.0, 'vendor-002', 40, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Elegant Evening Gown StarryNight', 'Sequin embellishments, floor length.', 2599.0, 'vendor-002', 15, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Swimsuit Bikini Set Tropical', 'Vibrant print, flattering fit.', 399.0, 'vendor-002', 50, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Men\'s Chino Pants ModernCut', 'Comfortable and stylish for everyday wear.', 599.0, 'vendor-002', 40, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Fedora Hat ClassicStyle', 'Wool felt, timeless appeal.', 499.0, 'vendor-002', 30, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Statement Necklace CrystalFall', 'Eye-catching design with crystals.', 699.0, 'vendor-002', 35, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Designer Watch ChronoLux', 'Swiss movement, sapphire crystal.', 4999.0, 'vendor-002', 10, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Silk Pajama Set Dreamy', 'Luxurious and comfortable for a good night\'s sleep.', 799.0, 'vendor-002', 25, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Ankle Boots SuedeChic', 'Versatile boots for autumn and winter.', 1199.0, 'vendor-002', 30, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Backpack UrbanExplorer', 'Durable, spacious, with laptop compartment.', 699.0, 'vendor-002', 40, 'Clothing & Accessories', NOW(), NOW()),
(UUID(), 'Patterned Tights ArtLegs', 'Unique designs to express your style.', 159.0, 'vendor-002', 60, 'Clothing & Accessories', NOW(), NOW()),
-- Beauty & Personal Care (15)
(UUID(), 'Organic Facial Serum Rejuvenate', 'Anti-aging, hydrating, natural ingredients.', 599.0, 'vendor-002', 40, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Artisan Soap Bar Lavender Dream', 'Handmade with essential oils.', 89.0, 'vendor-002', 100, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Professional Makeup Brush Set (12 pcs)', 'High-quality synthetic bristles.', 399.0, 'vendor-002', 50, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Natural Deodorant FreshAllDay', 'Aluminum-free, long-lasting protection.', 129.0, 'vendor-002', 70, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Hair Dryer Ionic Pro', 'Fast drying, reduces frizz.', 499.0, 'vendor-002', 30, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Electric Toothbrush SonicClean', 'Removes plaque effectively, multiple modes.', 699.0, 'vendor-002', 35, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Luxury Bath Bomb Set (6 pack)', 'Relaxing and moisturizing, assorted scents.', 249.0, 'vendor-002', 60, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Anti-Aging Eye Cream BrightEyes', 'Reduces dark circles and wrinkles.', 459.0, 'vendor-002', 40, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Beard Grooming Kit Gentleman', 'Includes oil, balm, comb, and scissors.', 349.0, 'vendor-002', 30, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Sunscreen SPF 50+ ProtectPlus', 'Broad spectrum protection, water-resistant.', 189.0, 'vendor-002', 80, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Lipstick Set MatteFinish (5 colors)', 'Long-lasting, vibrant colors.', 299.0, 'vendor-002', 50, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Shampoo & Conditioner Set ArganOil', 'Nourishing and repairing for dry hair.', 399.0, 'vendor-002', 40, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Manicure & Pedicure Set ProNails', 'Everything you need for perfect nails.', 229.0, 'vendor-002', 30, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Essential Oil Diffuser AromaBliss', 'Ultrasonic, with mood lighting.', 329.0, 'vendor-002', 25, 'Beauty & Personal Care', NOW(), NOW()),
(UUID(), 'Face Mask Variety Pack (10 masks)', 'Hydrating, purifying, brightening.', 199.0, 'vendor-002', 70, 'Beauty & Personal Care', NOW(), NOW()),
-- Handmade (10)
(UUID(), 'Hand-knitted Baby Blanket SoftCuddle', 'Made with organic cotton yarn.', 299.0, 'vendor-002', 15, 'Handmade', NOW(), NOW()),
(UUID(), 'Custom Portrait Painting (Digital)', 'Unique personalized artwork.', 899.0, 'vendor-002', 10, 'Handmade', NOW(), NOW()),
(UUID(), 'Handmade Ceramic Mug EarthTone', 'Unique glaze, comfortable to hold.', 189.0, 'vendor-002', 30, 'Handmade', NOW(), NOW()),
(UUID(), 'Leather Journal HandStitched', 'Refillable, perfect for writers.', 349.0, 'vendor-002', 20, 'Handmade', NOW(), NOW()),
(UUID(), 'Beaded Necklace BohemianStyle', 'Colorful beads, unique design.', 229.0, 'vendor-002', 25, 'Handmade', NOW(), NOW()),
(UUID(), 'Hand-poured Soy Candle Serenity', 'Natural soy wax, essential oils.', 159.0, 'vendor-002', 40, 'Handmade', NOW(), NOW()),
(UUID(), 'Wooden Toy Car ClassicRacer', 'Handcrafted from natural wood.', 199.0, 'vendor-002', 18, 'Handmade', NOW(), NOW()),
(UUID(), 'Embroidered Hoop Art FloralDream', 'Beautiful wall decor, delicate stitching.', 259.0, 'vendor-002', 12, 'Handmade', NOW(), NOW()),
(UUID(), 'Custom Pet Tag HandStamped', 'Personalized with pet\'s name and phone.', 99.0, 'vendor-002', 50, 'Handmade', NOW(), NOW()),
(UUID(), 'Quilted Table Runner PatchworkJoy', 'Adds a touch of handmade charm to your table.', 279.0, 'vendor-002', 10, 'Handmade', NOW(), NOW());

-- Vendor 3 ('vendor-003'): Home Comforts Co. (Focus on Home & Kitchen, Sports & Outdoors, Groceries & Gourmet Food, Pet Supplies, some Books)
INSERT INTO products (id, name, description, price, vendor_id, stock, category, created_at, updated_at) VALUES 
-- Home & Kitchen (20)
(UUID(), 'Robot Vacuum Cleaner SmartClean X9', 'Self-charging, app control, powerful suction.', 2599.0, 'vendor-003', 20, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Air Fryer CrispyCook 5.5L', 'Healthy cooking with less oil.', 799.0, 'vendor-003', 40, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Espresso Machine BaristaTouch', 'Cafe-quality coffee at home.', 3999.0, 'vendor-003', 15, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Cookware Set Non-Stick (10 pcs)', 'Durable, easy to clean, PFOA-free.', 1299.0, 'vendor-003', 30, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Stand Mixer PowerWhisk Pro', 'Powerful motor, multiple attachments.', 1899.0, 'vendor-003', 25, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Bed Sheet Set Egyptian Cotton 800TC', 'Luxuriously soft and durable.', 999.0, 'vendor-003', 50, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Comforter All-Season Down Alternative', 'Hypoallergenic, machine washable.', 699.0, 'vendor-003', 40, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Memory Foam Pillow CoolSleep', 'Pressure-relieving, cooling gel layer.', 399.0, 'vendor-003', 60, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Blender High-Speed NutrientMax', 'Smoothies, soups, and more.', 899.0, 'vendor-003', 30, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Food Storage Container Set (20 pcs)', 'Airtight, BPA-free, stackable.', 299.0, 'vendor-003', 70, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Knife Set Professional Grade (15 pcs)', 'High-carbon stainless steel, sharp and durable.', 1199.0, 'vendor-003', 20, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Dinnerware Set Stoneware (16 pcs)', 'Elegant design, service for 4.', 799.0, 'vendor-003', 25, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Smart Thermostat EcoSense', 'Save energy, control from your phone.', 1299.0, 'vendor-003', 18, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Air Purifier TrueHEPA CleanAir', 'Removes allergens, dust, and odors.', 999.0, 'vendor-003', 30, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Electric Kettle RapidBoil 1.7L', 'Fast boiling, auto shut-off.', 249.0, 'vendor-003', 50, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Iron SteamGlide Pro', 'Powerful steam, smooth gliding.', 349.0, 'vendor-003', 40, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Trash Can Motion Sensor 13 Gallon', 'Hygienic and convenient.', 299.0, 'vendor-003', 35, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Bookshelf 5-Tier IndustrialStyle', 'Sturdy and stylish storage solution.', 699.0, 'vendor-003', 20, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Area Rug Modern Geometric 8x10', 'Soft and durable, adds style to any room.', 1599.0, 'vendor-003', 10, 'Home & Kitchen', NOW(), NOW()),
(UUID(), 'Curtains Blackout Thermal Insulated (Pair)', 'Block light, reduce noise, save energy.', 399.0, 'vendor-003', 40, 'Home & Kitchen', NOW(), NOW()),
-- Sports & Outdoors (10)
(UUID(), 'Yoga Mat EcoFriendly NonSlip', 'Durable and comfortable for your practice.', 249.0, 'vendor-003', 50, 'Sports & Outdoors', NOW(), NOW()),
(UUID(), 'Dumbbell Set Adjustable Weights (Up to 50lb)', 'Space-saving and versatile.', 1299.0, 'vendor-003', 20, 'Sports & Outdoors', NOW(), NOW()),
(UUID(), 'Resistance Bands Set (5 Levels)', 'For strength training and physical therapy.', 149.0, 'vendor-003', 80, 'Sports & Outdoors', NOW(), NOW()),
(UUID(), 'Camping Tent 4-Person Dome', 'Waterproof, easy setup.', 899.0, 'vendor-003', 25, 'Sports & Outdoors', NOW(), NOW()),
(UUID(), 'Sleeping Bag All-Weather Comfort', 'Rated for 3 seasons, lightweight.', 499.0, 'vendor-003', 30, 'Sports & Outdoors', NOW(), NOW()),
(UUID(), 'Hiking Backpack Trailblazer 50L', 'Durable, comfortable, multiple compartments.', 799.0, 'vendor-003', 20, 'Sports & Outdoors', NOW(), NOW()),
(UUID(), 'Bicycle Hybrid Commuter Pro', 'Lightweight frame, comfortable ride.', 2999.0, 'vendor-003', 10, 'Sports & Outdoors', NOW(), NOW()),
(UUID(), 'Water Bottle Insulated Stainless Steel 32oz', 'Keeps drinks cold for 24h or hot for 12h.', 199.0, 'vendor-003', 100, 'Sports & Outdoors', NOW(), NOW()),
(UUID(), 'Fishing Rod and Reel Combo AnglerMax', 'Perfect for beginners and experienced anglers.', 699.0, 'vendor-003', 15, 'Sports & Outdoors', NOW(), NOW()),
(UUID(), 'Binoculars High-Power Explorer 12x50', 'Clear view for bird watching, hiking, events.', 599.0, 'vendor-003', 18, 'Sports & Outdoors', NOW(), NOW()),
-- Groceries & Gourmet Food (10)
(UUID(), 'Organic Coffee Beans Dark Roast (1kg)', 'Rich and flavorful, ethically sourced.', 299.0, 'vendor-003', 40, 'Groceries & Gourmet Food', NOW(), NOW()),
(UUID(), 'Artisan Pasta Variety Pack (3 types)', 'Handmade Italian pasta.', 159.0, 'vendor-003', 50, 'Groceries & Gourmet Food', NOW(), NOW()),
(UUID(), 'Extra Virgin Olive Oil Premium (750ml)', 'Cold-pressed, imported from Greece.', 229.0, 'vendor-003', 30, 'Groceries & Gourmet Food', NOW(), NOW()),
(UUID(), 'Gourmet Chocolate Collection (12 pcs)', 'Assorted dark, milk, and white chocolates.', 199.0, 'vendor-003', 35, 'Groceries & Gourmet Food', NOW(), NOW()),
(UUID(), 'Herbal Tea Sampler (20 bags)', 'Relaxing and refreshing blends.', 99.0, 'vendor-003', 60, 'Groceries & Gourmet Food', NOW(), NOW()),
(UUID(), 'Manuka Honey UMF 15+ (250g)', 'Authentic New Zealand Manuka honey.', 499.0, 'vendor-003', 20, 'Groceries & Gourmet Food', NOW(), NOW()),
(UUID(), 'Spices Gift Set World Flavors (8 jars)', 'Explore culinary traditions from around the world.', 349.0, 'vendor-003', 15, 'Groceries & Gourmet Food', NOW(), NOW()),
(UUID(), 'Organic Quinoa Tri-Color (1kg)', 'Healthy and versatile grain.', 129.0, 'vendor-003', 40, 'Groceries & Gourmet Food', NOW(), NOW()),
(UUID(), 'Imported Cheese Platter Selection', 'Selection of fine cheeses.', 399.0, 'vendor-003', 10, 'Groceries & Gourmet Food', NOW(), NOW()),
(UUID(), 'Artisan Crackers Rosemary & Sea Salt', 'Perfect accompaniment for cheese and dips.', 79.0, 'vendor-003', 50, 'Groceries & Gourmet Food', NOW(), NOW()),
-- Pet Supplies (5)
(UUID(), 'Premium Dog Food NaturalBalance (15kg)', 'Grain-free, high protein for adult dogs.', 599.0, 'vendor-003', 25, 'Pet Supplies', NOW(), NOW()),
(UUID(), 'Cat Tree Tower Multi-Level PlayHouse', 'With scratching posts and cozy condos.', 899.0, 'vendor-003', 15, 'Pet Supplies', NOW(), NOW()),
(UUID(), 'Dog Bed Orthopedic ComfortRest', 'Memory foam for joint support.', 399.0, 'vendor-003', 30, 'Pet Supplies', NOW(), NOW()),
(UUID(), 'Pet Grooming Brush SelfCleaning', 'Removes loose hair effectively.', 149.0, 'vendor-003', 50, 'Pet Supplies', NOW(), NOW()),
(UUID(), 'Interactive Cat Toy LaserChaser', 'Keeps your cat entertained for hours.', 99.0, 'vendor-003', 40, 'Pet Supplies', NOW(), NOW()),
-- Books (5)
(UUID(), 'Bestseller Novel "The Midnight Library"', 'A heartwarming story about choices.', 129.0, 'vendor-003', 50, 'Books', NOW(), NOW()),
(UUID(), 'Cookbook "Simple & Delicious Recipes"', 'Over 100 easy-to-follow recipes.', 199.0, 'vendor-003', 30, 'Books', NOW(), NOW()),
(UUID(), 'Self-Help "Atomic Habits"', 'Proven ways to build good habits.', 159.0, 'vendor-003', 40, 'Books', NOW(), NOW()),
(UUID(), 'Children\'s Book "Where the Wild Things Are"', 'Classic picture book for kids.', 89.0, 'vendor-003', 60, 'Books', NOW(), NOW()),
(UUID(), 'History "Sapiens: A Brief History of Humankind"', 'A captivating look at human history.', 179.0, 'vendor-003', 35, 'Books', NOW(), NOW());

-- Notes:
-- 1. password_hash uses plaintext passwords for development, should be replaced with real hashed passwords in production.
-- 2. UUID() is used to generate unique IDs.
-- 3. NOW() is used to set current creation and update timestamps.
-- 4. Product data covers different categories, 50 products per vendor.
-- 5. Orders, order items, cart items, and favorites tables are left empty.