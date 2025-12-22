const {
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
dotenv.config();

// Register Controller
const registerController = asyncHandler(async (req, res) => {
  try {
    await registerSchema.validateAsync(req.body);
  } catch (error) {
    res.status(400);
    throw new Error(error?.details[0]?.message);
  }

  const { email, password, name } = req.body;

  const useExists = await checkIfUsersExists(email);

  if (useExists) {
    res.status(400);
    throw new Error("User already exists, please login");
  }

  const hashpassword = await bcrypt.hash(password, 10);

  const user = await createUser(name, email, hashpassword);

  if (!user) {
    res.status(500);
    throw new Error("Something went wrong, please try again later");
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
    res.status(404);
    throw new Error("User does not exists, please register");
  }

  const checkPassword = await bcrypt.compare(
    password,
    userExists.rows[0].password
  );

  if (!checkPassword) {
    res.status(400);
    throw new Error("Invalid credentials");
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
  const { user } = req?.user;
  if (!user) {
    res.status(401);
    throw new Error("User is not authorised, please login");
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
    res.status(401);
    throw new Error("User is not authorised, please login");
  }

  if (user?.otp_attempts === 0) {
    res.status(400);
    throw new Error(
      "You have reached the maximum of 3 OTP attempts. try again after 3 hours"
    );
  }

  const otp = generateOTP(6);
  const otpCreationTime = new Date();

  const userInfo = await generateOTPAndUpdateOTPAttempts(
    otp,
    user?.id,
    otpCreationTime
  );

  if (!userInfo?.rowCount) {
    res.status(400);
    throw new Error("Error Generating OTP");
  }

  await send(user?.email, otp);

  res.status(200).json({
    otp_attempts: userInfo?.rows[0]?.otp_attempts,
    otp_creation_time: userInfo?.rows[0]?.otp_created_at,
    message: "OTP Generated Successfully",
  });
});

// Verify OTP Controller
const otpVerificationController = asyncHandler(async (req, res) => {
  try {
    await otpVerificationSchema.validateAsync(req.body);
  } catch (error) {
    res.status(400);
    throw new Error(error?.details[0]?.message);
  }

  const user = req?.user;

  if (!user) {
    res.status(401);
    throw new Error("User is not authorised, please login");
  }

  const { otp } = req?.body;

  const otpFromDb = await getOTPQuery(user?.id);

  if (otpFromDb.rowCount < 1) {
    res.status(400);
    throw new Error("OTP verification failed, kindly generate otp");
  }

  const dbOTP = otpFromDb?.rows[0]?.otp;
  const otpCreationTIme = otpFromDb?.rows[0]?.otp_created_at;

  const minDiff = (new Date() - new Date(otpCreationTIme)) / (1000 * 60);

  if (minDiff > 10) {
    res.status(400);
    throw new Error("OTP is expired");
  }

  if (Number(otp) !== Number(dbOTP)) {
    res.status(400);
    throw new Error("Invalid OTP, please enter correct otp");
  }

  await updateVerifiedStatusQuery(user?.id);

  res.status(200).json({
    message: "OTP verification successful",
  });
});

// Get User Details Controller
const getUserController = asyncHandler(async (req, res) => {
  const user = req?.user;

  if (!user) {
    res.status(401);
    throw new Error("User is not authorised, please login");
  }

  const userInfo = await getUserById(user?.id);

  if (!userInfo) {
    res.status(400);
    throw new Error("Facing error to get user info");
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
    res.status(401);
    throw new Error("User is not authorised, please login");
  }

  try {
    await updateUserInfoSchema.validateAsync(req?.body);
  } catch (error) {
    res.status(400);
    throw new Error(error?.details[0]?.message);
  }

  const { name, profile_photo } = req?.body;

  const userInfo = await updateUserInfo(user?.id, name, profile_photo);

  if (!userInfo?.rowCount) {
    res.status(400);
    throw new Error(
      "Facing error while updating user infomation, please try after sometime"
    );
  }

  res.status(200).json({
    message: "User info updated successfully",
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
};
