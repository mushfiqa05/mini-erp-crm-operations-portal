import { Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../types';

// List customers with search, filter, and pagination
export const getCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, status, customer_type, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    let queryText = 'SELECT * FROM customers WHERE 1=1';
    let countQueryText = 'SELECT COUNT(*) FROM customers WHERE 1=1';
    const queryParams: any[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      const searchClause = ` AND (customer_name ILIKE $${queryParams.length} OR mobile ILIKE $${queryParams.length} OR email ILIKE $${queryParams.length} OR business_name ILIKE $${queryParams.length})`;
      queryText += searchClause;
      countQueryText += searchClause;
    }

    if (status) {
      queryParams.push(status);
      const statusClause = ` AND status = $${queryParams.length}`;
      queryText += statusClause;
      countQueryText += statusClause;
    }

    if (customer_type) {
      queryParams.push(customer_type);
      const typeClause = ` AND customer_type = $${queryParams.length}`;
      queryText += typeClause;
      countQueryText += typeClause;
    }

    // Get total count for pagination
    const countResult = await pool.query(countQueryText, queryParams);
    const totalRecords = parseInt(countResult.rows[0].count, 10);

    // Get paginated rows
    queryText += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    const customersResult = await pool.query(queryText, [...queryParams, limitNum, offset]);

    return res.status(200).json({
      success: true,
      data: {
        customers: customersResult.rows,
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

// Get single customer details with follow-up notes
export const getCustomerById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const notesResult = await pool.query(
      'SELECT * FROM follow_up_notes WHERE customer_id = $1 ORDER BY created_at DESC',
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...customerResult.rows[0],
        follow_up_notes: notesResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new customer
export const createCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customer_name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes } = req.body;

    // Input validations
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }

    const validTypes = ['Retail', 'Wholesale', 'Distributor'];
    if (!customer_type || !validTypes.includes(customer_type)) {
      return res.status(400).json({ success: false, message: 'Invalid customer type. Must be Retail, Wholesale, or Distributor.' });
    }

    const validStatuses = ['Lead', 'Active', 'Inactive'];
    const customerStatus = status || 'Lead';
    if (!validStatuses.includes(customerStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Lead, Active, or Inactive.' });
    }

    const result = await pool.query(
      `INSERT INTO customers (customer_name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        customer_name.trim(),
        mobile.trim(),
        email ? email.trim().toLowerCase() : null,
        business_name ? business_name.trim() : null,
        gst_number ? gst_number.trim() : null,
        customer_type,
        address ? address.trim() : null,
        customerStatus,
        follow_up_date || null,
        notes ? notes.trim() : null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Update customer
export const updateCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { customer_name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes } = req.body;

    const existing = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }

    const validTypes = ['Retail', 'Wholesale', 'Distributor'];
    if (customer_type && !validTypes.includes(customer_type)) {
      return res.status(400).json({ success: false, message: 'Invalid customer type.' });
    }

    const validStatuses = ['Lead', 'Active', 'Inactive'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const result = await pool.query(
      `UPDATE customers
       SET customer_name = $1, mobile = $2, email = $3, business_name = $4, gst_number = $5,
           customer_type = $6, address = $7, status = $8, follow_up_date = $9, notes = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        customer_name.trim(),
        mobile.trim(),
        email ? email.trim().toLowerCase() : null,
        business_name ? business_name.trim() : null,
        gst_number ? gst_number.trim() : null,
        customer_type || existing.rows[0].customer_type,
        address ? address.trim() : null,
        status || existing.rows[0].status,
        follow_up_date || null,
        notes ? notes.trim() : null,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Add follow-up note to customer
export const addFollowUpNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { note, follow_up_date } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Follow-up note text is required.' });
    }

    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const createdBy = req.user ? req.user.name : 'System';

    // Insert note
    const noteResult = await pool.query(
      `INSERT INTO follow_up_notes (customer_id, note, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, note.trim(), createdBy]
    );

    // Optionally update follow_up_date on customer
    if (follow_up_date) {
      await pool.query(
        'UPDATE customers SET follow_up_date = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [follow_up_date, id]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Follow-up note added successfully',
      data: noteResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
