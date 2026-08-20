const asyncHandler = require('express-async-handler');
const { clearAuthCookies } = require('../../../utils/constant');

const getUserOrganization = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    clearAuthCookies(res);
    return res.status(401).json({
      message: 'User is not authorized',
    });
  }

  //   const organizations = await
  return res.status(200).json({
    message: 'Get User Organization',
  });
});

module.exports = {
  getUserOrganization,
};
