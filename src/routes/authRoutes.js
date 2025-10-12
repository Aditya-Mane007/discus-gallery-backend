const express = require("express");
const { checkIfUsersExists } = require("../models/userModel");
const {
  registerController,
  loginController,
  logoutController,
} = require("../controllers/auth/authControllers");

const router = express.Router();

router.get("/auth", (req, res) => {
  res.status(200).json({
    message: "This is auth get router",
  });
});
router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", logoutController);

module.exports = router;

// (req, res) => {
//   const { email, password, name } = req.body;

//   if (!email || !password || !name) {
//     res.status(400);
//     throw new Error("Please Enter all the fields");
//   }

//   const userExists = checkIfUsersExists(email);

//   console.log(userExists);
