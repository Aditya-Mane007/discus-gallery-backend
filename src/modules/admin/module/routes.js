const adminAuthMiddlware = require('../../../middleware/adminAuthMiddleware.js');
const { getAllModuleList } = require('./controller.js');

const express = require('express');

const router = express.Router();

router.get('/get-modules', adminAuthMiddlware, getAllModuleList);

module.exports = router;
