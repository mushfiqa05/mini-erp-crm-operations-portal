const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setup() {
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/minierp_db';

  let urlObj;
  try {
    urlObj = new URL(dbUrl);
  } catch (e) {
    console.error('❌ Invalid DATABASE_URL in backend/.env file.');
    process.exit(1);
  }

  const dbName = urlObj.pathname.replace(/^\//, '') || 'minierp_db';
  urlObj.pathname = '/postgres';

  console.log(`🔌 Connecting to PostgreSQL server...`);
  const rootClient = new Client({ connectionString: urlObj.toString() });

  try {
    await rootClient.connect();
    const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`📦 Creating database "${dbName}"...`);
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully!`);
    } else {
      console.log(`ℹ️ Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error(`❌ Connection to PostgreSQL server failed.`);
    console.error(`Please check PostgreSQL is running and your password in backend/.env is correct.`);
    console.error(`Details:`, err.message || err);
    process.exit(1);
  } finally {
    await rootClient.end();
  }

  console.log(`📄 Running schema and seed scripts...`);
  const dbClient = new Client({ connectionString: dbUrl });
  try {
    await dbClient.connect();
    const schemaSql = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf-8');
    const seedSql = fs.readFileSync(path.join(__dirname, '../sql/seed.sql'), 'utf-8');

    await dbClient.query(schemaSql);
    console.log(`✅ Database schema applied successfully.`);

    await dbClient.query(seedSql);
    console.log(`✅ Seed data inserted successfully!`);
  } catch (err) {
    console.error(`❌ Error initializing database tables:`, err.message);
    process.exit(1);
  } finally {
    await dbClient.end();
  }

  console.log(`🎉 Database setup complete!`);
}

setup();
