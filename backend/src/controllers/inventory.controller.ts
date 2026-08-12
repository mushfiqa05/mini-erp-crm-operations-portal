import { Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../types';

// Get inventory summary list
export const getInventorySummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT id, product_name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location,
              (current_stock <= minimum_stock) AS is_low_stock
       FROM products
       ORDER BY is_low_stock DESC, product_name ASC`
    );

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// Get stock movement history
export const getStockMovements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { product_id, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let queryText = `
      SELECT sm.*, p.product_name, p.sku
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      WHERE 1=1
    `;
    let countQueryText = `SELECT COUNT(*) FROM stock_movements sm WHERE 1=1`;
    const queryParams: any[] = [];

    if (product_id) {
      queryParams.push(product_id);
      const prodClause = ` AND sm.product_id = $${queryParams.length}`;
      queryText += prodClause;
      countQueryText += prodClause;
    }

    const countResult = await pool.query(countQueryText, queryParams);
    const totalRecords = parseInt(countResult.rows[0].count, 10);

    queryText += ` ORDER BY sm.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    const result = await pool.query(queryText, [...queryParams, limitNum, offset]);

    return res.status(200).json({
      success: true,
      data: {
        movements: result.rows,
        pagination: {
          total: totalRecords,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalRecords / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Perform manual stock movement (IN / OUT)
export const createStockMovement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const client = await pool.connect();

  try {
    const { product_id, quantity, movement_type, reason } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer.' });
    }

    if (!['IN', 'OUT'].includes(movement_type)) {
      return res.status(400).json({ success: false, message: 'Movement type must be IN or OUT.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Reason for stock movement is required.' });
    }

    const createdBy = req.user ? req.user.name : 'System';

    await client.query('BEGIN');

    // Select product with FOR UPDATE row lock
    const productResult = await client.query(
      'SELECT id, product_name, current_stock FROM products WHERE id = $1 FOR UPDATE',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = productResult.rows[0];

    if (movement_type === 'OUT' && product.current_stock < qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product.product_name}. Available: ${product.current_stock}, Requested OUT: ${qty}`
      });
    }

    const newStock = movement_type === 'IN' ? product.current_stock + qty : product.current_stock - qty;

    // Update product stock
    await client.query(
      'UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStock, product_id]
    );

    // Insert stock movement record
    const movementResult = await client.query(
      `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [product_id, qty, movement_type, reason.trim(), createdBy]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: `Stock movement logged successfully. New Stock: ${newStock}`,
      data: {
        movement: movementResult.rows[0],
        new_stock: newStock
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
