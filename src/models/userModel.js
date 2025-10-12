const { pool } = require("../config/db");
const jwt = require("jsonwebtoken");

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

  return result.rowCount > 0;
};

const createUser = async (name, email, password) => {
  const query = {
    name: "create-user",
    text: "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *",
    values: [name, email, password],
  };

  const result = await pool.query(query);

  if (result.rowCount > 0) {
    const data = result.rows[0];

    delete data.password;

    const user = {
      ...data,
    };

    return user;
  }

  return result.rowCount > 0;
};

// check for user and return user password
const getUserByEmail = async (email) => {
  const query = {
    name: "check-if-user-exists",
    text: "SELECT email, password FROM users WHERE email=$1",
    values: [email],
  };
  const result = await pool.query(query);

  return result;
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
  checkIfUsersExists,
  createUser,
  getUserByEmail,
};
