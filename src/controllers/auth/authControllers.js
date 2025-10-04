const { checkIfUsersExists } = require("../../models/userModel");
const asyncHandler = require("express-async-handler");

const registerController = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400);
    throw new Error("Please add all the fields");
  }

  const useExists = await checkIfUsersExists(email);

  console.log(useExists);

  res.status(200).json({
    message: "This auth/register route",
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
