const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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
  getMeById,
} = require('./repository.js');
const {
  generateCSRFToken,
  generateToken,
  generateOTP,
  generateJWTSecret,
  generateRefreshToken,
  generateTempSessionToken,
  generateUUID,
} = require('../../../utils/utils.js');
const {
  registerSchema,
  loginSchema,
  otpVerificationSchema,
  updateUserInfoSchema,
  resetPasswordSchema,
} = require('./validation.js');
const redisClient = require('../../../services/redisClient.js');
const {
  OTP_EXPIRY_TIME,
  HASHED_SALT,
  clearAuthCookies,
  OTP_TYPE,
  PRE_AUTH_ATTEMPTS,
  PRE_AUTH_ATTEMPTS_EXPIRY,
  OTP_ATTEMPTS,
  OTP_VERIFICATION_ATTEMPTS,
  TEMP_SESSION_COOKIE,
  TEMP_CSRF_COOKIE,
  ACTUAL_TOKEN_COOKIE,
  ACTUAL_CSRF_COOKIE,
  ACTUAL_REFRESH_TOKEN_COOKIE,
  ACTUAL_SESSION_EXPIRTY_TIME,
} = require('../../../utils/constant.js');
const { config } = require('../../../config/config.js');
const {
  generateOTPService,
  generate2FAOTPService,
} = require('../../../services/service.js');

dotenv.config();

const REFRESH_LOCK_TTL_MS = 5000;
const REFRESH_WAIT_TIMEOUT_MS = 5000;
const REFRESH_WAIT_INTERVAL_MS = 150;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setRefreshCookies = (res, token, refreshToken, csrfToken) => {
  console.log('SET TOKEN : ', token);
  console.log('SET REF TOKEN : ', refreshToken);
  console.log('SET CSRF TOKEN : ', csrfToken);

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ACTUAL_SESSION_EXPIRTY_TIME,
    expires: new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME),
  });

  res.cookie('refresh-token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin/auth/refresh-token',
    maxAge: ACTUAL_SESSION_EXPIRTY_TIME,
    expires: new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME),
  });

  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ACTUAL_SESSION_EXPIRTY_TIME,
    expires: new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME),
  });
};

// Register Controller - NEEDS REFACTORING
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
      .json({ message: 'User already exists, please login' });
  }

  const jwtSecret = generateJWTSecret();

  const hashpassword = await bcrypt.hash(password, HASHED_SALT);

  const refreshToken = generateRefreshToken();

  const hasedRefreshToken = await bcrypt.hash(refreshToken, HASHED_SALT);

  const user = await createUser(name, email, hashpassword, jwtSecret);

  const deviceName =
    req?.headers['sec-ch-ua-platform']?.replace(/["']/g, '') || 'Unknown';

  const session = await createSession(user?.id, deviceName, hasedRefreshToken);

  if (!user) {
    return res.status(500).json({
      message: 'Something went wrong, please try again later',
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

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.cookie('refresh-token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin/auth/refresh-token',
  });

  const sessionId = session?.rows[0]?.session_id;

  const csrfToken = generateCSRFToken(token);
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return res.status(201).json({
    accessToken: token,
    user: user,
    message: 'User Registered Successfully',
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
      .json({ message: 'User does not exists, please register' });
  }

  const checkPassword = await bcrypt.compare(
    password,
    userExists.rows[0].password_hash,
  );

  const preauthAttemptCount = await redisClient.get(
    `preauth:attempts:${userExists.rows[0]?.email}`,
  );

  if (preauthAttemptCount !== null && Number(preauthAttemptCount) <= 0) {
    return res.status(400).json({
      message:
        'You have reached the maximum number of login attempts. Try again after 1 hour.',
    });
  }

  if (!checkPassword) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  if (preauthAttemptCount !== null && Number(preauthAttemptCount) > 0) {
    await redisClient.decrby(
      `preauth:attempts:${userExists.rows[0]?.email}`,
      1,
    );
  }

  const user = userExists.rows[0];

  const tempSessionSecret = await generateJWTSecret();
  const tempSessionId = await generateUUID();
  const preauth_attempts_remaining = PRE_AUTH_ATTEMPTS - 1;
  const otp = await generateOTP();

  console.log(`LOGIN OTP FOR ${user?.email} : `, otp);
  const otp_attempts = OTP_ATTEMPTS - 1;
  const otp_verification_attempts = OTP_VERIFICATION_ATTEMPTS;

  const can_resend_in = new Date().getTime() + 30 * 1000;

  const hashedOTP = await bcrypt.hash(otp.toString(), HASHED_SALT);

  const token = generateTempSessionToken(
    {
      user_id: user?.user_id,
      temp_session_id: tempSessionId,
    },
    tempSessionSecret,
  );

  const preauthattemptsKey = `preauth:attempts:${user?.email}`;

  const preauthData = {
    user_id: user?.user_id,
    otp_hashed: hashedOTP,
    temp_session_secret: tempSessionSecret,
    otp_attempts: otp_attempts,
    can_resend_in: can_resend_in,
    otp_verifiy_attempts: otp_verification_attempts,
    created_at: Date.now(),
  };

  const preauthredisKey = await redisClient.set(
    `preauth:${tempSessionId}`,
    JSON.stringify(preauthData),
    'EX',
    OTP_EXPIRY_TIME,
  );

  await redisClient.set(
    preauthattemptsKey,
    preauth_attempts_remaining,
    'EX',
    PRE_AUTH_ATTEMPTS_EXPIRY,
    'NX',
  );

  res.cookie('temp-session-id', token, {
    maxAge: TEMP_SESSION_COOKIE,
    expires: new Date(Date.now() + TEMP_SESSION_COOKIE),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  const csrfToken = generateCSRFToken(token);

  res.cookie('XSRF-TOKEN', csrfToken, {
    maxAge: TEMP_CSRF_COOKIE,
    expires: new Date(Date.now() + TEMP_CSRF_COOKIE),
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return res.status(200).json({
    redirectTo: '/verify',
    message: 'Logged In Successfully',
  });
});

// Logout Controller - NEEDS REFACTORING
const logoutController = async (req, res) => {
  const sessionId = req.cookies['session-id'];

  const status = false;

  const result = await updateRefreshToken(null, sessionId, status);

  clearAuthCookies(res);

  return res.status(201).json({ message: 'Logout Successfully' });
};

// Get User
const authoriseController = async (req, res) => {
  console.log('REQ USER : ', req.user);

  if (!req.user) {
    res.status(401).json({
      message: 'User is not authorised, please login',
    });
  }

  const user = await getMeById(req?.user);

  const userData = user?.rows[0];

  console.log('USER DATA : ', user);

  const orgData = (user?.rows || []).map((data) => ({
    organization_membership_id: data?.organization_membership_id,
    organization_id: data?.organization_id,
    logo: data?.logo_url,
    name: data?.name,
    is_owner: data?.is_owner,
  }));

  const userInfo = {
    user_id: userData?.user_id,
    name: userData?.name,
    email: userData?.email,
    profile_photo_url: userData?.profile_photo_url,
    orgData: orgData || [],
  };
  return res.status(200).json({
    data: { ...userInfo },
    message: 'User Verification Successfull',
  });
};

// Get Refresh token - NEEDS REFACTORING
const getRefreshToken = asyncHandler(async (req, res) => {
  const cookies = req?.cookies;
  const token = req?.cookies['token'];
  const refreshToken = cookies['refresh-token'];
  const decodedToken = jwt.decode(token, { complete: true });

  console.log('DECODED TOKEN FOR REFRESH : ', decodedToken);

  const sessionId = decodedToken?.payload?.session_id;
  const membershipId = decodedToken?.payload?.membeship_id;

  console.log('REFRESH TOKEN : ', refreshToken);
  console.log('SESSION ID : ', sessionId);
  console.log('SESSION ID : ', sessionId);

  if (!refreshToken || !sessionId) {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Session expired' });
  }

  const lockKey = `refresh_lock:${sessionId}`;
  const resultKey = `refresh_result:${sessionId}`;
  const lockValue = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const lockStatus = await redisClient.set(
    lockKey,
    lockValue,
    'PX',
    REFRESH_LOCK_TTL_MS,
    'NX',
  );

  if (lockStatus !== 'OK') {
    const waitStartTime = Date.now();
    while (Date.now() - waitStartTime < REFRESH_WAIT_TIMEOUT_MS) {
      const cachedResult = await redisClient.get(resultKey);
      if (cachedResult) {
        const parsed = JSON.parse(cachedResult);
        setRefreshCookies(
          res,
          parsed?.token,
          parsed?.refreshToken,
          parsed?.csrfToken,
        );
        return res.status(200).json({
          message: 'New Access Token Granted',
          shared: true,
        });
      }

      await sleep(REFRESH_WAIT_INTERVAL_MS);
    }

    return res.status(429).json({
      message: 'Token refresh already in progress. Please retry.',
    });
  }

  try {
    const refreshTokenFromDb = await checkRefreshToken(sessionId);

    console.log('REFRESH TOKEN FROM DB : ', refreshTokenFromDb);

    if (refreshTokenFromDb?.rowCount < 1) {
      const status = false;
      await updateRefreshToken(null, sessionId, status);

      clearAuthCookies(res);

      return res.status(401).json({ message: 'Session expired DB' });
    }

    const storedRefreshToken = refreshTokenFromDb?.rows[0]?.refresh_token;
    const isValid = await bcrypt.compare(refreshToken, storedRefreshToken);

    if (!isValid) {
      const status = false;
      await updateRefreshToken(null, sessionId, status);
      clearAuthCookies(res);

      return res.status(400).json({ message: 'Logged out successfully' });
    }

    const newRefreshToken = generateRefreshToken();
    const hasedRefreshToken = await bcrypt.hash(newRefreshToken, HASHED_SALT);

    const status = true;

    await updateRefreshToken(hasedRefreshToken, sessionId, status);

    const userInfo = refreshTokenFromDb?.rows[0];

    const token = generateToken(
      {
        user_id: userInfo?.user_id,
        email: userInfo?.email,
        profile_photo_url: userInfo?.profile_photo_url,
        session_id: sessionId,
        membeship_id: membershipId,
      },
      userInfo.jwt_secret,
    );

    const csrfToken = generateCSRFToken(token);

    setRefreshCookies(res, token, newRefreshToken, csrfToken);

    await redisClient.set(
      resultKey,
      JSON.stringify({
        sessionId: userInfo?.sessionId,
        token,
        refreshToken: newRefreshToken,
        csrfToken,
      }),
      'PX',
      REFRESH_WAIT_TIMEOUT_MS,
    );

    return res.status(200).json({
      message: 'New Access Token Granted',
      shared: false,
    });
  } finally {
    const lockOwner = await redisClient.get(lockKey);
    if (lockOwner === lockValue) {
      await redisClient.del(lockKey);
    }
  }
});

// REDIS FLOW FOR 2FA
// Get OTP Status
const getOtpStatusController = asyncHandler(async (req, res) => {
  const user = req.user;

  const tempSessionId = req.tempSessionId ?? null;

  if (!user && !tempSessionId) {
    clearAuthCookies(res);
    res.clearCookie('temp-session-id');
    return res.status(401).json({
      message: 'User is not authorised, please login',
      redirectTo: '/login',
    });
  }

  const tempSession = await redisClient.get(`preauth:${tempSessionId}`);

  const tempSessionData = JSON.parse(tempSession);

  delete tempSessionData?.otp_hashed;
  delete tempSessionData?.temp_session_secret;

  return res.status(200).json({
    data: {
      ...tempSessionData,
    },
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

  if (!user && !tempSessionId) {
    return res.status(401).json({
      message: 'Login Session Expired, kindly login again',
      redirectTo: '/login',
    });
  }

  const tempSessionData = await redisClient.get(`preauth:${tempSessionId}`);

  const parasedTempSessionData = JSON.parse(tempSessionData);

  if (Number(parasedTempSessionData?.otp_verifiy_attempts < 1)) {
    const preauthData = {
      user_id: user,
      otp_hashed: parasedTempSessionData?.otp_hashed,
      temp_session_secret: parasedTempSessionData?.temp_session_secret,
      otp_attempts: parasedTempSessionData?.otp_attempts,
      can_resend_in: true,
      otp_verifiy_attempts:
        Number(parasedTempSessionData?.otp_verifiy_attempts) - 1,
    };

    const preauthredisKey = await redisClient.set(
      `preauth:${tempSessionId}`,
      JSON.stringify(preauthData),
      'KEEPTTL',
      'XX',
    );

    return res.status(400).json({
      message: 'Too many otp verify attempts, please generate',
    });
  }

  const { otp } = req.body;

  if (!(await bcrypt.compare(otp, parasedTempSessionData?.otp_hashed))) {
    const preauthData = {
      user_id: user,
      otp_hashed: parasedTempSessionData?.otp_hashed,
      temp_session_secret: parasedTempSessionData?.temp_session_secret,
      otp_attempts: parasedTempSessionData?.otp_attempts,
      can_resend_in: parasedTempSessionData?.can_resend_in,
      otp_verifiy_attempts:
        Number(parasedTempSessionData?.otp_verifiy_attempts) - 1,
    };

    const preauthredisKey = await redisClient.set(
      `preauth:${tempSessionId}`,
      JSON.stringify(preauthData),
      'EX',
      OTP_EXPIRY_TIME,
      'XX',
    );

    return res.status(400).json({
      message: 'Invalid or Expired OTP',
    });
  }

  const deviceName =
    req?.headers['sec-ch-ua-platform']?.replace(/["']/g, '') || 'Unknown';

  const ip = req?.ip || req?.socket?.remoteAddress;

  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = await bcrypt.hash(refreshToken, HASHED_SALT);

  const expires_at = new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME);

  const session = await createSession(
    req.user,
    deviceName,
    ip,
    deviceName,
    hashedRefreshToken,
    expires_at,
  );

  const sessionId = session?.rows[0]?.session_id;
  const userInfo = (await getUserById(user, sessionId)).rows[0];

  const token = generateToken(
    {
      user_id: req.user,
      email: userInfo?.email,
      profile_photo_url: userInfo?.profile_photo_url,
      session_id: userInfo?.session_id,
      membeship_id: userInfo?.organization_membership_id,
    },
    userInfo?.jwt_secret,
  );

  const csrfToken = generateCSRFToken(token);

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ACTUAL_SESSION_EXPIRTY_TIME,
    expires: new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME),
  });

  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ACTUAL_SESSION_EXPIRTY_TIME,
    expires: new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME),
  });

  res.cookie('refresh-token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin/auth/refresh-token',
    maxAge: ACTUAL_SESSION_EXPIRTY_TIME,
    expires: new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME),
  });

  res.clearCookie('temp-session-id');

  return res.status(200).json({
    redirectTo: '/iam/users',
  });
});

// Generate OTP
const generateOtpController = asyncHandler(async (req, res) => {
  const user = req.user;

  const tempSessionId = req.tempSessionId ?? null;

  if (!user && !tempSessionId) {
    return res.status(401).json({
      message: 'Login Session Expired, kindly login again',
      redirectTo: '/login',
    });
  }

  const tempSessionData = await redisClient.get(`preauth:${tempSessionId}`);

  const parasedTempSessionData = JSON.parse(tempSessionData);

  if (Number(parasedTempSessionData?.otp_attempts) < 1) {
    return res.status(400).json({
      message: 'You have reached the maximum number of OTP resend attempts.',
    });
  }

  const otp = await generateOTP();

  const can_resend_in = new Date().getTime() + 30 * 1000;

  const hashedOTP = await bcrypt.hash(otp.toString(), HASHED_SALT);

  const preauthData = {
    user_id: user,
    otp_hashed: hashedOTP,
    temp_session_secret: parasedTempSessionData?.temp_session_secret,
    otp_attempts: Number(parasedTempSessionData?.otp_attempts) - 1,
    can_resend_in: can_resend_in,
    otp_verifiy_attempts: OTP_VERIFICATION_ATTEMPTS,
  };

  const preauthredisKey = await redisClient.set(
    `preauth:${tempSessionId}`,
    JSON.stringify(preauthData),
    'EX',
    OTP_EXPIRY_TIME,
    'XX',
  );

  return res.status(200).json({
    message: 'OTP Generated Successfully',
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

  getOtpStatusController,
  // generateOtp,
  // verifyOtp,
  // otpStatusController,
};
