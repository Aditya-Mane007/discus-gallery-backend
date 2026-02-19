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
} = require("../../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const {
  generateCSRFToken,
  generateToken,
  decryptPayload,
  encryptPayload,
  generateOTP,
  send,
} = require("../../utils/utils");
const {
  registerSchema,
  loginSchema,
  otpVerificationSchema,
  updateUserInfoSchema,
  resetPasswordSchema,
} = require("../../schema/authSchema");
const redisClient = require("../../services/redisClient");
const { OTP_EXPIRY_TIME } = require("../../utils/constant");
dotenv.config();

// Register Controller
const registerController = asyncHandler(async (req, res) => {
  try {
    await registerSchema.validateAsync(req.body);
  } catch (error) {
    res.status(400).json({ message: error?.details[0]?.message });
  }

  const { email, password, name } = req.body;

  const useExists = await checkIfUsersExists(email);

  if (useExists) {
    res.status(400).json({ message: "User already exists, please login" });
  }

  const hashpassword = await bcrypt.hash(password, 10);

  const user = await createUser(name, email, hashpassword);

  if (!user) {
    res.status(500).json({
      message: "Something went wrong, please try again later",
    });
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    profile_photo: user.profile_photo,
    verified: user.verified,
  });

  res.cookie("token", token, {
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.status(201).json({
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
    res.status(400);
    throw new Error(error?.details[0]?.message);
  }

  const { email, password } = req.body;

  const userExists = await getUserByEmail(email);

  if (userExists.rowCount < 1) {
    res.status(400).json({ message: "User does not exists, please register" });
  }

  const checkPassword = await bcrypt.compare(
    password,
    userExists.rows[0].password,
  );

  if (!checkPassword) {
    res.status(400).json({ message: "Invalid credentials" });
  }

  const user = userExists.rows[0];

  const token = generateToken({
    id: user?.id,
    email: user?.email,
    profile_photo: user?.profile_photo,
    verified: user?.verified,
  });

  res.cookie("token", token, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: true,
    sameSite: "strict",
    domain: "localhost",
    secure: process.env.NODE_ENV === "production",
  });

  const csrfToken = generateCSRFToken(token);

  res.cookie("XSRF-TOKEN", csrfToken, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    httpOnly: false,
    domain: "localhost",
    secure: process.env.NODE_ENV === "production",
  });

  const userInfo = user;
  delete userInfo.password;
  res.status(200).json({
    accessToken: token,
    user: userInfo,
    message: "Logged In Successfully",
  });
});

// Logout Controller
const logoutController = (req, res) => {
  const user = req?.user;

  if (!user) {
    res.status(401).json({ message: "User is not authorised" });
  }
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    domain: "localhost",
    secure: process.env.NODE_ENV === "production",
  });

  res.clearCookie("XSRF-TOKEN", {
    httpOnly: false,
    domain: "localhost",
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({ message: "Logged out successfully" });
};

// Get User
const authoriseController = (req, res) => {
  res.status(200).json({
    data: req.user,
    message: "User Verification Successfull",
  });
};

// Generate OTP Controller
const generateOtpController = asyncHandler(async (req, res) => {
  const user = req?.user;

  if (!user) {
    res.status(401).json({ message: "User is not authorised, please login" });
  }

  let otpAttempts = await redisClient.get(`otp_attempts:${user?.id}`);

  console.log("otpAttempts : ", otpAttempts);

  if (otpAttempts !== null) {
    if (Number(otpAttempts) === 0) {
      res.status(400).json({
        message:
          "You have reached the maximum of 3 OTP attempts. try again after 1 hours",
      });
      return;
    } else {
      otpAttempts = await redisClient.decrby(`otp_attempts:${user?.id}`, 1);
    }
  } else {
    otpAttempts = await redisClient.set(
      `otp_attempts:${user?.id}`,
      2,
      "EX",
      60 * 60,
    );
    await redisClient.expire(`otp_verification_attempts:${user?.id}`, 0, "NX");
  }

  const otp = generateOTP(6);
  const otpCreationTime = new Date();
  const otpExpiryTime = new Date(
    otpCreationTime.getTime() + OTP_EXPIRY_TIME * 60 * 1000,
  ).toISOString();

  const userInfo = await generateOTPQuery(
    otp,
    user?.id,
    otpCreationTime,
    otpExpiryTime,
  );

  if (!userInfo?.rowCount) {
    res.status(400).json({ message: "Error Generating OTP" });
  }

  const data = {
    otp_attempts: otpAttempts,
    otp_created_at: userInfo?.rows[0]?.otp_created_at,
    screen: "otp",
  };

  console.log("DATA : ", data);

  res.status(200).json({
    data,
    message: "OTP Sent Successfully",
  });
});

// Verify OTP Controller
const otpVerificationController = asyncHandler(async (req, res) => {
  try {
    await otpVerificationSchema.validateAsync(req.body);
  } catch (error) {
    res.status(400).json({ message: error?.details[0]?.message });
  }

  const user = req?.user;

  if (!user) {
    res.status(400).json({ message: "User is not authorised, please login" });
  }

  const otpVerificationAttempts = await redisClient.get(
    `otp_verification_attempts:${user?.id}`,
  );

  if (otpVerificationAttempts) {
    if (Number(otpVerificationAttempts) === 0) {
      res.status(400).json({
        message: "Too many attempts, please generate new otp",
      });
      return;
    } else {
      await redisClient.decrby(`otp_verification_attempts:${user?.id}`, 1);
    }
  } else {
    await redisClient.set(
      `otp_verification_attempts:${user?.id}`,
      2,
      "EX",
      60 * 5,
    );
  }

  const { otp } = req?.body;

  // For updating veified status by checking expiration time and otp in single query
  // const otpVerification = await otpVerificationQuery(user?.id, otp);

  const otpFromDb = await getOTPQuery(user?.id);

  if (otpFromDb.rowCount < 1) {
    res.status(400).json({
      message: "OTP verification failed, kindly generate otp",
    });
  }

  const dbOTP = otpFromDb?.rows[0]?.otp;
  const otpCreationTime = new Date();
  const otpExpirationTime = otpFromDb?.rows[0]?.otp_expires_at;

  const minDiff =
    otpCreationTime.getTime() > new Date(otpExpirationTime).getTime();

  if (minDiff) {
    return res.status(400).json({ message: "OTP is expired" });
  }

  if (Number(otp) !== Number(dbOTP)) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  await updateVerifiedStatusQuery(user?.id);

  res.status(200).json({
    data: {
      screen: "verified",
      message: "OTP verification successful",
    },
  });
});

// Get User Details Controller
const getUserController = asyncHandler(async (req, res) => {
  const user = req?.user;

  if (!user) {
    res.status(400).json({ message: "User is not authorised, please login" });
  }

  const userInfo = await getUserById(user?.id);

  if (!userInfo) {
    res.status(400).json({ message: "Facing error to get user info" });
  }

  res.status(200).json({
    userInfo: userInfo?.rows[0],
    message: "User info fetched sussfully",
  });
});

// Update User Details Controller
const updateUserController = asyncHandler(async (req, res) => {
  const user = req?.user;

  if (!user) {
    res.status(400).json({ message: "User is not authorised, please login" });
  }

  try {
    await updateUserInfoSchema.validateAsync(req?.body);
  } catch (error) {
    res.status(400).json({ message: error?.details[0]?.message });
  }

  const { name, profile_photo } = req?.body;

  const userInfo = await updateUserInfo(user?.id, name, profile_photo);

  if (!userInfo?.rowCount) {
    res.status(400).json({
      message:
        "Facing error while updating user infomation, please try after sometime",
    });
  }

  res.status(200).json({
    message: "User info updated successfully",
  });
});

// Get OTP Status
const getOtpStatusController = asyncHandler(async (req, res) => {
  const user = req.user;

  let screenShow;
  let message;

  if (!user) {
    res.status(400).json({ message: "User is not authorised, please login" });
  }

  const otpData = await getOtpData(user?.id);

  if (!otpData) {
    res.status(400).json({ message: "Unable to fetch otp data" });
  }

  if (otpData?.rows[0]?.verified) {
    const data = {
      screen: "verified",
      message: "User is Verified",
    };
    res.status(200).json({
      data,
      message: "",
    });
  }

  const screenStatus = otpData?.rows[0];

  console.log("SCREEN STATUS : ", screenStatus);

  const currentTime = new Date();
  const expiryTime = screenStatus?.otp_expires_at;
  console.log(expiryTime - currentTime);
  const timeLeft =
    expiryTime == null
      ? null
      : Math.floor((expiryTime - currentTime) / 1000 / 60);

  const otpAttempts = await redisClient.get(`otp_attempts:${user?.id}`);

  console.log("OTP ATTEMPTS : ", otpAttempts);

  // 2026-02-02 22:23:36

  let response = 200;

  switch (true) {
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
      response = 400;
      break;
  }

  const data = {
    ...otpData?.rows[0],
    otp_attempts: otpAttempts,
    screen: screenShow,
    error_message: message,
  };

  res.status(response).json({
    data,
    message: message,
  });
});

// Reset Password Controller
// Options :
// Option 1 : Send Reset Password link and ask for the secret word, asked during the registration.
// Option 2 : Send Email to Recovery email.
// Option 3 : Send OTP on phone number or email address(registered email address)
// Option 4 : Add All the above

module.exports = {
  registerController,
  loginController,
  logoutController,
  authoriseController,
  generateOtpController,
  otpVerificationController,
  getUserController,
  updateUserController,
  getOtpStatusController,
};
