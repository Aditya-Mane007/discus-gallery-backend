const express = require("express");
const { checkIfUsersExists } = require("../models/userModel");
const {
  registerController,
  loginController,
  logoutController,
  authoriseController,
  generateOtpController,
  otpVerificationController,
} = require("../controllers/auth/authControllers");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/routeInfo", (req, res) => {
  res.status(200).json({
    message: "This is Auth Route",
  });
});

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/logout", authMiddleware, logoutController);
router.get("/getuser", authMiddleware, authoriseController);
router.get("/generateOTP", authMiddleware, generateOtpController);
router.post("/verifyOTP", authMiddleware, otpVerificationController);

module.exports = router;
