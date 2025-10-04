const { pool } = require("../config/db");

const registerUserQuery = async () => {
  const result = await pool.query("SELCET * FROM users");

  return result.rows;
};

const checkIfUsersExists = async (email) => {
  const query = {
    name: "check-if-user-exists",
    text: "SELECT email FROM users WHERE email=$1",
    values: [email],
  };
  const result = await pool.query(query);

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
  checkIfUsersExists,
  registerUserQuery,
  logoutQuery,
};
