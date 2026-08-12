# Mini ERP + CRM Operations Portal — Full Stack Developer Case Study

A clean, high-performance, enterprise-grade **Mini ERP + CRM Operations Portal** built for wholesale and distribution operations to manage Customers, Products, Inventory, Stock Movements, and Sales Challans with role-based authorization and database transaction safety.

---

## 1. Project Overview

Wholesale and distribution businesses require high data consistency when managing inventory and sales dispatches. This application solves core operational challenges:
- **Lead & Customer Lifecycle Management**: Track retail, wholesale, and distributor clients with status tracking (`Lead`, `Active`, `Inactive`) and follow-up history.
- **Real-Time Stock & Warehouse Tracking**: Monitor current product inventory, set minimum stock alerts, and log all stock adjustments (`IN` and `OUT`).
- **Atomic Sales Challan Workflow**: Generate sales challans with product snapshot data. Draft challans leave inventory untouched, while confirmation executes inside an atomic PostgreSQL transaction using row-level locking (`FOR UPDATE`) to prevent negative stock.

---

## 2. Case Study Requirements Covered

- [x] **JWT Authentication**: Secure login issuing 24-hour JWT tokens.
- [x] **Role-Based Access Control**: 4 roles (`Admin`, `Sales`, `Warehouse`, `Accounts`) enforcing endpoint and route-level authorization.
- [x] **Customer CRM**: Add, Edit, Search, View Details, and log Follow-up Note history.
- [x] **Product & Inventory Catalog**: Unique SKU validation, unit price, stock monitoring, minimum stock alert triggers, warehouse location.
- [x] **Stock Movement Log**: Audit trail for `IN` and `OUT` stock entries with timestamps, reasons, and user attribution.
- [x] **Negative Stock Prevention**: Database-level check constraints (`CHECK (current_stock >= 0)`) and transaction pre-validation.
- [x] **Sales Challans Workflow**: Support `Draft`, `Confirmed`, and `Cancelled` statuses.
- [x] **Atomic Transaction Safety**: `BEGIN...COMMIT/ROLLBACK` with `FOR UPDATE` locks during challan confirmation.
- [x] **Product Snapshot Data**: Challan line items store immutable snapshot data (`product_name`, `sku`, `unit_price`, `quantity`) at creation time.
- [x] **REST APIs**: Parameterized SQL queries, search/filtering, pagination, input validation, and HTTP status codes.
- [x] **Responsive UI**: High-density enterprise dashboard built with React, TypeScript, and custom CSS design system.
- [x] **Postman Collection**: Pre-configured Postman JSON collection with `{{baseUrl}}` and `{{token}}` variables.

---

## 3. Technology Stack

- **Frontend**: React (v18), TypeScript, Vite, React Router (v6), Lucide Icons, Custom Enterprise CSS.
- **Backend**: Node.js, Express.js, TypeScript, `pg` (node-postgres), JWT (`jsonwebtoken`), `bcryptjs`, CORS, `dotenv`.
- **Database**: PostgreSQL (Relational schema with foreign keys, checks, indexes, and row-level locks).
- **Architecture Note**: **NO ORM / Prisma used**. Direct SQL via `pg` is utilized for absolute control over database transactions, explicit row locking (`FOR UPDATE`), and performance.

---

## 4. System Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                  │
│             http://localhost:5173 (TypeScript)            │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTP REST Requests (JWT)
                              ▼
┌───────────────────────────────────────────────────────────┐
│                  Express.js Backend API                   │
│             http://localhost:5000 (TypeScript)            │
└─────────────────────────────┬─────────────────────────────┘
                              │ Parameterized Queries (pg)
                              ▼
┌───────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                    │
│             minierp_db (Atomic Transactions)              │
└───────────────────────────────────────────────────────────┘
```

---

## 5. Project Structure

```text
Fundsroom/
├── .gitignore                      # Git ignore rules for node_modules, .env, build outputs
├── README.md                       # Comprehensive case study documentation
├── backend/
│   ├── scripts/
│   │   └── setup-db.js             # Automated database creation & seed script
│   ├── sql/
│   │   ├── schema.sql              # PostgreSQL DDL tables, constraints, and indexes
│   │   └── seed.sql                # Initial test accounts, customers, & products
│   ├── src/
│   │   ├── config/                 # DB pool & JWT environment configuration
│   │   ├── controllers/            # Business logic (Auth, Customer, Product, Inventory, Challan)
│   │   ├── middleware/             # JWT Auth, Role Authorization, Error Handler
│   │   ├── routes/                 # Express API routing definitions
│   │   ├── types/                  # TypeScript interfaces & type definitions
│   │   ├── app.ts                  # Express application setup & middleware configuration
│   │   └── server.ts               # HTTP server entry point
│   ├── .env.example                # Backend environment variable template
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components (Sidebar, Header, StatusBadge)
│   │   ├── context/                # AuthContext & React state providers
│   │   ├── pages/                  # Page views (Dashboard, Customers, Products, Inventory, Challans)
│   │   ├── services/               # API client service layer
│   │   ├── types/                  # Frontend TypeScript interfaces
│   │   ├── App.tsx                 # Main layout & router configuration
│   │   ├── index.css               # Enterprise Operations Portal CSS design system
│   │   └── main.tsx                # Vite app entry point
│   ├── .env.example                # Frontend environment variable template
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── postman/
    └── mini_erp_crm.postman_collection.json  # Postman API test collection
```

---

## 6. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Git** & **Postman** (for API testing)

---

## 7. PostgreSQL Database Setup

You can set up the database using either of the two options below:

### Option A: Automated Setup (Recommended)
Make sure PostgreSQL is running on your system, configure your password in `backend/.env`, and run:
```bash
cd backend
npm run db:setup
```
*This script automatically creates `minierp_db`, applies `schema.sql`, and inserts `seed.sql` test data.*

### Option B: Manual Setup via `psql` / pgAdmin
1. Connect to PostgreSQL and create the database:
   ```sql
   CREATE DATABASE minierp_db;
   ```
2. Execute the schema and seed SQL files:
   ```bash
   psql -U postgres -d minierp_db -f backend/sql/schema.sql
   psql -U postgres -d minierp_db -f backend/sql/seed.sql
   ```

---

## 8. Backend Server Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The API will start at:* `http://localhost:5000`

---

## 9. Environment Variables

> ⚠️ **IMPORTANT**: `.env` files contain local secret configurations and MUST NOT be committed to Git. Only `.env.example` templates with placeholders are included in Git.

### Backend (`backend/.env`):
| Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| `PORT` | HTTP Port for Express Server | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:password@localhost:5432/minierp_db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `JWT_SECRET=replace_with_a_secure_local_secret` |
| `FRONTEND_URL` | CORS allowed origin URL | `http://localhost:5173` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |

### Frontend (`frontend/.env`):
| Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for backend API calls | `http://localhost:5000/api` |

---

## 10. Frontend Setup

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The UI will start at:* `http://localhost:5173`

---

## 11. Running the Full Application Locally

Follow these steps for a complete fresh run:

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd Fundsroom
   ```
2. **Setup Backend & Database**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your local PostgreSQL password if necessary
   npm run db:setup
   npm run dev
   ```
3. **Setup Frontend** (in a second terminal):
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```
4. **Access Portal**: Open your browser at `http://localhost:5173` and log in with any test user below.

---

## 12. Demo Credentials

All test accounts are pre-configured with the default password: **`Password123!`**

| Role | Email | Password | Allowed System Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fundsroom.com` | `Password123!` | Full system CRUD access across all modules |
| **Sales** | `sales@fundsroom.com` | `Password123!` | Customer CRM, Create & Confirm Sales Challans, Read Products |
| **Warehouse** | `warehouse@fundsroom.com` | `Password123!` | Product Catalog CRUD, Inventory & Stock Movement Logging (`IN`/`OUT`) |
| **Accounts** | `accounts@fundsroom.com` | `Password123!` | Read-only view for Customers & Sales Challans |

---

## 13. Application Walkthrough

- **Dashboard**: Live operational counters for Total Customers, Total Products, Low Stock Alerts, and Pending Challans.
- **Customer CRM**: List/search clients, create customer profiles, filter by status (`Lead`, `Active`, `Inactive`), and log follow-up notes.
- **Product Catalog**: Manage SKU items, category pricing, warehouse location, and trigger low-stock alert thresholds.
- **Stock Movement Log**: Record manual stock additions (`IN`) or dispatches (`OUT`) with explicit reasons and auditor stamps.
- **Sales Challans**: Generate sales challans with line items. Confirming a challan deducts stock atomically and produces an `OUT` movement record.

---

## 14. Business Logic — Challan Confirmation

The sales challan workflow guarantees strict inventory consistency:

1. **Draft Status**:
   - Creating a challan stores line items with **product snapshots** (`product_name`, `sku`, `unit_price`, `quantity`).
   - Stock is **NOT** deducted while status remains `Draft`.

2. **Confirmation Status (Atomic Transaction)**:
   - When an authorized user clicks **Confirm**, the API opens a PostgreSQL transaction (`BEGIN`).
   - Line-item products are queried with row-level locks (`FOR UPDATE`).
   - Stock levels are evaluated against requested quantities:
     - **If Stock is Sufficient**: Deducts stock (`UPDATE products SET current_stock = current_stock - qty`), records an `OUT` movement log in `stock_movements`, sets challan status to `Confirmed`, and commits (`COMMIT`).
     - **If Insufficient Stock**: The transaction immediately rolls back (`ROLLBACK`), returns an `HTTP 400 Bad Request` with an explicit error message (e.g. *"Insufficient stock for Product A. Available: 3, Requested: 5"*), and **leaves inventory unchanged**.

---

## 15. REST API Documentation

### Authentication & User Profile
- `POST /api/auth/login`: Authenticate credentials & return JWT token.
- `GET /api/auth/me`: Get current authenticated user profile (Requires JWT).

### Customer CRM
- `GET /api/customers`: Search, filter, and paginate customers.
- `GET /api/customers/:id`: Get customer profile and follow-up timeline history.
- `POST /api/customers`: Create a new customer profile (Admin, Sales).
- `PUT /api/customers/:id`: Update customer details (Admin, Sales).
- `POST /api/customers/:id/followups`: Add follow-up note (Admin, Sales).

### Products & Inventory
- `GET /api/products`: List and search product catalog.
- `POST /api/products`: Create a new product SKU (Admin, Warehouse).
- `PUT /api/products/:id`: Update product SKU details (Admin, Warehouse).
- `GET /api/inventory/movements`: View audit log of stock movements.
- `POST /api/inventory/movements`: Log manual `IN` or `OUT` stock movement (Admin, Warehouse).

### Sales Challans Workflow
- `GET /api/challans`: List sales challans with search & status filter.
- `GET /api/challans/:id`: Get single challan with snapshot item details.
- `POST /api/challans`: Create a new Draft sales challan (Admin, Sales).
- `POST /api/challans/:id/confirm`: Execute atomic confirmation & stock deduction (Admin, Sales).
- `POST /api/challans/:id/cancel`: Cancel a draft sales challan (Admin, Sales).

---

## 16. Postman Collection

A complete Postman collection is included in the repository at:
`postman/mini_erp_crm.postman_collection.json`

### Import & Test Instructions:
1. Open **Postman** -> Click **Import** -> Select `postman/mini_erp_crm.postman_collection.json`.
2. The collection uses the `{{baseUrl}}` variable set to `http://localhost:5000/api`.
3. Run the **`1. Login (Admin)`** request under Authentication.
4. Copy the returned `token` string into the collection variable `{{token}}`.
5. Execute requests across Customers, Products, Inventory, and Sales Challans.

---

## 17. Testing Scenarios

1. **Authentication**: Log in with `admin@fundsroom.com` / `Password123!` to receive a JWT token.
2. **Customer CRM**: Search for existing client "Apex" and add a follow-up note.
3. **Product Catalog**: Create a new product SKU `PROD-TEST-01` with stock `15`.
4. **Draft Challan**: Create a sales challan for `PROD-TEST-01` with quantity `5`. Verify product stock remains `15`.
5. **Challan Confirmation**: Confirm the challan. Verify product stock drops to `10` and an `OUT` movement is logged.
6. **Insufficient Stock Test**: Create another draft challan requesting quantity `500` for `PROD-TEST-01` and attempt confirmation. Verify HTTP 400 error is returned and stock remains `10`.
7. **Role Authorization Check**: Log in as `warehouse@fundsroom.com` and attempt to POST `/api/customers`. Verify `HTTP 403 Forbidden` response is returned.

---

## 18. Local Submission / No Deployment

> 📢 **Note**: This submission is provided as a local working setup as permitted by the case study instructions. The application is not deployed to a live cloud host.

---

## 19. Deployment Instructions (Future Reference)

If deploying to production cloud infrastructure in the future:

1. **Database (Neon / Supabase)**:
   - Create a PostgreSQL database instance.
   - Run `backend/sql/schema.sql` and `backend/sql/seed.sql` in the cloud SQL editor.
2. **Backend (Render / Railway)**:
   - Connect the `backend/` folder.
   - Set Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL=<your-frontend-url>`.
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
3. **Frontend (Vercel / Netlify)**:
   - Connect the `frontend/` folder.
   - Set Environment Variable: `VITE_API_URL=<your-live-backend-url>/api`.
   - Build Command: `npm run build`
   - Output Directory: `dist`

---

## 20. Assumptions

- **Immutable Confirmed Challans**: Sales challans cannot be edited or modified after confirmation to preserve financial & inventory audit history.
- **Draft Stock Exemption**: Draft sales challans do not lock or hold inventory reserves until confirmation.
- **Fixed Role Matrix**: Permissions are managed via predefined roles (`Admin`, `Sales`, `Warehouse`, `Accounts`) per business requirements.
- **MVP Scope**: Invoicing, PDF rendering, and complex payment gateways are outside the mandatory scope of this technical case study.

---

## 21. Known Limitations

- **On-Demand Stock Alerts**: Low stock alert counts are queried on-demand from PostgreSQL rather than pushed via WebSockets.
- **Document Exporting**: Exporting sales challan vouchers as downloadable PDF files is currently omitted in this MVP.

---

## 22. Security Notes

- **Password Hashing**: User passwords are encrypted with `bcryptjs` (10 salt rounds).
- **JWT Protection**: API routes verify signed JWT tokens using strict `JWT_SECRET` environment variables.
- **Parameterized SQL**: All SQL statements use `$1, $2` parameters via `pg` to prevent SQL Injection attacks.
- **Secret Isolation**: All sensitive credentials reside strictly in local `.env` files excluded from Git tracking.
