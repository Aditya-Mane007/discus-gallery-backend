const { pool } = require("../../config/db");

const createUserTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS  users(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    otp INTEGER,
    otp_created_at TIMESTAMPTZ,
    otp_expires_at TIMESTAMPTZ
)
    `;

  try {
    const result = await pool.query(queryText);
    console.log("User Table Created Successfully : ", result);
  } catch (error) {
    console.log("Error Creating Users table : ", error);
  }
};

const updateUsersTable = async () => {
  const queryText = `
   ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_otp_active BOOLEAN DEFAULT false;
    `;

  try {
    const result = await pool.query(queryText);
    console.log("User Table Updated Successfully : ", result);
  } catch (error) {
    console.log("Error updating Users table : ", error);
  }
};

// createUserTable();
updateUsersTable();
