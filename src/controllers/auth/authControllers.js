const {
  checkIfUsersExists,
  createUser,
  getUserByEmail,
} = require("../../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const {
  generateCSRFToken,
  generateToken,
  decryptPayload,
  encryptPayload,
} = require("../../utils/utils");
const { registerSchema, loginSchema } = require("../../schema/authSchema");
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

  if (!userExists.rowCount) {
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

  const userData = userExists.rows[0];

  const token = generateToken({
    id: userData.id,
    email: userData.email,
    profile_photo: userData.profile_photo,
    verified: userData.verified,
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

  res.status(200).json({
    response: encryptPayload(
      JSON.stringify({
        accessToken: token,
        message: "Logged In Successfully",
      })
    ),
  });

  // res.status(200).json({
  //   accessToken: token,
  //   message: "Logged In Successfully",
  // });
});

// Logout Controller
const logoutController = (req, res) => {
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

module.exports = {
  registerController,
  loginController,
  logoutController,
};
