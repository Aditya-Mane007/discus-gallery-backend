const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const {
  checkIfUsersExists,
  createUser,
  getUserByEmail,
  getUserById,
  generateOTPQuery,
  getOTPQuery,
  updateVerifiedStatusQuery,
  generateOTPAndUpdateOTPAttempts,
  updateUserInfo,
  getOtpData,
  otpVerificationQuery,
  resetOtpStatus,
  updateRefreshToken,
  createSession,
  checkRefreshToken,
  createTempSession,
} = require("./repository.js");
const {
  generateCSRFToken,
  generateToken,
  generateOTP,
  generateJWTSecret,
  generateRefreshToken,
  generateTempSessionToken,
} = require("../../../utils/utils.js");
const {
  registerSchema,
  loginSchema,
  otpVerificationSchema,
  updateUserInfoSchema,
  resetPasswordSchema,
} = require("./validation.js");
const redisClient = require("../../../services/redisClient.js");
const {
  OTP_EXPIRY_TIME,
  HASHED_SALT,
  clearAuthCookies,
  OTP_TYPE,
} = require("../../../utils/constant.js");
const { config } = require("../../../config/config.js");
const {
  generateOTPService,
  generate2FAOTPService,
} = require("../../../services/service.js");

dotenv.config();

const REFRESH_LOCK_TTL_MS = 5000;
const REFRESH_WAIT_TIMEOUT_MS = 5000;
const REFRESH_WAIT_INTERVAL_MS = 150;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setRefreshCookies = (res, sessionId, token, refreshToken, csrfToken) => {
  res.cookie("session-id", sessionId, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.cookie("token", token, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.cookie("refresh-token", refreshToken, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/auth/refresh-token",
  });

  res.cookie("XSRF-TOKEN", csrfToken, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

// Register Controller
const registerController = asyncHandler(async (req, res) => {
  try {
    await registerSchema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).json({ message: error?.details[0]?.message });
  }

  const { email, password, name } = req.body;

  const useExists = await checkIfUsersExists(email);

  if (useExists) {
    return res
      .status(400)
      .json({ message: "User already exists, please login" });
  }

  const jwtSecret = generateJWTSecret();

  const hashpassword = await bcrypt.hash(password, HASHED_SALT);

  const refreshToken = generateRefreshToken();

  const hasedRefreshToken = await bcrypt.hash(refreshToken, HASHED_SALT);

  const user = await createUser(name, email, hashpassword, jwtSecret);

  const deviceName =
    req?.headers["sec-ch-ua-platform"]?.replace(/["']/g, "") || "Unknown";

  const session = await createSession(user?.id, deviceName, hasedRefreshToken);

  if (!user) {
    return res.status(500).json({
      message: "Something went wrong, please try again later",
    });
  }

  const token = generateToken(
    {
      id: user.id,
      email: user.email,
      profile_photo: user.profile_photo,
      verified: user.verified,
    },
    user?.jwt_secret,
  );

  delete user?.jwt_secret;

  res.cookie("token", token, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.cookie("refresh-token", refreshToken, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/auth/refresh-token",
  });

  const sessionId = session?.rows[0]?.session_id;

  res.cookie("session-id", sessionId, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  const csrfToken = generateCSRFToken(token);
  res.cookie("XSRF-TOKEN", csrfToken, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(201).json({
    accessToken: token,
    user: user,
    message: "User Registered Successfully",
  });
});

// Login controller
const loginController = asyncHandler(async (req, res) => {
  try {
    await loginSchema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).json({ message: error?.details[0]?.message });
  }

  const { email, password } = req.body;

  const userExists = await getUserByEmail(email);

  if (!userExists || userExists.rowCount < 1) {
    return res
      .status(400)
      .json({ message: "User does not exists, please register" });
  }

  const checkPassword = await bcrypt.compare(
    password,
    userExists.rows[0].password,
  );

  if (!checkPassword) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const user = userExists.rows[0];
  const cooldownKey = `otp_cooldown:${user?.id}`;
  await redisClient.del(`${cooldownKey}`);

  const attemptsKey = Number(
    await redisClient.get(`otp_request_count:${user?.id}`),
  );

  if (attemptsKey && attemptsKey <= 0) {
    clearAuthCookies(res);
    res.clearCookie("temp-session-id");
    return res.status(400).json({
      message:
        "Looks like there were several attempts. For your security, please try again in about an hour.",
    });
  }

  const deviceName =
    req?.headers["sec-ch-ua-platform"]?.replace(/["']/g, "") || "Unknown";

  const ip = req?.ip || req?.socket?.remoteAddress;

  const tempSession = await createTempSession(user?.id, deviceName, ip);

  const temSessionId = tempSession.rows[0]?.temp_session_id;

  const token = generateTempSessionToken(
    {
      id: user?.id,
      temp_session_id: temSessionId,
    },
    user.jwt_secret,
  );

  res.cookie("temp-session-id", token, {
    maxAge: 5 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const csrfToken = generateCSRFToken(token);

  res.cookie("XSRF-TOKEN", csrfToken, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const userInfo = user;

  delete userInfo?.password;
  delete userInfo?.jwt_secret;

  const otpCreationTime = new Date();
  const otpExpiryTime = new Date(
    otpCreationTime.getTime() +
      config.OTP_CONFIG[OTP_TYPE?.LOGIN_VERIFICATION_OTP].expiry * 1000,
  ).toISOString();

  // await generateOTPService(
  //   userInfo?.id,
  //   temSessionId,
  //   OTP_TYPE?.LOGIN_VERIFICATION_OTP,
  //   hashedOTP,
  //   otpExpiryTime,
  // );

  // await generate2FAOTPService(
  //   userInfo?.id,
  //   temSessionId,
  //   otp,
  //   OTP_TYPE?.LOGIN_VERIFICATION_OTP,
  // );

  await generate2FAOTPService(
    userInfo?.id,
    temSessionId,
    OTP_TYPE?.LOGIN_VERIFICATION_OTP,
    res,
  );

  return res.status(200).json({
    user: userInfo,
    message: "Logged In Successfully",
  });
});

// Logout Controller
const logoutController = async (req, res) => {
  const sessionId = req.cookies["session-id"];

  const status = false;

  const result = await updateRefreshToken(null, sessionId, status);

  clearAuthCookies(res);

  return res.status(201).json({ message: "Logout Successfully" });
};

// Get User
const authoriseController = (req, res) => {
  return res.status(200).json({
    data: req.user,
    message: "User Verification Successfull",
  });
};

// Get Refresh token
const getRefreshToken = asyncHandler(async (req, res) => {
  const cookies = req?.cookies;
  const refreshToken = cookies["refresh-token"];
  const sessionId = cookies["session-id"];

  if (!refreshToken || !sessionId) {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Session expired" });
  }

  const lockKey = `refresh_lock:${sessionId}`;
  const resultKey = `refresh_result:${sessionId}`;
  const lockValue = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const lockStatus = await redisClient.set(
    lockKey,
    lockValue,
    "PX",
    REFRESH_LOCK_TTL_MS,
    "NX",
  );

  if (lockStatus !== "OK") {
    const waitStartTime = Date.now();
    while (Date.now() - waitStartTime < REFRESH_WAIT_TIMEOUT_MS) {
      const cachedResult = await redisClient.get(resultKey);
      if (cachedResult) {
        const parsed = JSON.parse(cachedResult);
        setRefreshCookies(
          res,
          parsed?.sessionId,
          parsed?.token,
          parsed?.refreshToken,
          parsed?.csrfToken,
        );
        return res.status(200).json({
          message: "New Access Token Granted",
          shared: true,
        });
      }

      await sleep(REFRESH_WAIT_INTERVAL_MS);
    }

    return res.status(429).json({
      message: "Token refresh already in progress. Please retry.",
    });
  }

  try {
    const refreshTokenFromDb = await checkRefreshToken(sessionId);

    if (refreshTokenFromDb?.rowCount < 1) {
      const status = false;
      await updateRefreshToken(null, sessionId, status);

      clearAuthCookies(res);

      return res.status(401).json({ message: "Session expired" });
    }

    const isValid = await bcrypt.compare(
      refreshToken,
      refreshTokenFromDb?.rows[0]?.refresh_token,
    );

    if (!isValid) {
      const status = false;
      await updateRefreshToken(null, sessionId, status);
      clearAuthCookies(res);

      return res.status(400).json({ message: "Logged out successfully" });
    }

    const newRefreshToken = generateRefreshToken();
    const hasedRefreshToken = await bcrypt.hash(newRefreshToken, HASHED_SALT);

    const status = true;

    await updateRefreshToken(hasedRefreshToken, sessionId, status);

    const userInfo = refreshTokenFromDb?.rows[0];

    const token = generateToken(
      {
        id: userInfo?.userId,
        email: userInfo?.email,
        profile_photo: userInfo?.profile_photo,
        verified: userInfo?.verified,
      },
      userInfo.jwt_secret,
    );

    const csrfToken = generateCSRFToken(token);

    setRefreshCookies(
      res,
      userInfo?.sessionId,
      token,
      newRefreshToken,
      csrfToken,
    );

    await redisClient.set(
      resultKey,
      JSON.stringify({
        sessionId: userInfo?.sessionId,
        token,
        refreshToken: newRefreshToken,
        csrfToken,
      }),
      "PX",
      REFRESH_WAIT_TIMEOUT_MS,
    );

    return res.status(200).json({
      message: "New Access Token Granted",
      shared: false,
    });
  } finally {
    const lockOwner = await redisClient.get(lockKey);
    if (lockOwner === lockValue) {
      await redisClient.del(lockKey);
    }
  }
});

// Get User Details Controller
const getUserController = asyncHandler(async (req, res) => {
  const user = req?.user;

  if (!user) {
    return res
      .status(400)
      .json({ message: "User is not authorised, please login" });
  }

  const userInfo = await getUserById(user?.id);

  if (!userInfo) {
    return res.status(400).json({ message: "Facing error to get user info" });
  }

  return res.status(200).json({
    userInfo: userInfo?.rows[0],
    message: "User info fetched sussfully",
  });
});

// Update User Details Controller
const updateUserController = asyncHandler(async (req, res) => {
  const user = req?.user;

  if (!user) {
    return res
      .status(400)
      .json({ message: "User is not authorised, please login" });
  }

  try {
    await updateUserInfoSchema.validateAsync(req?.body);
  } catch (error) {
    return res.status(400).json({ message: error?.details[0]?.message });
  }

  const { name, profile_photo } = req?.body;

  const userInfo = await updateUserInfo(user?.id, name, profile_photo);

  if (!userInfo?.rowCount) {
    return res.status(400).json({
      message:
        "Facing error while updating user infomation, please try after sometime",
    });
  }

  return res.status(200).json({
    message: "User info updated successfully",
  });
});

// REDIS FLOW FOR 2FA
// Get OTP Status
const getOtpStatusController = asyncHandler(async (req, res) => {
  const user = req.user;

  const tempSessionId = req.tempSessionId ?? null;

  if (!user && !tempSessionId) {
    clearAuthCookies(res);
    res.clearCookie("temp-session-id");
    return res.status(400).json({
      message: "User is not authorised, please login",
      redirectTo: "/login",
    });
  }

  let screenShow;
  let message;

  const otpAttempts = user?.id
    ? await redisClient.get(`otp_request_count:${user?.id}`)
    : 0;

  let otpData = null;
  if (tempSessionId) {
    const sessionString = await redisClient.get(
      `temp_session:${tempSessionId}`,
    );
    otpData = sessionString ? JSON.parse(sessionString) : null;
  }

  const expiryTime = otpData?.expires_at;

  const timeLeft =
    expiryTime == null
      ? null
      : Math.floor(
          new Date(otpData?.expires_at).getTime() -
            new Date(new Date().toISOString()).getTime(),
        ) /
        1000 /
        60;

  let response = 200;

  const isOTPthere = user?.id ? await redisClient.get(`otp:${user?.id}`) : null;

  if (!isOTPthere) {
    screenShow = "otp";
    message = "";
    response = 200;
  } else {
    switch (true) {
      case timeLeft === null && otpData !== null:
        screenShow = "otp";
        message = "";
        response = 200;
        break;
      case timeLeft >= 0:
        screenShow = "otp";
        message = "";
        response = 200;
        break;
      case timeLeft < 0:
        screenShow = "otp";
        message = "";
        response = 200;
        break;
    }
  }

  const data = {
    ...otpData,
    otp_attempts: otpAttempts,
    screen: screenShow,
    error_message: message,
  };

  return res.status(response).json({
    data,
    message: message,
  });
});

// Verify OTP
const otpVerificationController = asyncHandler(async (req, res) => {
  try {
    await otpVerificationSchema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).json({ message: error?.details[0]?.message });
  }
  const user = req.user;

  const userInfo = (await getUserById(user?.id)).rows[0];

  const tempSessionId = req.tempSessionId ?? null;

  const { otp } = req.body;

  if (!userInfo && !tempSessionId) {
    return res.status(400).json({
      message: "User is not authorised, please login",
      redirectTo: "/login",
    });
  }

  const otpFromDb = userInfo?.id
    ? await redisClient.get(`otp:${userInfo?.id}`)
    : null;
  const otpAttempts = tempSessionId
    ? await redisClient.get(`otp_verify_attempts:${tempSessionId}`)
    : null;

  if (Number(otpAttempts) === 0) {
    if (userInfo?.id) {
      await redisClient.del(`otp:${userInfo?.id}`);
      const cooldownKey = `otp_cooldown:${userInfo?.id}`;
      await redisClient.del(`${cooldownKey}`);
    }
    return res.status(400).json({
      is_otp_active: false,
      can_resend: true,
      screen: "otp",
      message: "Too many otp verification attempts, please generate new otp",
    });
  }

  if (!otpFromDb) {
    return res.status(400).json({
      is_otp_active: false,
      can_resend: true,
      screen: "otp",
      message: "otp is expired, please generate new otp",
    });
  }

  const isOtpValid = await bcrypt.compare(String(otp), otpFromDb);

  if (!isOtpValid) {
    const remainingAttempts = await redisClient.decrby(
      `otp_verify_attempts:${tempSessionId}`,
      1,
    );

    if (remainingAttempts <= 0) {
      if (userInfo?.id) await redisClient.del(`otp:${userInfo?.id}`);
      return res.status(400).json({
        is_otp_active: false,
        can_resend: true,
        screen: "otp",
        message: "Too many otp verification attempts, please generate new otp",
      });
    }

    return res.status(400).json({
      message: "Invalid otp,please enter a valid otp",
    });
  }

  await redisClient.del(`otp:${userInfo?.id}`);

  const refreshToken = generateRefreshToken();

  const hasedRefreshToken = await bcrypt.hash(refreshToken, HASHED_SALT);

  const deviceName =
    req?.headers["sec-ch-ua-platform"]?.replace(/["']/g, "") || "Unknown";

  const ip = req?.ip || req?.socket?.remoteAddress;

  const session = await createSession(
    userInfo?.id,
    deviceName,
    hasedRefreshToken,
    ip,
  );

  const token = generateToken(
    {
      id: userInfo?.id,
      email: userInfo?.email,
      profile_photo: userInfo?.profile_photo,
      verified: userInfo?.verified,
    },
    userInfo?.jwt_secret,
  );

  res.cookie("token", token, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: true,
    sameSite: "lax",

    secure: process.env.NODE_ENV === "production",
  });

  res.cookie("refresh-token", refreshToken, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/auth/refresh-token",
  });

  const sessionId = session?.rows[0]?.session_id;

  res.cookie("session-id", sessionId, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.clearCookie("temp-session-id");

  delete userInfo?.password;
  delete userInfo?.jwt_secret;

  return res.status(200).json({
    accessToken: token,
    user: userInfo,
    redirectTo: "/",
    // message: "Logged In Successfully",
  });
});

// Generate OTP
const generateOtpController = asyncHandler(async (req, res) => {
  const user = req.user;

  const tempSessionId = req.tempSessionId ?? null;

  if (!user && !tempSessionId) {
    return res.status(400).json({
      message: "User is not authorised, please login",
      redirectTo: "/login",
    });
  }

  const otpService = await generate2FAOTPService(
    user?.id,
    tempSessionId,
    OTP_TYPE?.LOGIN_VERIFICATION_OTP,
    res,
  );

  return res.status(200).json({
    data: otpService,
    message: "OTP Generated Successfully",
  });
});

module.exports = {
  registerController,
  loginController,
  logoutController,
  authoriseController,
  getRefreshToken,
  generateOtpController,
  otpVerificationController,
  getUserController,
  updateUserController,
  getOtpStatusController,
  // generateOtp,
  // verifyOtp,
  // otpStatusController,
};
