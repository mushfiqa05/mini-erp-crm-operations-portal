-- Mini ERP + CRM Seed Data

-- Clear existing data
TRUNCATE TABLE challan_items, challans, stock_movements, products, follow_up_notes, customers, users RESTART IDENTITY CASCADE;

-- 1. SEED USERS (Password for all test users is: Password123!)
-- Hash generated with bcryptjs (10 rounds): $2a$10$3e87M3fG9h7K4L5M6N7O8e9P0Q1R2S3T4U5V6W7X8Y9Z0a1b2c3d4
-- (The actual app dynamically verifies bcrypt hashes)
INSERT INTO users (name, email, password_hash, role) VALUES
('System Admin', 'admin@fundsroom.com', '$2a$10$1Pfvc0kz1.K9y2dzzOm7DOU3btuRVCTRqouOOAPv6ssAeL.88cDYm', 'Admin'),
('Sarah Sales', 'sales@fundsroom.com', '$2a$10$1Pfvc0kz1.K9y2dzzOm7DOU3btuRVCTRqouOOAPv6ssAeL.88cDYm', 'Sales'),
('Wally Warehouse', 'warehouse@fundsroom.com', '$2a$10$1Pfvc0kz1.K9y2dzzOm7DOU3btuRVCTRqouOOAPv6ssAeL.88cDYm', 'Warehouse'),
('Arthur Accounts', 'accounts@fundsroom.com', '$2a$10$1Pfvc0kz1.K9y2dzzOm7DOU3btuRVCTRqouOOAPv6ssAeL.88cDYm', 'Accounts');

-- 2. SEED CUSTOMERS
INSERT INTO customers (customer_name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) VALUES
('Rahul Sharma', '9876543210', 'rahul@apextraders.com', 'Apex Traders', '27AAAAA0000A1Z5', 'Wholesale', '102 Industrial Estate, Andheri East, Mumbai', 'Active', '2026-08-15', 'Regular wholesale buyer for electronics.'),
('Priya Patel', '9820098200', 'priya@metrosuper.com', 'Metro Supermarket', '27BBBCC1111B1Z2', 'Distributor', '45 Commercial Hub, MG Road, Bengaluru', 'Active', '2026-08-20', 'Key distributor for regional chain.'),
('Amit Verma', '9930011223', 'amit@horizonretail.com', 'Horizon Retailers', '27CCC3333C1Z8', 'Retail', 'Shop 12, Main Market, Connaught Place, New Delhi', 'Lead', '2026-08-14', 'Inquired about bulk desk chairs.');

-- 3. SEED FOLLOW UP NOTES
INSERT INTO follow_up_notes (customer_id, note, created_by) VALUES
(1, 'Discussed Q3 bulk volume discount. Customer agreed to place order next week.', 'Sarah Sales'),
(3, 'Sent product catalog and pricing sheet for Ergonomic Desk Chairs.', 'Sarah Sales');

-- 4. SEED PRODUCTS
INSERT INTO products (product_name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location) VALUES
('Wireless Bluetooth Headphones', 'PROD-HEADPHONE-01', 'Electronics', 1499.00, 45, 10, 'Warehouse A-1'),
('Mechanical Gaming Keyboard', 'PROD-KEYBOARD-01', 'Computer Accessories', 2999.00, 3, 5, 'Warehouse A-2'),
('USB-C Fast Charger 65W', 'PROD-CHARGER-01', 'Mobile Accessories', 899.00, 120, 25, 'Warehouse B-3'),
('Ergonomic Desk Chair', 'PROD-CHAIR-01', 'Furniture', 5499.00, 2, 4, 'Warehouse C-1');

-- 5. SEED STOCK MOVEMENTS
INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES
(1, 50, 'IN', 'Initial Stock Received from Supplier', 'Wally Warehouse'),
(2, 10, 'IN', 'Initial Stock Received from Supplier', 'Wally Warehouse'),
(3, 120, 'IN', 'Initial Stock Shipment Received', 'Wally Warehouse'),
(4, 2, 'IN', 'Initial Sample Stock Received', 'Wally Warehouse'),
(1, 5, 'OUT', 'Dispatched for Confirmed Sales Challan CH-202608-0002', 'System');

-- 6. SEED CHALLANS
INSERT INTO challans (challan_number, customer_id, total_quantity, status, created_by) VALUES
('CH-202608-0001', 1, 15, 'Draft', 'Sarah Sales'),
('CH-202608-0002', 2, 5, 'Confirmed', 'Sarah Sales');

-- 7. SEED CHALLAN ITEMS (With Snapshot Data)
INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity) VALUES
(1, 1, 'Wireless Bluetooth Headphones', 'PROD-HEADPHONE-01', 1499.00, 5),
(1, 3, 'USB-C Fast Charger 65W', 'PROD-CHARGER-01', 899.00, 10),
(2, 1, 'Wireless Bluetooth Headphones', 'PROD-HEADPHONE-01', 1499.00, 5);
