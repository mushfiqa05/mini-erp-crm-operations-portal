-- Mini ERP + CRM Database Schema for PostgreSQL

-- Drop tables if they exist (for clean schema setup)
DROP TABLE IF EXISTS challan_items CASCADE;
DROP TABLE IF EXISTS challans CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS follow_up_notes CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Admin', 'Sales', 'Warehouse', 'Accounts')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CUSTOMERS TABLE
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    business_name VARCHAR(150),
    gst_number VARCHAR(30),
    customer_type VARCHAR(30) NOT NULL CHECK (customer_type IN ('Retail', 'Wholesale', 'Distributor')),
    address TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Lead' CHECK (status IN ('Lead', 'Active', 'Inactive')),
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. FOLLOW UP NOTES TABLE
CREATE TABLE follow_up_notes (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PRODUCTS TABLE
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(80) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock INT NOT NULL DEFAULT 5 CHECK (minimum_stock >= 0),
    warehouse_location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. STOCK MOVEMENTS TABLE
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
    reason VARCHAR(255) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CHALLANS TABLE
CREATE TABLE challans (
    id SERIAL PRIMARY KEY,
    challan_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    total_quantity INT NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CHALLAN ITEMS TABLE (Includes Product Snapshot Data)
CREATE TABLE challan_items (
    id SERIAL PRIMARY KEY,
    challan_id INT NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_customers_search ON customers(customer_name, mobile, email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_low_stock ON products(current_stock, minimum_stock);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_challans_number ON challans(challan_number);
CREATE INDEX idx_challans_customer ON challans(customer_id);
CREATE INDEX idx_challan_items_challan ON challan_items(challan_id);
