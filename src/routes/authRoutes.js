const express = require("express");
const { checkIfUsersExists } = require("../models/userModel");
const {
  registerController,
  loginController,
  logoutController,
  authoriseController,
} = require("../controllers/auth/authControllers");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/authorise", authMiddleware, authoriseController);

module.exports = router;
