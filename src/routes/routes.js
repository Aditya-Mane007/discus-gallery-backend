const express = require("express");

const router = express.Router();

router.use("/auth", require("../modules/auth/routes.js"));

module.exports = router;
