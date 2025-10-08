const {
  checkIfUsersExists,
  createUser,
  generateToken,
} = require("../../models/userModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

const registerController = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400);
    throw new Error("Please add all the fields");
  }

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
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  // res.cookie("XSRF-TOKEN", req.csrfToken(), {
  //   maxAge: 3 * 24 * 60 * 60 * 1000,
  //   expires: new Date(Date.now() + 3 * 24 * 3600 * 1000),
  //   httpOnly: true,
  // });
  res.status(201).json({
    accessToken: token,
    message: "User Registered Successfully",
  });
});

const loginController = (req, res) => {
  res.status(200).json({
    message: "This auth/login route",
  });
};

const logoutController = (req, res) => {
  res.status(200).json({
    message: "This auth/logout route",
  });
};

module.exports = {
  registerController,
  loginController,
  logoutController,
};
