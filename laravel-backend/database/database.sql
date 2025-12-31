-- E-Commerce Database Schema for MySQL
-- Run this in phpMyAdmin or MySQL to create the database

-- Create database
CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `email_verified_at` TIMESTAMP NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
    `phone` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: password_reset_tokens
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `email` VARCHAR(255) NOT NULL PRIMARY KEY,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: sessions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INT NOT NULL,
    INDEX `sessions_user_id_index` (`user_id`),
    INDEX `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: personal_access_tokens (for Sanctum)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `tokenable_type` VARCHAR(255) NOT NULL,
    `tokenable_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `token` VARCHAR(64) NOT NULL UNIQUE,
    `abilities` TEXT NULL,
    `last_used_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`, `tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: categories
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `image` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: products
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `original_price` DECIMAL(10, 2) NULL,
    `stock` INT NOT NULL DEFAULT 0,
    `image` VARCHAR(255) NULL,
    `badge` VARCHAR(50) NULL,
    `rating` DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    `reviews_count` INT NOT NULL DEFAULT 0,
    `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: carts
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `carts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: cart_items
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cart_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `cart_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `size` VARCHAR(50) NULL,
    `color` VARCHAR(50) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `cart_item_unique` (`cart_id`, `product_id`, `size`, `color`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: orders
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `order_number` VARCHAR(50) NOT NULL UNIQUE,
    `status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `shipping` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL,
    `shipping_address` JSON NOT NULL,
    `billing_address` JSON NULL,
    `payment_method` VARCHAR(50) NOT NULL,
    `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: order_items
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `size` VARCHAR(50) NULL,
    `color` VARCHAR(50) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- INSERT DEMO DATA
-- ========================================================

-- --------------------------------------------------------
-- Users (password is: password123)
-- --------------------------------------------------------
INSERT INTO `users` (`name`, `email`, `password`, `role`, `phone`, `address`, `created_at`, `updated_at`) VALUES
('Admin User', 'admin@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '+1234567890', '123 Admin Street, Tech City, TC 12345', NOW(), NOW()),
('John Doe', 'customer@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', '+1987654321', '456 Customer Lane, Shop Town, ST 67890', NOW(), NOW()),
('Jane Smith', 'jane@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', '+1555666777', '789 Oak Avenue, Commerce City, CC 11111', NOW(), NOW());

-- --------------------------------------------------------
-- Categories
-- --------------------------------------------------------
INSERT INTO `categories` (`name`, `slug`, `description`, `created_at`, `updated_at`) VALUES
('Footwear', 'footwear', 'Premium quality shoes, sneakers, and boots for all occasions.', NOW(), NOW()),
('Watches', 'watches', 'Luxury and smart watches from top brands.', NOW(), NOW()),
('Audio', 'audio', 'High-quality headphones, earbuds, and speakers.', NOW(), NOW()),
('Accessories', 'accessories', 'Sunglasses, bags, wallets, and more.', NOW(), NOW()),
('Tech', 'tech', 'Latest gadgets and technology products.', NOW(), NOW()),
('Clothing', 'clothing', 'Trendy apparel for men and women.', NOW(), NOW());

-- --------------------------------------------------------
-- Products
-- --------------------------------------------------------
INSERT INTO `products` (`category_id`, `name`, `slug`, `description`, `price`, `original_price`, `stock`, `image`, `badge`, `rating`, `reviews_count`, `is_featured`, `is_active`, `created_at`, `updated_at`) VALUES
-- Audio
(3, 'Premium Wireless Headphones', 'premium-wireless-headphones', 'Experience superior sound quality with our premium wireless headphones. Features active noise cancellation, 30-hour battery life, and ultra-comfortable ear cushions.', 24899, 33199, 50, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'Sale', 4.8, 128, TRUE, TRUE, NOW(), NOW()),
(3, 'Wireless Earbuds Pro', 'wireless-earbuds-pro', 'Compact and powerful wireless earbuds with crystal clear sound. Perfect for workouts and daily commute.', 12449, NULL, 100, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500', 'New', 4.6, 89, TRUE, TRUE, NOW(), NOW()),
(3, 'Portable Bluetooth Speaker', 'portable-bluetooth-speaker', 'Powerful portable speaker with 360-degree sound and waterproof design. Perfect for outdoor adventures.', 6639, 8299, 75, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 'Sale', 4.4, 156, FALSE, TRUE, NOW(), NOW()),

-- Watches
(2, 'Smart Watch Pro', 'smart-watch-pro', 'Advanced smartwatch with health monitoring, GPS, and 5-day battery life. Stay connected on the go.', 49799, NULL, 30, 'https://images.unsplash.com/photo-1670177257750-9b47927f68eb?w=500', 'New', 4.7, 234, TRUE, TRUE, NOW(), NOW()),
(2, 'Classic Leather Watch', 'classic-leather-watch', 'Elegant timepiece with genuine leather strap and Swiss movement. Perfect for formal occasions.', 29049, 37349, 25, 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500', 'Sale', 4.9, 67, TRUE, TRUE, NOW(), NOW()),
(2, 'Sports Fitness Watch', 'sports-fitness-watch', 'Rugged sports watch with heart rate monitor, GPS tracking, and 50m water resistance.', 16599, NULL, 60, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500', NULL, 4.5, 189, FALSE, TRUE, NOW(), NOW()),

-- Accessories
(4, 'Designer Sunglasses', 'designer-sunglasses', 'Stylish designer sunglasses with UV protection and polarized lenses. Make a statement.', 16599, 20749, 40, 'https://images.unsplash.com/photo-1722842529941-825976fc14f1?w=500', 'Sale', 4.6, 98, TRUE, TRUE, NOW(), NOW()),
(4, 'Premium Leather Wallet', 'premium-leather-wallet', 'Handcrafted genuine leather wallet with RFID protection. Slim design fits perfectly in any pocket.', 6639, NULL, 80, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500', NULL, 4.8, 145, FALSE, TRUE, NOW(), NOW()),
(4, 'Travel Backpack', 'travel-backpack', 'Durable travel backpack with laptop compartment and anti-theft features. Perfect for adventurers.', 10789, 13279, 55, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'Sale', 4.7, 212, TRUE, TRUE, NOW(), NOW()),

-- Footwear
(1, 'Premium Running Shoes', 'premium-running-shoes', 'Lightweight running shoes with advanced cushioning and breathable mesh upper. Run faster, longer.', 15769, NULL, 70, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 'New', 4.8, 178, TRUE, TRUE, NOW(), NOW()),
(1, 'Classic Leather Boots', 'classic-leather-boots', 'Timeless leather boots with durable construction. Perfect for any season and occasion.', 20749, 24899, 35, 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500', 'Sale', 4.6, 92, FALSE, TRUE, NOW(), NOW()),
(1, 'Casual Sneakers', 'casual-sneakers', 'Comfortable everyday sneakers with modern design. Step out in style.', 8299, NULL, 90, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500', NULL, 4.4, 267, FALSE, TRUE, NOW(), NOW()),

-- Tech
(5, 'Wireless Charging Pad', 'wireless-charging-pad', 'Fast wireless charging pad compatible with all Qi-enabled devices. Sleek and compact design.', 4149, 5809, 120, 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=500', 'Sale', 4.5, 334, FALSE, TRUE, NOW(), NOW()),
(5, 'Mechanical Keyboard', 'mechanical-keyboard', 'RGB mechanical keyboard with Cherry MX switches. Built for gamers and professionals.', 13279, NULL, 45, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', 'New', 4.9, 156, TRUE, TRUE, NOW(), NOW()),
(5, 'Portable Power Bank', 'portable-power-bank', '20000mAh power bank with fast charging and multiple ports. Never run out of battery.', 4979, 6639, 150, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500', 'Sale', 4.6, 423, FALSE, TRUE, NOW(), NOW()),

-- Clothing
(6, 'Premium Cotton T-Shirt', 'premium-cotton-tshirt', 'Ultra-soft premium cotton t-shirt with modern fit. Available in multiple colors.', 3319, NULL, 200, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', NULL, 4.7, 567, FALSE, TRUE, NOW(), NOW()),
(6, 'Denim Jacket', 'denim-jacket', 'Classic denim jacket with vintage wash. A wardrobe essential for any season.', 10789, 14109, 40, 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500', 'Sale', 4.8, 134, TRUE, TRUE, NOW(), NOW()),
(6, 'Performance Hoodie', 'performance-hoodie', 'Athletic hoodie with moisture-wicking fabric and comfortable fit. Perfect for workouts.', 6639, NULL, 85, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500', 'New', 4.5, 89, FALSE, TRUE, NOW(), NOW());

-- --------------------------------------------------------
-- Done!
-- --------------------------------------------------------
SELECT 'Database setup complete!' AS message;
SELECT CONCAT('Users: ', COUNT(*)) AS count FROM users;
SELECT CONCAT('Categories: ', COUNT(*)) AS count FROM categories;
SELECT CONCAT('Products: ', COUNT(*)) AS count FROM products;
