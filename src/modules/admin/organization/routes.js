const express = require('express');
const { getUserOrganization } = require('./controller');
const adminAuthMiddlware = require('../../../middleware/adminAuthMiddleware');

const router = express.Router();

router.get('/getInfo', (req, res) => {
  return res.status(200).json({
    message: 'Permissions route',
  });
});

router.get('/getUserOrganizations', adminAuthMiddlware, getUserOrganization);

module.exports = router;
