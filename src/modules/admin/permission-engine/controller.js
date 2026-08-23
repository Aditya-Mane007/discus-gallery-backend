const asyncHandler = require('express-async-handler');
const { getPermissionsQuery } = require('./repository.js');

const getPermission = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      message: 'Unauthorized access',
    });
  }

  const membershipId = req.membershipId;

  if (!membershipId) {
    return res.status(400).json({
      message: 'User is not part of any membership',
    });
  }

  const permission = await getPermissionsQuery(membershipId);

  if (!permission) {
    return res.status(200).json({
      message: 'No permissions found for the user',
    });
  }

  res.status(200).json({
    data: permission,
    message: 'This is Admin Permission Engine Route for get-permissions',
  });
});

module.exports = {
  getPermission,
};
