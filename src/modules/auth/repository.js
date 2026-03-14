const { TABLE_SCHEMA } = require("../../utils/constant");
const { pool } = require("../../config/db.js");

const registerUserQuery = async () => {
  const result = await pool.query(`SELCET * FROM ${TABLE_SCHEMA.AUTH}`);

  return result.rows;
};

const checkIfUsersExists = async (email) => {
  const query = {
    name: "check-if-user-exists",
    text: `SELECT email FROM ${TABLE_SCHEMA.AUTH} WHERE email=$1`,
    values: [email],
  };
  const result = await pool.query(query);

  return result.rowCount > 0;
};

const createUser = async (name, email, password, jwt_secret, refresh_token) => {
  const query = {
    name: "create-user",
    text: `INSERT INTO ${TABLE_SCHEMA.AUTH}(name,email,password,jwt_secret,refresh_token) VALUES($1,$2,$3,$4,$5) RETURNING id, email, profile_photo, verified,jwt_secret`,
    values: [name, email, password, jwt_secret, refresh_token],
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
    name: "get-user-by-email",
    text: `SELECT id, email, profile_photo, password, verified, jwt_secret FROM ${TABLE_SCHEMA.AUTH} WHERE email=$1`,
    values: [email],
  };
  const result = await pool.query(query);

  return result;
};

const getUserById = async (id) => {
  const query = {
    name: "get-user-by-id",
    text: `SELECT id, email, profile_photo, verified, jwt_secret FROM ${TABLE_SCHEMA.AUTH} WHERE id=$1`,
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

const updateUserInfo = async (id, name, profilePhoto) => {
  const query = {
    name: "update-user-info",
    text: `UPDATE ${TABLE_SCHEMA.AUTH} SET name=COALESCE($2,name) profile_photo=COALESCE($3,profile_photo) WHERE id=$1 RETURNING name profile_photo`,
    values: [id, name, profilePhoto],
  };

  const result = await pool.query(query);

  return result;
};

const generateOTPQuery = async (
  otp,
  id,
  otp_creation_time,
  otp_expiry_time,
) => {
  const query = {
    name: "generate-otp-and-update-otp-attempts",
    text: `UPDATE ${TABLE_SCHEMA?.AUTH} SET otp = $1, otp_created_at = $3, otp_expires_at = $4, is_otp_active = true WHERE id = $2 RETURNING otp_created_at`,
    values: [otp, id, otp_creation_time, otp_expiry_time],
  };
  const result = await pool.query(query);

  return result;
};

const updateVerifiedStatusQuery = async (id) => {
  const query = {
    name: "update-verified-status",
    text: `UPDATE ${TABLE_SCHEMA?.AUTH} SET verified=TRUE, otp = null, otp_created_at = null, otp_expires_at = null, is_otp_active = false  WHERE id=$1`,
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

const getOTPQuery = async (id) => {
  const query = {
    name: "get-otp-for-verification",
    text: `SELECT otp, otp_created_at, otp_expires_at,is_otp_active FROM ${TABLE_SCHEMA?.AUTH} WHERE id=$1`,
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

const otpVerificationQuery = async (id, otp) => {
  const query = {
    name: "otp-verification",
    text: `UPDATE ${TABLE_SCHEMA?.AUTH} SET verified=TRUE WHERE otp = $2 AND otp_expires_at > NOW() AND id=$1`,
    values: [id, otp],
  };

  const result = await pool.query(query);

  return result;
};

const getOtpData = async (id) => {
  const query = {
    name: "get-otp-data",
    text: `SELECT otp_created_at,otp_expires_at,otp,is_otp_active, verified FROM ${TABLE_SCHEMA?.AUTH} WHERE id=$1`,
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

const resetOtpStatus = async (id) => {
  const query = {
    name: "reset-otp-attempts",
    text: `UPDATE ${TABLE_SCHEMA?.AUTH} SET is_otp_active = false WHERE id=$1`,
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

// UPDATE REFRESH TOKEN
const updateRefreshToken = async (refreshToken, id) => {
  const query = {
    name: "update-refresh-token",
    text: `UPDATE ${TABLE_SCHEMA?.AUTH} SET refresh_token=$1 WHERE id=$2`,
    values: [refreshToken, id],
  };

  const result = pool.query(query);

  return result;
};

const getRefreshTokenById = async (id) => {
  const query = {
    name: "get-refresh-token-from-db",
    text: `SELECT id, name, email, profile_photo, verified, jwt_secret, refresh_token FROM ${TABLE_SCHEMA?.AUTH} WHERE id=$1`,
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

// CREATE SESSION
const crateSession = async (user_id, device_name, ip, refresh_token) => {
  const query = {
    name: "create-user-session",
    query: `INSERT INTO ${TABLE_SCHEMA?.SESSION}(user_id,device_name,ip_address,refresh_token) VALUES($1,$2,$3,$4)`,
    values: [user_id, device_name, ip, refresh_token],
  };

  const result = await pool.query(query);

  return result;
};

// READ SESSION

//

module.exports = {
  registerUserQuery,
  checkIfUsersExists,
  createUser,
  getUserByEmail,
  getUserById,
  generateOTPQuery,
  getOTPQuery,
  updateVerifiedStatusQuery,
  updateUserInfo,
  getOtpData,
  otpVerificationQuery,
  resetOtpStatus,
  updateRefreshToken,
  getRefreshTokenById,
};
