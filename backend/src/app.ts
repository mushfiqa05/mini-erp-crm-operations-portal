import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import inventoryRoutes from './routes/inventory.routes';
import challanRoutes from './routes/challan.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mini ERP + CRM Operations Portal API is running smoothly.'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found.`
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
