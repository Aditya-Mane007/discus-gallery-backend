const express = require('express');

const router = express.Router();

const adminAuthMiddlware = require('../../../middleware/adminAuthMiddleware.js');

router.get('/health', (req, res) => {
  res.status(200).json({
    message: 'This is Admin Permission Engine Route',
  });
});

router.get('/get-permissions', adminAuthMiddlware, (req, res) => {
  const user = req.user;
  res.status(200).json({
    message: 'This is Admin Permission Engine Route for get-permissions',
  });
});

module.exports = router;
