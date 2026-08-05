const { Pool } = require('pg');
require('dotenv').config();

const environment = process.env.NODE_ENV;

if (environment === 'production') {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  pool.on('connect', () => {
    console.log('NEON DB Connection pool establised with database');
  });
  module.exports = { pool };
} else {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  pool.on('connect', () => {
    console.log('Local Connection pool establised with database');
  });
  module.exports = { pool };
}
