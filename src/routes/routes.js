const express = require("express");

const router = express.Router();

router.use("/client/auth", require("../modules/client/auth/routes.js"));

router.use("/admin/auth", require("../modules/admin/auth/routes.js"));

module.exports = router;
