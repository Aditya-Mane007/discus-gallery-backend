const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const {
  getUserById,
  gettempSession,
} = require('../modules/admin/auth/repository.js');
const { verifyToken } = require('../utils/utils');
const { clearAuthCookies } = require('../utils/constant.js');

const adminAuthMiddlware = asyncHandler(async (req, res, next) => {
  let csrf = req?.cookies?.['XSRF-TOKEN'];
  let token = req?.cookies?.['temp-session-id']
    ? req?.cookies?.['temp-session-id']
    : req?.cookies?.['token'];

  if (!csrf) {
    clearAuthCookies(res);
    res.clearCookie('temp-session-id');
    return res.status(401).json({
      message: 'Invalid request: csrf token required.',
      redirectTo: '/login',
    });
  }

  if (!token) {
    // clearAuthCookies(res);
    // res.clearCookie('temp-session-id');
    return res.status(401).json({ message: 'No token', redirectTo: '/login' });
  }

  const csrfTokenStatus = verifyToken(token, csrf);

  if (!csrfTokenStatus) {
    clearAuthCookies(res);
    res.clearCookie('temp-session-id');
    return res.status(401).json({
      message: 'Request verification failed.',
      redirectTo: '/login',
    });
  }

  try {
    const decodedToken = jwt.decode(token, { complete: true });

    console.log('DECODING JWT TOKEN', decodedToken?.payload);
    console.log(
      'DECODED TOKEN : ',
      decodedToken?.payload?.user_id,
      decodedToken?.payload?.session_id,
      decodedToken?.payload?.membeship_id,
    );

    if (!decodedToken?.payload?.user_id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('SUCCSFULLY DECODED JWT TOKEN , FETCHING USER DETAILS');

    const user = req?.cookies?.['temp-session-id']
      ? await gettempSession(decodedToken?.payload?.temp_session_id)
      : await getUserById(
          decodedToken?.payload?.user_id,
          decodedToken?.payload?.session_id,
        );

    console.log('USER DETAILS FETECHED :');

    console.log('MIDDLEWARE LOG : ', user);

    if (!user || user.rowCount === 0) {
      return res.status(401).json({
        message: 'Error fetching user details , please login again',
      });
    }

    const verificationStatus = jwt.verify(token, user?.rows[0]?.jwt_secret);

    console.log('USERS LOG MIDDLWARE : ', user?.rows[0]);

    req.user = user?.rows[0]?.user_id;
    req.tempSessionId = user?.rows[0]?.temp_session_id;
    req.sessionId = user?.rows[0]?.session_id;
    req.membershipId = decodedToken?.payload?.membeship_id;

    next();
  } catch (error) {
    if (error.name == 'TokenExpiredError') {
      // res.clearCookie('temp-session-id');
      // clearAuthCookies(res);
      return res.status(401).json({
        message: 'Access Token Expired',
        // redirectTo: '/login',
      });
    }

    return res.status(400).json({
      message: `Error : ${error}`,
    });
    // throw new Error('Errro : ', error);
  }
});

module.exports = adminAuthMiddlware;
