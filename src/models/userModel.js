const { pool } = require("../config/db");

const registerUserQuery = async () => {
  const result = await pool.query("SELCET * FROM users");

  return result.rows;
};

const loginUserQuery = async () => {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
};

const logoutQuery = async () => {
  const result = await pool.query("SELCT * FROM users");
  return result.rows;
};

module.exports = {
  loginUserQuery,
  registerUserQuery,
  logoutQuery,
};
