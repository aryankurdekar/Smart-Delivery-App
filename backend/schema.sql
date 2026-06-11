-- Smart Delivery Tracking System
-- PostgreSQL Database Schema & Seeding Script

-- 1. DROP TABLES IF EXIST (For clean migrations)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;

-- 2. CREATE TABLES

-- Users Registry Table (Customers, Riders, Admins)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    password VARCHAR(255) NOT NULL, -- Bcrypt hashed password
    role VARCHAR(20) NOT NULL DEFAULT 'customer', -- 'customer', 'partner', 'admin'
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Tracking Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'package' (courier) or 'shop' (store order)
    pickup TEXT NOT NULL,
    delivery TEXT NOT NULL,
    package_type VARCHAR(50), -- Document, Electronics, etc. (for courier)
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Placed', -- Placed, Assigned, Picked Up, Out For Delivery, Delivered, Cancelled
    partner_name VARCHAR(100) DEFAULT '',
    partner_phone VARCHAR(20) DEFAULT '',
    partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    eta VARCHAR(50) DEFAULT 'Calculating...',
    otp VARCHAR(10) NOT NULL,
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    date VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table (For Shop purchases)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL
);

-- Support Chat Messages Log Table
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    sender VARCHAR(20) NOT NULL, -- 'user', 'support', 'agent'
    text TEXT NOT NULL,
    timestamp VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- General System Settings Table
CREATE TABLE system_config (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL
);

-- 3. CREATE PERFORMANCE INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_partner ON orders(partner_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- 4. SEED DATA
-- Default initial state users with password 'password123' hashed with bcrypt:
-- Hash: $2b$10$v7tcXkcYWgYehnG11AMT6.Y7bSrUyUsUbhxnV66jkFHKG1JKeaMoC (corresponds to 'password123')
INSERT INTO users (name, email, phone, address, password, role, is_blocked) VALUES
('Aryan Kurdekar', 'aryan@gmail.com', '+91 9876543210', 'Bangalore, Karnataka', '$2b$10$v7tcXkcYWgYehnG11AMT6.Y7bSrUyUsUbhxnV66jkFHKG1JKeaMoC', 'customer', FALSE),
('Rahul Kumar', 'rider@gmail.com', '+91 8888888888', 'Delivery Hub Station, Indiranagar', '$2b$10$v7tcXkcYWgYehnG11AMT6.Y7bSrUyUsUbhxnV66jkFHKG1JKeaMoC', 'partner', FALSE),
('Amit Sharma', 'amit@delivery.com', '+91 9898989898', 'Central Store Depot, Whitefield', '$2b$10$v7tcXkcYWgYehnG11AMT6.Y7bSrUyUsUbhxnV66jkFHKG1JKeaMoC', 'partner', FALSE),
('Vikram Singh', 'vikram@delivery.com', '+91 7777777777', 'Smart Store Hub, Koramangala', '$2b$10$v7tcXkcYWgYehnG11AMT6.Y7bSrUyUsUbhxnV66jkFHKG1JKeaMoC', 'partner', FALSE),
('System Admin', 'admin@gmail.com', '+91 9999999999', 'Headquarters Office, Bangalore', '$2b$10$v7tcXkcYWgYehnG11AMT6.Y7bSrUyUsUbhxnV66jkFHKG1JKeaMoC', 'admin', FALSE);

-- Seed Initial Orders
INSERT INTO orders (id, type, pickup, delivery, package_type, receiver_name, receiver_phone, status, partner_name, partner_phone, partner_id, customer_id, eta, otp, total_amount, date) VALUES
(1001, 'package', 'MG Road, Indiranagar', 'Whitefield Main Rd', 'Documents', 'Aryan', '+91 9876543210', 'Delivered', 'Rahul Kumar', '+91 8888888888', 2, 1, 'Completed', '1234', 59.00, '29 May 2026'),
(1002, 'shop', 'Smart Store Outlet', 'Electronic City Phase 1', NULL, 'Aryan Kurdekar', '+91 9876543210', 'Delivered', 'Amit Sharma', '+91 9898989898', 3, 1, 'Completed', '5678', 1037.00, '29 May 2026');

-- Set sequence start for auto-incrementing order IDs past the seed data
SELECT setval('orders_id_seq', 1002);

-- Seed Shop Order Items for order 1002
INSERT INTO order_items (order_id, name, quantity, price) VALUES
(1002, 'Fresh Organic Avocados (1kg)', 2, 399.00),
(1002, 'Gourmet Dark Chocolate Bar', 1, 180.00);

-- Seed Initial Chat Messages
INSERT INTO chat_messages (sender, text, timestamp) VALUES
('support', 'Hello! Welcome to Smart Delivery support. How can we help you today?', '12:00 AM');

-- Seed System Config
INSERT INTO system_config (key, value) VALUES
('isRiderOnline', 'true');
