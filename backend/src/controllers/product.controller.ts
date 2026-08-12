import { Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../types';

export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, category, low_stock, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    let queryText = 'SELECT * FROM products WHERE 1=1';
    let countQueryText = 'SELECT COUNT(*) FROM products WHERE 1=1';
    const queryParams: any[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      const searchClause = ` AND (product_name ILIKE $${queryParams.length} OR sku ILIKE $${queryParams.length} OR category ILIKE $${queryParams.length})`;
      queryText += searchClause;
      countQueryText += searchClause;
    }

    if (category) {
      queryParams.push(category);
      const catClause = ` AND category = $${queryParams.length}`;
      queryText += catClause;
      countQueryText += catClause;
    }

    if (low_stock === 'true') {
      const lowStockClause = ` AND current_stock <= minimum_stock`;
      queryText += lowStockClause;
      countQueryText += lowStockClause;
    }

    const countResult = await pool.query(countQueryText, queryParams);
    const totalRecords = parseInt(countResult.rows[0].count, 10);

    queryText += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    const result = await pool.query(queryText, [...queryParams, limitNum, offset]);

    return res.status(200).json({
      success: true,
      data: {
        products: result.rows,
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

export const getProductById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { product_name, sku, category, unit_price, current_stock = 0, minimum_stock = 5, warehouse_location } = req.body;

    if (!product_name || !product_name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }
    if (!sku || !sku.trim()) {
      return res.status(400).json({ success: false, message: 'SKU is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    const price = parseFloat(unit_price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Unit price must be a non-negative number.' });
    }

    const stock = parseInt(current_stock, 10);
    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ success: false, message: 'Current stock must be a non-negative integer.' });
    }

    const minStock = parseInt(minimum_stock, 10);
    if (isNaN(minStock) || minStock < 0) {
      return res.status(400).json({ success: false, message: 'Minimum stock must be a non-negative integer.' });
    }

    // Check unique SKU
    const existingSku = await pool.query('SELECT id FROM products WHERE sku = $1', [sku.trim()]);
    if (existingSku.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Product with SKU '${sku.trim()}' already exists.` });
    }

    const result = await pool.query(
      `INSERT INTO products (product_name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [product_name.trim(), sku.trim().toUpperCase(), category.trim(), price, stock, minStock, warehouse_location ? warehouse_location.trim() : null]
    );

    // Log initial stock movement if initial stock > 0
    if (stock > 0) {
      const createdBy = req.user ? req.user.name : 'System';
      await pool.query(
        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
         VALUES ($1, $2, 'IN', 'Initial Stock Addition', $3)`,
        [result.rows[0].id, stock, createdBy]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { product_name, sku, category, unit_price, minimum_stock, warehouse_location } = req.body;

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (!product_name || !product_name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    // Check SKU duplicate if changing
    if (sku && sku.trim().toUpperCase() !== existing.rows[0].sku) {
      const duplicate = await pool.query('SELECT id FROM products WHERE sku = $1 AND id != $2', [sku.trim().toUpperCase(), id]);
      if (duplicate.rows.length > 0) {
        return res.status(409).json({ success: false, message: `Product with SKU '${sku.trim()}' already exists.` });
      }
    }

    const price = unit_price !== undefined ? parseFloat(unit_price) : existing.rows[0].unit_price;
    const minStock = minimum_stock !== undefined ? parseInt(minimum_stock, 10) : existing.rows[0].minimum_stock;

    const result = await pool.query(
      `UPDATE products
       SET product_name = $1, sku = $2, category = $3, unit_price = $4, minimum_stock = $5,
           warehouse_location = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        product_name.trim(),
        sku ? sku.trim().toUpperCase() : existing.rows[0].sku,
        category ? category.trim() : existing.rows[0].category,
        price,
        minStock,
        warehouse_location ? warehouse_location.trim() : null,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
