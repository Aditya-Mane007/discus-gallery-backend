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

  return result.rowCount > 0;
};

const createUser = async (name, email, password) => {
  const query = {
    name: "create-user",
    text: "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id, email, profile_photo, verified, otp_attempts",
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
    name: "getUserByEmail",
    text: "SELECT id, email, profile_photo, password, verified, otp_attempts FROM users WHERE email=$1",
    values: [email],
  };
  const result = await pool.query(query);

  return result;
};

const getUserById = async (id) => {
  const query = {
    name: "get-user-by-id",
    text: "SELECT id, email, profile_photo, verified, otp_attempts FROM users WHERE id=$1",
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

const generateOTPQuery = async (otp, id) => {
  const query = {
    name: "generate-otp",
    text: "UPDATE users SET otp=$1 WHERE id=$2",
    values: [otp, id],
  };

  const result = await pool.query(query);

  return result;
};

const otpAttemptsQuery = async (otpAttempt, id) => {
  const query = {
    name: "update-opt-attempts",
    text: "UPDATE users SET otp_attempts=$1 WHERE id=$2",
    values: [otpAttempt, id],
  };

  const result = await pool.query(query);

  return result;
};

const getOTPQuery = async (id) => {
  const query = {
    name: "get-otp-for-verification",
    text: "SELECT otp, otp_created_at FROM users WHERE id=$1",
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

const updateVerifiedStatusQuery = async (id) => {
  const query = {
    name: "update-verified-status",
    text: "UPDATE users SET verified=TRUE WHERE id=$1",
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

const generateOTPAndUpdateOTPAttempts = async (otp, id, otp_creation_time) => {
  const query = {
    name: "generate-otp-and-update-otp-attempts",
    text: "UPDATE users SET otp = $1, otp_attempts = otp_attempts - 1, otp_created_at = $3 WHERE id = $2 RETURNING otp_attempts, otp_created_at",
    values: [otp, id, otp_creation_time],
  };
  const result = await pool.query(query);

  return result;
};

const updateUserInfo = async (id, name, profilePhoto) => {
  const query = {
    name: "update-user-info",
    text: "UPDATE users SET name=COALESCE($2,name) profile_photo=COALESCE($3,profile_photo) WHERE id=$1 RETURNING name profile_photo",
    values: [id, name, profilePhoto],
  };

  const result = await pool.query(query);

  return result;
};

const getOtpData = async (id) => {
  const query = {
    name: "get-otp-data",
    text: "SELECT otp_created_at, otp_attempts, verified FROM users WHERE id=$1",
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

module.exports = {
  registerUserQuery,
  checkIfUsersExists,
  createUser,
  getUserByEmail,
  getUserById,
  generateOTPQuery,
  otpAttemptsQuery,
  getOTPQuery,
  updateVerifiedStatusQuery,
  generateOTPAndUpdateOTPAttempts,
  updateUserInfo,
  getOtpData,
};
