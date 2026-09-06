const express = require('express');

const router = express.Router();

const adminAuthMiddlware = require('../../../middleware/adminAuthMiddleware.js');
const {
  getPermission,
  generatePermissionPolicyDocument,
} = require('./controller.js');

router.get('/health', (req, res) => {
  res.status(200).json({
    message: 'This is Admin Permission Engine Route',
  });
});

router.get('/get-permissions', adminAuthMiddlware, getPermission);

router.get('/generate-permission-policy', generatePermissionPolicyDocument);

module.exports = router;
