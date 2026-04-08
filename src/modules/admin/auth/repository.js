const { TABLE_SCHEMA, SESSION_LIMIT } = require("../../../utils/constant.js");
const { pool } = require("../../../config/db.js");

const registerUserQuery = async () => {
  const result = await pool.query(`SELCET * FROM ${TABLE_SCHEMA.ADMIN_AUTH}`);

  return result.rows;
};

const checkIfUsersExists = async (email) => {
  const query = {
    name: "check-if-user-exists",
    text: `SELECT email FROM ${TABLE_SCHEMA.ADMIN_AUTH} WHERE email=$1`,
    values: [email],
  };
  const result = await pool.query(query);

  return result.rowCount > 0;
};

const createUser = async (name, email, password, jwt_secret) => {
  const query = {
    name: "create-user",
    text: `INSERT INTO ${TABLE_SCHEMA.ADMIN_AUTH}(name,email,password,jwt_secret) VALUES($1,$2,$3,$4) RETURNING id, email, profile_photo, verified,jwt_secret`,
    values: [name, email, password, jwt_secret],
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
    text: `SELECT id, email, profile_photo, password, verified, jwt_secret FROM ${TABLE_SCHEMA.ADMIN_AUTH} WHERE email=$1`,
    values: [email],
  };
  const result = await pool.query(query);

  return result;
};

const getUserById = async (id) => {
  const query = {
    name: "get-user-by-id",
    text: `SELECT id, email, profile_photo, verified, jwt_secret FROM ${TABLE_SCHEMA.ADMIN_AUTH} WHERE id=$1`,
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

const gettempSession = async (id) => {
  const query = {
    name: "get-temp-session-data",
    text: `SELECT ts.temp_session_id, ts.user_id, u.id, u.jwt_secret FROM ${TABLE_SCHEMA?.ADMIN_TEMP_SESSION} ts INNER JOIN ${TABLE_SCHEMA?.ADMIN_AUTH} u ON u.id = ts.user_id WHERE ts.temp_session_id = $1`,
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

const updateUserInfo = async (id, name, profilePhoto) => {
  const query = {
    name: "update-user-info",
    text: `UPDATE ${TABLE_SCHEMA.ADMIN_AUTH} SET name=COALESCE($2,name) profile_photo=COALESCE($3,profile_photo) WHERE id=$1 RETURNING name profile_photo`,
    values: [id, name, profilePhoto],
  };

  const result = await pool.query(query);

  return result;
};
const generateOTPQuery = async (
  userId,
  tempSessionId,
  otp_type,
  hashedOTP,
  otpExpiryTime,
) => {
  // NEW FLOW
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // If an unused OTP already exists for this context, mark it used before creating a new one.
    if (tempSessionId) {
      await client.query(
        `UPDATE ${TABLE_SCHEMA?.ADMIN_OTP}
         SET is_used = TRUE
         WHERE user_id = $1 AND temp_session_id = $2 AND otp_type = $3 AND is_used = FALSE`,
        [userId, tempSessionId, otp_type],
      );
    } else {
      await client.query(
        `UPDATE ${TABLE_SCHEMA?.ADMIN_OTP}
         SET is_used = TRUE
         WHERE user_id = $1 AND otp_type = $2 AND is_used = FALSE`,
        [userId, otp_type],
      );
    }

    const insertResult = await client.query(
      `INSERT INTO ${TABLE_SCHEMA?.ADMIN_OTP}
       (user_id, temp_session_id, otp_type, otp_hash, expires_at, is_used)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING *`,
      [userId, tempSessionId, otp_type, hashedOTP, otpExpiryTime],
    );

    await client.query("COMMIT");
    return insertResult;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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

const getOTPQuery = async (userId, tempSessionId, otp_type) => {
  const query = {
    name: "get-otp-for-verification",
    text: tempSessionId
      ? `SELECT * FROM ${TABLE_SCHEMA?.ADMIN_OTP} WHERE user_id=$1 AND temp_session_id=$2 AND otp_type=$3 AND is_used=FALSE`
      : `SELECT * FROM ${TABLE_SCHEMA?.ADMIN_OTP} WHERE user_id=$1 AND otp_type=$2 AND is_used=FALSE`,
    values: tempSessionId
      ? [userId, tempSessionId, otp_type]
      : [userId, otp_type],
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

const getOtpData = async (userId, tempSessionId, otp_type) => {
  const query = {
    name: "get-otp-data",
    text: tempSessionId
      ? `SELECT * FROM ${TABLE_SCHEMA?.ADMIN_OTP} WHERE user_id=$1 AND temp_session_id=$2 AND otp_type=$3 AND is_used=FALSE`
      : `SELECT * FROM ${TABLE_SCHEMA?.ADMIN_OTP} WHERE user_id=$1 AND otp_type=$2 AND is_used=FALSE`,
    values: tempSessionId
      ? [userId, tempSessionId, otp_type]
      : [userId, otp_type],
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
const updateRefreshToken = async (refreshToken, sessionId, activeStatus) => {
  try {
    let query;
    let result;
    if (activeStatus) {
      query = {
        name: "update-refresh-token",
        text: `UPDATE ${TABLE_SCHEMA?.ADMIN_SESSION} SET refresh_token=$1 WHERE session_id=$2 AND is_active=$3`,
        values: [refreshToken, sessionId, activeStatus],
      };
      result = pool.query(query);
      return result;
    } else {
      query = {
        name: "update-refresh-token",
        text: `UPDATE ${TABLE_SCHEMA?.ADMIN_SESSION} SET is_active=FALSE WHERE session_id=$1`,
        values: [sessionId],
      };
      result = pool.query(query);
      return result;
    }
  } catch (error) {
    console.log("ERROR : ", error);
  }
};

// CREATE SESSION
const checkRefreshToken = async (sessionId) => {
  try {
    const query = {
      name: "get-refresh-token-from-db",
      text: `
        SELECT 
          s.session_id AS "sessionId",
          s.refresh_token,
          s.user_id AS "userId",

          u.id,
          u.name,
          u.email,
          u.profile_photo,
          u.verified,
          u.jwt_secret

        FROM ${TABLE_SCHEMA?.ADMIN_SESSION} s
        INNER JOIN ${TABLE_SCHEMA?.ADMIN_AUTH} u
          ON u.id = s.user_id
        
        WHERE 
          s.session_id = $1
          AND s.is_active = TRUE 
      `,
      values: [sessionId],
    };

    const result = await pool.query(query);

    return result;
  } catch (error) {
    console.log("ERROR : ", error);
  }
};

const createSession = async (user_id, device_name, refresh_token, ip) => {
  const query = {
    name: "create-user-session",
    text: `INSERT INTO ${TABLE_SCHEMA?.ADMIN_SESSION}(user_id,device_name,refresh_token,ip) VALUES($1,$2,$3,$4) RETURNING session_id`,
    values: [user_id, device_name, refresh_token, ip],
  };

  const getSessions = {
    name: "get-user-session",
    text: `SELECT * FROM ${TABLE_SCHEMA?.ADMIN_SESSION} WHERE user_id=$1 AND is_active=TRUE ORDER BY created_at LIMIT 1`,
    values: [user_id],
  };

  const updateLeastUsedSession = {
    name: "update-least-used-session",
    text: `UPDATE ${TABLE_SCHEMA?.ADMIN_SESSION} SET is_active=FALSE WHERE user_id=$1 AND session_id=$2`,
  };

  const sessionResult = await pool.query(getSessions);

  if (sessionResult?.rowCount == SESSION_LIMIT) {
    let leastUsedSession = Number.MAX_SAFE_INTEGER;
    let leastUsedSessionId = null;

    for (const item of sessionResult.rows) {
      if (new Date(item?.created_at).getTime() < leastUsedSession) {
        leastUsedSession = new Date(item?.created_at).getTime();
        leastUsedSessionId = item?.id;
      }
    }

    await pool.query(updateLeastUsedSession.text, [
      user_id,
      leastUsedSessionId,
    ]);
  }

  const result = await pool.query(query);

  return result;
};

const getSessions = async (id) => {
  const query = {
    name: "create-user-session",
    query: `SELECT * ${TABLE_SCHEMA?.ADMIN_SESSION} WHERE user_id=$1`,
    values: [id],
  };

  const result = await pool.query(query);

  return result;
};

// READ SESSION
const getSessionById = async (id, sessionId) => {
  const query = {
    name: "get-session-by-id",
    query: `SELECT * FROM ${TABLE_SCHEMA?.ADMIN_SESSION} WHERE user_id=$1 AND id=$2`,
    values: [id, sessionId],
  };

  const result = await pool.query(query);

  return result;
};

// UPDATE OR SOFT DELETE SESSION
const deleteSession = async (id, sessionId) => {
  const query = {
    name: "delete-session",
    query: `UPDATE ${TABLE_SCHEMA?.ADMIN_SESSION} SET is_active = FALSE, WHERE user_id=$1 AND id=$2`,
    values: [id, sessionId],
  };

  const result = await pool.query(query);

  return result;
};

// TEMP SESSION
const createTempSession = async (user_id, device_name, ip) => {
  const query = {
    name: "create-temp-session",
    text: `INSERT INTO ${TABLE_SCHEMA?.ADMIN_TEMP_SESSION}(user_id,device,ip) VALUES($1,$2,$3) RETURNING temp_session_id`,
    values: [user_id, device_name, ip],
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
  getOTPQuery,
  updateVerifiedStatusQuery,
  updateUserInfo,
  getOtpData,
  otpVerificationQuery,
  resetOtpStatus,
  updateRefreshToken,
  checkRefreshToken,

  createSession,
  getSessions,
  getSessionById,
  deleteSession,

  createTempSession,

  gettempSession,
};
