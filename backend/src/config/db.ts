import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/minierp_db';

export const pool = new Pool({
  connectionString,
  // SSL setting for production deployment (Neon / Supabase / Render)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL database successfully.');
    release();
  }
});
