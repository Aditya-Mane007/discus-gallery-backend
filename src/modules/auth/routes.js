const express = require("express");

const {
  registerController,
  loginController,
  logoutController,
  authoriseController,
  generateOtpController,
  otpVerificationController,
  getOtpStatusController,
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
router.get("/logout", authMiddleware, logoutController);
router.get("/getuser", authMiddleware, authoriseController);

// OTP
router.get("/generateOTP", authMiddleware, generateOtpController);
router.post("/verifyOTP", authMiddleware, otpVerificationController);
router.get("/getOtpStatus", authMiddleware, getOtpStatusController);

module.exports = router;
