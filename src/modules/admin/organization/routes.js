const express = require('express');
const { getUserOrganization, changeOrganization } = require('./controller.js');
const adminAuthMiddlware = require('../../../middleware/adminAuthMiddleware.js');

const router = express.Router();

router.get('/getInfo', (req, res) => {
  return res.status(200).json({
    message: 'Permissions route',
  });
});

router.get('/getUserOrganizations', adminAuthMiddlware, getUserOrganization);
router.patch('/changeUserOrganization', adminAuthMiddlware, changeOrganization);

module.exports = router;
