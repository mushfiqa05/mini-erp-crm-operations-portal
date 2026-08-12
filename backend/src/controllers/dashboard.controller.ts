import { Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../types';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Total Customers
    const customerCountRes = await pool.query('SELECT COUNT(*) FROM customers');
    const totalCustomers = parseInt(customerCountRes.rows[0].count, 10);

    // 2. Total Products
    const productCountRes = await pool.query('SELECT COUNT(*) FROM products');
    const totalProducts = parseInt(productCountRes.rows[0].count, 10);

    // 3. Low Stock Products Count & List
    const lowStockRes = await pool.query(
      `SELECT id, product_name, sku, category, current_stock, minimum_stock, warehouse_location
       FROM products
       WHERE current_stock <= minimum_stock
       ORDER BY current_stock ASC`
    );

    // 4. Challan Counts by Status
    const challanStatusRes = await pool.query(
      `SELECT status, COUNT(*) as count FROM challans GROUP BY status`
    );
    const challanCounts: Record<string, number> = { Draft: 0, Confirmed: 0, Cancelled: 0 };
    challanStatusRes.rows.forEach(row => {
      challanCounts[row.status] = parseInt(row.count, 10);
    });

    // 5. Recent 5 Challans
    const recentChallansRes = await pool.query(
      `SELECT c.*, cust.customer_name, cust.business_name
       FROM challans c
       JOIN customers cust ON c.customer_id = cust.id
       ORDER BY c.created_at DESC
       LIMIT 5`
    );

    return res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalProducts,
        lowStockCount: lowStockRes.rows.length,
        lowStockProducts: lowStockRes.rows,
        challanCounts,
        recentChallans: recentChallansRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
};
