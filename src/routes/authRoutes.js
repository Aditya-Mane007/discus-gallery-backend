const express = require("express");
const { checkIfUsersExists } = require("../models/userModel");
const {
  registerController,
  loginController,
  logoutController,
} = require("../controllers/auth/authControllers");

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", logoutController);

module.exports = router;

