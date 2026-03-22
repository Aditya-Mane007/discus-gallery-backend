const express = require("express");

const {
  registerController,
  loginController,
  logoutController,
  authoriseController,
  generateOtpController,
  otpVerificationController,
  getOtpStatusController,
  getRefreshToken,
} = require("./controller.js");

const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/routeInfo", (req, res) => {
  res.status(200).json({
    message: "This is Auth Route",
  });
});

// AUTH
router.post("/register", registerController);
router.post("/login", loginController);
router.get("/logout", logoutController);
router.get("/getuser", authMiddleware, authoriseController);
router.get("/refresh-token", getRefreshToken);

// OTP
router.get("/generateOTP", authMiddleware, generateOtpController);
router.post("/verifyOTP", authMiddleware, otpVerificationController);
router.get("/getOtpStatus", authMiddleware, getOtpStatusController);

module.exports = router;
