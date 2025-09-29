const { pool } = require("../../config/db");

const createUserTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS  users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() 
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
    ADD COLUMN profile_phtot VARCHAR(255),
    ADD COLUMN verified BOOLEAN DEFAULT false
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
