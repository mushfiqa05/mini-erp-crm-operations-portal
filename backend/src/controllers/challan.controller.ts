import { Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../types';

// Helper function to generate unique Challan Number (CH-YYYYMM-XXXX)
const generateChallanNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const countResult = await pool.query('SELECT COUNT(*) FROM challans');
  const nextNum = (parseInt(countResult.rows[0].count, 10) + 1).toString().padStart(4, '0');
  return `CH-${dateStr}-${nextNum}`;
};

// 1. Get List of Challans
export const getChallans = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    let queryText = `
      SELECT c.*, cust.customer_name, cust.business_name, cust.mobile
      FROM challans c
      JOIN customers cust ON c.customer_id = cust.id
      WHERE 1=1
    `;
    let countQueryText = `
      SELECT COUNT(*)
      FROM challans c
      JOIN customers cust ON c.customer_id = cust.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      const searchClause = ` AND (c.challan_number ILIKE $${queryParams.length} OR cust.customer_name ILIKE $${queryParams.length} OR cust.business_name ILIKE $${queryParams.length})`;
      queryText += searchClause;
      countQueryText += searchClause;
    }

    if (status) {
      queryParams.push(status);
      const statusClause = ` AND c.status = $${queryParams.length}`;
      queryText += statusClause;
      countQueryText += statusClause;
    }

    const countResult = await pool.query(countQueryText, queryParams);
    const totalRecords = parseInt(countResult.rows[0].count, 10);

    queryText += ` ORDER BY c.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    const result = await pool.query(queryText, [...queryParams, limitNum, offset]);

    return res.status(200).json({
      success: true,
      data: {
        challans: result.rows,
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

// 2. Get Single Challan by ID with snapshot items
export const getChallanById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const challanResult = await pool.query(
      `SELECT c.*, cust.customer_name, cust.business_name, cust.email, cust.mobile, cust.address, cust.gst_number
       FROM challans c
       JOIN customers cust ON c.customer_id = cust.id
       WHERE c.id = $1`,
      [id]
    );

    if (challanResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Challan not found.' });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY id ASC',
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...challanResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Draft Sales Challan (Stores Product Snapshot, Stock remains UNCHANGED)
export const createChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const client = await pool.connect();

  try {
    const { customer_id, items } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Challan must contain at least one product item.' });
    }

    const createdBy = req.user ? req.user.name : 'System';

    await client.query('BEGIN');

    // Verify Customer
    const customerCheck = await client.query('SELECT id FROM customers WHERE id = $1', [customer_id]);
    if (customerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Selected customer does not exist.' });
    }

    // Generate Challan Number
    const challanNumber = await generateChallanNumber();

    let totalQuantity = 0;

    // Process & Validate Items and collect snapshot details
    const itemSnapshots: { product_id: number; product_name: string; sku: string; unit_price: number; quantity: number }[] = [];

    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Product quantity must be a positive integer.' });
      }

      const productRes = await client.query(
        'SELECT id, product_name, sku, unit_price FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: `Product ID ${item.product_id} not found.` });
      }

      const prod = productRes.rows[0];

      itemSnapshots.push({
        product_id: prod.id,
        product_name: prod.product_name,
        sku: prod.sku,
        unit_price: parseFloat(prod.unit_price),
        quantity: qty
      });

      totalQuantity += qty;
    }

    // Insert Challan header (Draft status)
    const challanInsertRes = await client.query(
      `INSERT INTO challans (challan_number, customer_id, total_quantity, status, created_by)
       VALUES ($1, $2, $3, 'Draft', $4)
       RETURNING *`,
      [challanNumber, customer_id, totalQuantity, createdBy]
    );

    const newChallanId = challanInsertRes.rows[0].id;

    // Insert Challan Items with Product Snapshot
    for (const snap of itemSnapshots) {
      await client.query(
        `INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newChallanId, snap.product_id, snap.product_name, snap.sku, snap.unit_price, snap.quantity]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Draft Challan created successfully. Stock is unchanged.',
      data: {
        ...challanInsertRes.rows[0],
        items: itemSnapshots
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// 4. CONFIRM CHALLAN (CRITICAL TRANSACTION & STOCK DEDUCTION LOGIC)
export const confirmChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const createdBy = req.user ? req.user.name : 'System';

    await client.query('BEGIN');

    // 1. Fetch Challan details
    const challanRes = await client.query('SELECT * FROM challans WHERE id = $1 FOR UPDATE', [id]);
    if (challanRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Challan not found.' });
    }

    const challan = challanRes.rows[0];

    if (challan.status !== 'Draft') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot confirm challan. Current status is already '${challan.status}'.`
      });
    }

    // 2. Fetch Challan Items
    const itemsRes = await client.query('SELECT * FROM challan_items WHERE challan_id = $1', [id]);
    const items = itemsRes.rows;

    if (items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Challan has no product items.' });
    }

    // 3. CHECK STOCK SUFFICIENCY FOR ALL PRODUCTS WITH FOR UPDATE ROW LOCKING
    for (const item of items) {
      const prodRes = await client.query(
        'SELECT id, product_name, current_stock FROM products WHERE id = $1 FOR UPDATE',
        [item.product_id]
      );

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: `Product '${item.product_name}' no longer exists.` });
      }

      const prod = prodRes.rows[0];

      if (prod.current_stock < item.quantity) {
        // STOCK IS INSUFFICIENT! ROLLBACK TRANSACTION IMMEDIATELY & RETURN API ERROR
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${prod.product_name}. Available: ${prod.current_stock}, Requested: ${item.quantity}`
        });
      }
    }

    // 4. IF ALL SUFFICIENT: DEDUCT STOCK & LOG OUT STOCK MOVEMENTS
    for (const item of items) {
      // Deduct product stock
      await client.query(
        'UPDATE products SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [item.quantity, item.product_id]
      );

      // Create OUT stock movement record
      await client.query(
        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
         VALUES ($1, $2, 'OUT', $3, $4)`,
        [item.product_id, item.quantity, `Dispatched for Confirmed Sales Challan ${challan.challan_number}`, createdBy]
      );
    }

    // 5. UPDATE CHALLAN STATUS TO CONFIRMED
    const updatedChallanRes = await client.query(
      `UPDATE challans SET status = 'Confirmed' WHERE id = $1 RETURNING *`,
      [id]
    );

    // COMMIT ATOMIC TRANSACTION
    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Challan ${challan.challan_number} confirmed successfully. Inventory stock updated.`,
      data: updatedChallanRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// 5. CANCEL CHALLAN (Draft -> Cancelled)
export const cancelChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const challanRes = await pool.query('SELECT * FROM challans WHERE id = $1', [id]);
    if (challanRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Challan not found.' });
    }

    const challan = challanRes.rows[0];

    if (challan.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Only Draft challans can be cancelled. Current status is '${challan.status}'.`
      });
    }

    const result = await pool.query(
      `UPDATE challans SET status = 'Cancelled' WHERE id = $1 RETURNING *`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: `Challan ${challan.challan_number} has been cancelled.`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
