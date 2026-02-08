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
    created_at TIMESTAMP DEFAULT NOW(),
    otp_attempts INTEGER DEFAULT 3,
    otp INTEGER,
    otp_created_at TIMESTAMP
    
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
   ALTER TABLE IF EXISTS users
   ALTER COLUMN id SERIAL NOT NULL AUTO_INCREMENT PRIMARY KEY
    `;

  try {
    const result = await pool.query(queryText);
    console.log("User Table Updated Successfully : ", result);
  } catch (error) {
    console.log("Error updating Users table : ", error);
  }
};

createUserTable();
// updateUsersTable();
