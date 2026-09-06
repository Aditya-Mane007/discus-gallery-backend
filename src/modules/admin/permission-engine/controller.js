const asyncHandler = require('express-async-handler');
const {
  getPermissionsQuery,
  generatePermissionPolicy,
  createPolicy,
} = require('./repository.js');
const jwt = require('jsonwebtoken');
const { getUserById } = require('../auth/repository.js');
const { generateToken, generateCSRFToken } = require('../../../utils/utils.js');

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

const generatePermissionPolicyDocument = asyncHandler(async (req, res) => {
  const token = req.cookies['token'];
  const decodedToken = jwt.decode(token, { complete: true });

  const userId = decodedToken?.payload?.user_id;
  const membershipId = decodedToken?.payload?.membeship_id;
  const permissionVersion = decodedToken?.payload?.permission_version;
  const sessionId = decodedToken?.payload?.session_id;

  const userInfo = await getUserById(userId, sessionId)?.rows;

  console.log('USER INFO : ', userId, membershipId, sessionId);

  console.log('TOKEN : ', token);

  const permissions = await generatePermissionPolicy(membershipId);
  const permissionPolicy = {
    permissions: permissions,
    permission_version: Number(permissionVersion) + 1,
  };

  console.log('PERMISSION POLICY OBJECT : ', permissionPolicy);

  const createdPolicyDocument = await createPolicy(
    membershipId,
    permissionVersion,
    permissionPolicy,
  );

  console.log('createPolicy : ', createdPolicyDocument);

  // const newToken = generateToken(
  //   {
  //     user_id: userInfo?.user_id,
  //     email: userInfo?.email,
  //     profile_photo_url: userInfo?.profile_photo_url,
  //     session_id: sessionId,
  //     membeship_id: membershipId,
  //     permission_version: createdPolicyDocument?.permission_version,
  //   },
  //   userInfo.jwt_secret,
  // );

  // const csrfToken = generateCSRFToken(token);

  // res.cookie('token', newToken, {
  //   httpOnly: true,
  //   sameSite: 'lax',
  //   secure: process.env.NODE_ENV === 'production',
  //   maxAge: ACTUAL_SESSION_EXPIRTY_TIME,
  //   expires: new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME),
  // });

  // res.cookie('XSRF-TOKEN', csrfToken, {
  //   httpOnly: false,
  //   sameSite: 'lax',
  //   secure: process.env.NODE_ENV === 'production',
  //   maxAge: ACTUAL_SESSION_EXPIRTY_TIME,
  //   expires: new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME),
  // });

  return res.status(200).json({
    result: 'RESULT',
    message: 'New Permission Policy Created ',
  });
});

module.exports = {
  getPermission,
  generatePermissionPolicyDocument,
};
