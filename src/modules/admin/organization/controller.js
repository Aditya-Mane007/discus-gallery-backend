const asyncHandler = require('express-async-handler');
const {
  clearAuthCookies,
  ACTUAL_SESSION_EXPIRTY_TIME,
} = require('../../../utils/constant.js');
const { checkmembership } = require('./repository.js');
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
const jwt = require('jsonwebtoken');

const { getUserById } = require('../auth/repository.js');
const {
  generateToken,
  generateCSRFToken,
  generateRefreshToken,
} = require('../../../utils/utils.js');

const changeOrganization = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    clearAuthCookies(res);
    return res.status(401).json({
      message: 'User is not authorized',
    });
  }

  // Membeship id , this is membership id of org , which user want to switch to
  const { membership_id } = req.body;

  console.log('REQ BODY : ', req.body, membership_id);

  if (!membership_id) {
    return res.status(400).json({
      message: 'Memebship id is required',
    });
  }
  const token = req?.cookies['token'];
  const decodedToken = jwt.decode(token, { complete: true });
  const sessionId = decodedToken?.payload?.session_id;
  const membershipId = decodedToken?.payload?.membeship_id;

  // const check if input membership id is valid

  const isValidMembeshipId = await checkmembership(membership_id);

  if (!isValidMembeshipId) {
    return res.status(400).json({
      message: 'Invalid Membeship id',
    });
  }

  const userInfo = (await getUserById(user, sessionId)).rows[0];

  const newRefreshToken = generateRefreshToken();
  const newToken = generateToken(
    {
      user_id: req.user,
      email: userInfo?.email,
      profile_photo_url: userInfo?.profile_photo_url,
      session_id: userInfo?.session_id,
      membeship_id: membership_id,
    },
    userInfo?.jwt_secret,
  );
  const csrfToken = generateCSRFToken(newToken);
  res.cookie('token', newToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ACTUAL_SESSION_EXPIRTY_TIME,
    expires: new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME),
  });

  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ACTUAL_SESSION_EXPIRTY_TIME,
    expires: new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME),
  });

  res.cookie('refresh-token', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin/auth/refresh-token',
    maxAge: ACTUAL_SESSION_EXPIRTY_TIME,
    expires: new Date(Date.now() + ACTUAL_SESSION_EXPIRTY_TIME),
  });

  return res.status(200).json({
    message: `User Organization changed successfully`,
  });
});

module.exports = {
  getUserOrganization,
  changeOrganization,
};
