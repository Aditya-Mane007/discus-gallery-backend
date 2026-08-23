const express = require('express');

const router = express.Router();

router.use('/client/auth', require('../modules/client/auth/routes.js'));

router.use('/admin/auth', require('../modules/admin/auth/routes.js'));

router.use(
  '/admin/organization',
  require('../modules/admin/organization/routes.js'),
);
router.use(
  '/admin/permission',
  require('../modules/admin/organization/routes.js'),
);

router.use(
  '/admin/permission',
  require('../modules/admin/permission-engine/routes.js'),
);

module.exports = router;
