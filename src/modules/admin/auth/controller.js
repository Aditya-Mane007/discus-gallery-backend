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

  const otp = generateOTP();

  const hashedOTP = await bcrypt.hash(otp.toString(), HASHED_SALT);
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

  // const refreshToken = generateRefreshToken();

  // const hasedRefreshToken = await bcrypt.hash(refreshToken, HASHED_SALT);

  // console.log(req?.ip);

  // const session = await createSession(
  //   user?.id,
  //   deviceName,
  //   hasedRefreshToken,
  //   ip,
  // );

  // const token = generateToken(
  //   {
  //     id: user?.id,
  //     email: user?.email,
  //     profile_photo: user?.profile_photo,
  //     verified: user?.verified,
  //   },
  //   userExists.rows[0].jwt_secret,
  // );

  // res.cookie("token", token, {
  //   maxAge: 3 * 24 * 60 * 60 * 1000,
  //   expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
  //   httpOnly: true,
  //   sameSite: "lax",

  //   secure: process.env.NODE_ENV === "production",
  // });

  // res.cookie("refresh-token", refreshToken, {
  //   maxAge: 3 * 24 * 60 * 60 * 1000,
  //   expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: "lax",
  //   path: "/api/admin/auth/refresh-token",
  // });

  // const sessionId = session?.rows[0]?.session_id;

  // res.cookie("session-id", sessionId, {
  //   maxAge: 3 * 24 * 60 * 60 * 1000,
  //   expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: "lax",
  // });

  // const userInfo = user;

  // delete userInfo?.password;
  // delete userInfo?.jwt_secret;

  // return res.status(200).json({
  //   accessToken: token,
  //   user: userInfo,
  //   redirectTo: "/verify",
  //   message: "Logged In Successfully",
  // });
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

// Get OTP Status
// const getOtpStatusController = asyncHandler(async (req, res) => {
//   const user = req.user;

//   const tempSessionId = req?.tempSessionId;

//   const { otp_type } = req.body;

//   let screenShow;
//   let message;

//   if (!user) {
//     return res
//       .status(400)
//       .json({ message: "User is not authorised, please login" });
//   }

//   const otpData = await getOtpData(user?.id, tempSessionId, otp_type);

//   if (!otpData) {
//     return res.status(400).json({ message: "Unable to fetch otp data" });
//   }

//   if (user?.verified) {
//     const data = {
//       screen: "verified",
//       message: "User is Verified",
//     };
//     return res.status(200).json({
//       data,
//       message: "",
//     });
//   }

//   const screenStatus = otpData?.rows[0];

//   const expiryTime = screenStatus?.otp_expires_at;
//   const timeLeft =
//     expiryTime == null
//       ? null
//       : Math.floor((expiryTime - new Date()) / 1000 / 60);

//   const otpAttempts = Number(await redisClient.get(`otp_attempts:${user?.id}`));

//   const isOTPthere = otpData?.rows[0]?.otp;

//   // 2026-02-02 22:23:36

//   let response = 200;

//   switch (true) {
//     case timeLeft === null && isOTPthere:
//       screenShow = "otp";
//       message = "";
//       response = 200;
//       break;
//     case timeLeft === null:
//       screenShow = "email";
//       message = "";
//       response = 200;
//       break;
//     case timeLeft >= 0:
//       screenShow = "otp";
//       message = "";
//       response = 200;

//       break;
//     case timeLeft < 0:
//       screenShow = "otp";
//       message = "";
//       response = 200;
//       break;
//   }

//   const data = {
//     ...otpData?.rows[0],
//     otp_attempts: otpAttempts,
//     screen: screenShow,
//     error_message: message,
//   };

//   return res.status(response).json({
//     data,
//     message: message,
//   });
// });

// Generate OTP Controller
// const generateOtpController = asyncHandler(async (req, res) => {
//   const user = req?.user;

//   if (!user) {
//     return res
//       .status(401)
//       .json({ message: "User is not authorised, please login" });
//   }

//   let otpAttempts = await redisClient.get(`otp_attempts:${user?.id}`);

//   if (otpAttempts !== null) {
//     if (Number(otpAttempts) === 0) {
//       return res.status(400).json({
//         message:
//           "You have reached the maximum of 3 OTP attempts. try again after 1 hours",
//       });
//     } else {
//       otpAttempts = await redisClient.decrby(`otp_attempts:${user?.id}`, 1);
//       await redisClient.del(`otp_verification_attempts:${user?.id}`);
//     }
//   } else {
//     await redisClient.set(`otp_attempts:${user?.id}`, 2, "EX", 60 * 60, "NX");
//     otpAttempts = 2;
//     await resetOtpStatus(user?.id);
//   }

//   const otp = generateOTP(6);

//   console.log("OTP : ", otp);
//   const otpCreationTime = new Date();
//   const otpExpiryTime = new Date(
//     otpCreationTime.getTime() + OTP_EXPIRY_TIME * 60 * 1000,
//   ).toISOString();

//   const userInfo = await generateOTPQuery(
//     otp,
//     user?.id,
//     otpCreationTime,
//     otpExpiryTime,
//   );

//   if (!userInfo?.rowCount) {
//     return res.status(400).json({ message: "Error Generating OTP" });
//   }

//   const data = {
//     otp_attempts: otpAttempts,
//     otp_created_at: userInfo?.rows[0]?.otp_created_at,
//     screen: "otp",
//   };

//   return res.status(200).json({
//     data,
//     message: "OTP Sent Successfully",
//   });
// });

// Verify OTP Controller
// const otpVerificationController = asyncHandler(async (req, res) => {
//   try {
//     await otpVerificationSchema.validateAsync(req.body);
//   } catch (error) {
//     return res.status(400).json({ message: error?.details[0]?.message });
//   }

//   const user = req?.user;

//   if (!user) {
//     return res
//       .status(401)
//       .json({ message: "User is not authorised, please login" });
//   }

//   const otpVerificationAttempts = await redisClient.get(
//     `otp_verification_attempts:${user?.id}`,
//   );

//   if (otpVerificationAttempts) {
//     if (Number(otpVerificationAttempts) === 0) {
//       await resetOtpStatus(user?.id);
//       return res.status(400).json({
//         message: "Too many attempts, please generate new otp",
//       });
//     }
//   } else {
//     await redisClient.set(
//       `otp_verification_attempts:${user?.id}`,
//       2,
//       "EX",
//       60 * 5,
//     );
//   }

//   const { otp } = req?.body;

//   // For updating veified status by checking expiration time and otp in single query
//   // const otpVerification = await otpVerificationQuery(user?.id, otp);

//   const otpFromDb = await getOTPQuery(user?.id);

//   if (otpFromDb.rowCount < 1) {
//     return res.status(400).json({
//       message: "OTP verification failed, kindly generate otp",
//     });
//   }

//   const dbOTP = otpFromDb?.rows[0]?.otp;
//   const otpCreationTime = new Date();
//   const otpExpirationTime = otpFromDb?.rows[0]?.otp_expires_at;

//   const isExpired =
//     otpCreationTime.getTime() > new Date(otpExpirationTime).getTime();

//   if (isExpired) {
//     return res.status(400).json({ message: "OTP is expired" });
//   }

//   if (Number(otp) !== Number(dbOTP)) {
//     await redisClient.decrby(`otp_verification_attempts:${user?.id}`, 1);
//     return res.status(400).json({ message: "Invalid OTP" });
//   }

//   const userVerification = await updateVerifiedStatusQuery(user?.id);

//   if (userVerification.rowCount < 1) {
//     return res.status(400).json({
//       message: "OTP Vefication failed, please try again after sometime",
//     });
//   }

//   await redisClient.del(
//     `otp_verification_attempts:${user?.id}`,
//     `otp_attempts:${user?.id}`,
//   );

//   return res.status(200).json({
//     data: {
//       screen: "verified",
//       message: "OTP verification successful",
//     },
//   });
// });

// Reset Password Controller
// Options :
// Option 1 : Send Reset Password link and ask for the secret word, asked during the registration.
// Option 2 : Send Email to Recovery email.
// Option 3 : Send OTP on phone number or email address(registered email address)
// Option 4 : Add All the above

// const sendEmail = asyncHandler(
//   async (userId, otpType, otp, otpHash, expiresAt, email) => {
//     await send(email, otp);
//     const query = {
//       name: "create-temp-session",
//       text: `INSERT INTO ${TABLE_SCHEMA?.ADMIN_TEMP_SESSION}(user_id,otp_type,otp_hash,expires_at) VALUES($1,$2,$3,$4)`,
//       values: [userId, otpType, otpHash, expiresAt],
//     };

//     const result = await pool.query(query);

//     console.log(result);
//   },
// );

// const otpStatusController = asyncHandler(async (req, res) => {
//   const user = req.user;

//   // console.log("USER ID : ", user);
//   const tempSessionId = req.tempSessionId ?? null;

//   const { otp_type } = req.body;

//   // const tempSessionId = req?.cookies?.["temp-session-id"] ?? null;

//   let screenShow;
//   let message;

//   if (!user) {
//     return res
//       .status(400)
//       .json({ message: "User is not authorised, please login" });
//   }

//   const otpData = await getOtpData(user?.id, tempSessionId, otp_type);

//   if (!otpData) {
//     return res.status(400).json({ message: "Unable to fetch otp data" });
//   }

//   if (user?.verified) {
//     const data = {
//       screen: "verified",
//       message: "User is Verified",
//     };
//     return res.status(200).json({
//       data,
//       message: "",
//     });
//   }

//   const screenStatus = otpData?.rows[0];

//   const expiryTime = screenStatus?.expires_at;
//   const timeLeft =
//     expiryTime == null
//       ? null
//       : Math.floor((expiryTime - new Date()) / 1000 / 60);

//   const otpAttempts = Number(
//     await redisClient.get(`${otp_type}_attempts:${user?.id}`),
//   );

//   const isOTPthere = otpData?.rows[0]?.otp_hash;

//   // 2026-02-02 22:23:36

//   let response = 200;

//   switch (true) {
//     case timeLeft === null && isOTPthere:
//       screenShow = "otp";
//       message = "";
//       response = 200;
//       break;
//     case timeLeft === null:
//       screenShow = "email";
//       message = "";
//       response = 200;
//       break;
//     case timeLeft >= 0:
//       screenShow = "otp";
//       message = "";
//       response = 200;

//       break;
//     case timeLeft < 0:
//       screenShow = "otp";
//       message = "";
//       response = 200;
//       break;
//   }

//   const data = {
//     ...otpData?.rows[0],
//     otp_attempts: otpAttempts,
//     screen: screenShow,
//     error_message: message,
//   };

//   return res.status(response).json({
//     data,
//     message: message,
//   });
// });

// // const generateOtp = asyncHandler(async (req, res) => {
// //   const user = req?.user;
// //   const tempSessionId = req.tempSessionId ?? null;

// //   const { otp_type } = req.body;

// //   // const tempSessionId = req?.cookies?.["temp-session-id"] ?? null;

// //   if (!user) {
// //     return res
// //       .status(401)
// //       .json({ message: "User is not authorised, please login" });
// //   }

// //   let otpAttempts = await redisClient.get(`${otp_type}_attempts:${user?.id}`);

// //   if (otpAttempts !== null) {
// //     if (Number(otpAttempts) === 0) {
// //       return res.status(400).json({
// //         message:
// //           "You have reached the maximum of 3 OTP attempts. try again after 1 hours",
// //       });
// //     } else {
// //       otpAttempts = await redisClient.decrby(
// //         `${otp_type}_attempts:${user?.id}`,
// //         1,
// //       );
// //       await redisClient.del(`${otp_type}_verification_attempts:${user?.id}`);
// //     }
// //   } else {
// //     await redisClient.set(
// //       `${otp_type}_attempts:${user?.id}`,
// //       2,
// //       "EX",
// //       60 * 60,
// //       "NX",
// //     );
// //     otpAttempts = 2;
// //     await resetOtpStatus(user?.id);
// //   }

// //   const otp = generateOTP(6);

// //   const hashedOTP = await bcrypt.hash(otp.toString(), HASHED_SALT);
// //   const otpCreationTime = new Date();
// //   const otpExpiryTime = new Date(
// //     otpCreationTime.getTime() + config.OTP_CONFIG[otp_type].expiry * 1000,
// //   ).toISOString();

// //   const userInfo = await generateOTPQuery(
// //     user?.id,
// //     tempSessionId,
// //     otp_type,
// //     hashedOTP,
// //     otpExpiryTime,
// //   );

// //   if (!userInfo?.rowCount) {
// //     return res.status(400).json({ message: "Error Generating OTP" });
// //   }

// //   const data = {
// //     otp_attempts: otpAttempts,
// //     otp_created_at: userInfo?.rows[0]?.otp_created_at,
// //     screen: "otp",
// //   };

// //   return res.status(200).json({
// //     data,
// //     message: "OTP Sent Successfully",
// //   });
// // });

// const verifyOtp = asyncHandler(async (req, res) => {
//   try {
//     await otpVerificationSchema.validateAsync(req.body);
//   } catch (error) {
//     return res.status(400).json({ message: error?.details[0]?.message });
//   }

//   const user = req?.user;
//   const tempSessionId = req.tempSessionId ?? null;

//   const { otp_type, otp } = req?.body;

//   // const tempSessionId = req?.cookies?.["temp-session-id"] ?? null;

//   if (!user) {
//     return res
//       .status(401)
//       .json({ message: "User is not authorised, please login" });
//   }

//   const otpVerificationAttempts = await redisClient.get(
//     `${otp_type}_verification_attempts:${user?.id}`,
//   );

//   if (otpVerificationAttempts) {
//     if (Number(otpVerificationAttempts) === 0) {
//       await resetOtpStatus(user?.id);
//       return res.status(400).json({
//         message: "Too many attempts, please generate new otp",
//       });
//     }
//   } else {
//     await redisClient.set(
//       `${otp_type}_verification_attempts:${user?.id}`,
//       2,
//       "EX",
//       60 * 5,
//     );
//   }

//   // For updating veified status by checking expiration time and otp in single query

//   // const otpVerification = await otpVerificationQuery(user?.id, otp);

//   const otpFromDb = await getOTPQuery(user?.id, tempSessionId, otp_type);

//   if (!otpFromDb || otpFromDb.rowCount < 1) {
//     return res.status(400).json({
//       message: "OTP verification failed, kindly generate otp",
//     });
//   }

//   const dbOTP = otpFromDb?.rows[0]?.otp_hash;
//   const otpCreationTime = new Date();
//   const otpExpirationTime = otpFromDb?.rows[0]?.expires_at;

//   const isExpired =
//     otpCreationTime.getTime() > new Date(otpExpirationTime).getTime();

//   if (isExpired) {
//     return res.status(400).json({ message: "OTP is expired" });
//   }

//   const isMatch = await bcrypt.compare(otp.toString(), dbOTP);

//   if (!isMatch) {
//     await redisClient.decrby(
//       `${otp_type}_verification_attempts:${user?.id}`,
//       1,
//     );

//     return res.status(400).json({ message: "Invalid OTP" });
//   }

//   const userVerification = await updateVerifiedStatusQuery(user?.id);

//   if (userVerification.rowCount < 1) {
//     return res.status(400).json({
//       message: "OTP Vefication failed, please try again after sometime",
//     });
//   }

//   await redisClient.del(
//     `${otp_type}_verification_attempts:${user?.id}`,
//     `${otp_type}_attempts:${user?.id}`,
//   );

//   const userInfoDb = await getUserById(user?.id);
//   const userInfo = userInfoDb?.rows[0];

//   const deviceName =
//     req?.headers["sec-ch-ua-platform"]?.replace(/["']/g, "") || "Unknown";
//   const ip = req?.ip || req?.socket?.remoteAddress;

//   const refreshToken = generateRefreshToken();
//   const hasedRefreshToken = await bcrypt.hash(refreshToken, HASHED_SALT);

//   const session = await createSession(
//     user?.id,
//     deviceName,
//     hasedRefreshToken,
//     ip,
//   );

//   const token = generateToken(
//     {
//       id: userInfo?.id,
//       email: userInfo?.email,
//       profile_photo: userInfo?.profile_photo,
//       verified: userInfo?.verified,
//     },
//     userInfo.jwt_secret,
//   );

//   res.cookie("token", token, {
//     maxAge: 3 * 24 * 60 * 60 * 1000,
//     expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
//     httpOnly: true,
//     sameSite: "lax",
//     secure: process.env.NODE_ENV === "production",
//   });

//   res.cookie("refresh-token", refreshToken, {
//     maxAge: 3 * 24 * 60 * 60 * 1000,
//     expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: "/api/admin/auth/refresh-token",
//   });

//   const sessionId = session?.rows[0]?.session_id;

//   res.cookie("session-id", sessionId, {
//     maxAge: 3 * 24 * 60 * 60 * 1000,
//     expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//   });

//   const csrfToken = generateCSRFToken(token);

//   res.cookie("XSRF-TOKEN", csrfToken, {
//     maxAge: 3 * 24 * 60 * 60 * 1000,
//     expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
//     httpOnly: false,
//     sameSite: "lax",
//     secure: process.env.NODE_ENV === "production",
//   });

//   res.clearCookie("temp-session-id");

//   const userInfoResponse = { ...userInfo };
//   delete userInfoResponse?.password;
//   delete userInfoResponse?.jwt_secret;

//   return res.status(200).json({
//     data: {
//       screen: "verified",
//       message: "OTP verification successful",
//       user: userInfoResponse,
//       accessToken: token,
//     },
//   });
// });

// REDIS FLOW FOR 2FA

// Get OTP Status
const getOtpStatusController = asyncHandler(async (req, res) => {
  const user = req.user;

  const tempSessionId = req.tempSessionId ?? null;

  if (!user && !tempSessionId) {
    return res
      .status(400)
      .json({ message: "User is not authorised, please login" });
  }

  let screenShow;
  let message;

  const otpAttempts = await redisClient.get(`otp_request_count:${user?.id}`);

  const otpData = JSON.parse(
    await redisClient.get(`temp_session:${tempSessionId}`),
  );

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

  //  (await redisClient.get(`otp:${user?.id}`)) !== null
  switch (true) {
    case timeLeft === null:
      screenShow = "otp";
      message = "";
      response = 200;
      break;
    case timeLeft === null:
      screenShow = "email";
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

  const tempSessionId = req.tempSessionId ?? null;

  const { otp } = req.body;

  if (!user && !tempSessionId) {
    return res
      .status(400)
      .json({ message: "User is not authorised, please login" });
  }

  const otpFromDb = await redisClient.get(`otp:${user?.id}`);
  const otpAttempts = await redisClient.get(
    `otp_verify_attempts:${tempSessionId}`,
  );

  console.log("otpFromDb : ", otpFromDb);

  if (Number(otpAttempts) === 0) {
    return res.status(400).json({
      is_otp_expired: false,
      message: "Too many otp verification attempts, please generate new otp",
    });
  }

  if (!otpFromDb) {
    return res.status(400).json({
      is_otp_expired: false,
      message: "otp is expired, please generate new otp",
    });
  }

  const isOtpValid = await bcrypt.compare(otp, otpFromDb);

  if (!isOtpValid) {
    await redisClient.decrby(`otp_verify_attempts:${tempSessionId}`, 1);
    return res.status(400).json({
      message: "Invalid otp,please enter a valid otp",
    });
  }

  const refreshToken = generateRefreshToken();

  const hasedRefreshToken = await bcrypt.hash(refreshToken, HASHED_SALT);

  const deviceName =
    req?.headers["sec-ch-ua-platform"]?.replace(/["']/g, "") || "Unknown";

  const ip = req?.ip || req?.socket?.remoteAddress;

  const session = await createSession(
    user?.id,
    deviceName,
    hasedRefreshToken,
    ip,
  );

  const token = generateToken(
    {
      id: user?.id,
      email: user?.email,
      profile_photo: user?.profile_photo,
      verified: user?.verified,
    },
    user?.jwt_secret,
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

  const userInfo = user;

  delete userInfo?.password;
  delete userInfo?.jwt_secret;

  return res.status(200).json({
    accessToken: token,
    user: userInfo,
    message: "Logged In Successfully",
  });
});

// Generate OTP
const generateOtpController = asyncHandler(async (req, res) => {
  const user = req.user;

  const tempSessionId = req.tempSessionId ?? null;

  if (!user && !tempSessionId) {
    return res
      .status(400)
      .json({ message: "User is not authorised, please login" });
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
