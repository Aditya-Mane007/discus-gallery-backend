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
  otpStatusController,
  generateOtp,
  verifyOtp,
} = require("./controller.js");

const adminAuthMiddlware = require("../../../middleware/adminAuthMiddleware.js");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    message: "This is Admin Auth Route",
  });
});

// AUTH
// router.post("/register", registerController);
router.post("/login", loginController);
router.get("/logout", logoutController);
router.get("/getuser", adminAuthMiddlware, authoriseController);
router.get("/refresh-token", getRefreshToken);

// OTP
router.get("/generateOTP", adminAuthMiddlware, generateOtpController);
router.post("/verifyOTP", adminAuthMiddlware, otpVerificationController);
router.get("/getOtpStatus", adminAuthMiddlware, getOtpStatusController);

module.exports = router;
