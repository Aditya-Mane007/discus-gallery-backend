export const OTP_EXPIRY_TIME = 50 * 60;
export const OTP_ATTEMPTS = 3;
export const PRE_AUTH_ATTEMPTS = 5;
export const PRE_AUTH_ATTEMPTS_EXPIRY = 60 * 60; // 1 hour in seconds
export const OTP_VERIFICATION_ATTEMPTS = 3;

// TEMP SESSION EXPIRY
export const TEMP_SESSION_COOKIE = 2 * 60 * 1000;
export const TEMP_CSRF_COOKIE = 2 * 60 * 1000;

// ACTUAL SESSION
export const ACTUAL_TOKEN_COOKIE = 5 * 60 * 1000;
export const ACTUAL_CSRF_COOKIE = 3 * 24 * 60 * 60 * 1000;
export const ACTUAL_REFRESH_TOKEN_COOKIE = 3 * 24 * 60 * 60 * 1000;
export const ACTUAL_SESSION_EXPIRTY_TIME = 3 * 24 * 60 * 60 * 1000;

export const TABLE_SCHEMA = {
  AUTH: 'auth.users',
  OTP: 'auth.otp',
  SESSION: 'auth.sessions',

  // ADMIN
  ADMIN_AUTH: 'auth.users',
  ADMIN_SESSION: 'auth.user_sessions',
  ADMIN_TEMP_SESSION: 'auth.temp_sessions',
  PORTAL: 'portal.portal',
  ADMIN_OTP: 'admin.otps',

  // MODULES
  MODULES_MODULE: 'modules.module',
  MODULES_RESOURCE: 'modules.resource',
  MODULES_RESOURCE_PERMISSION: 'modules.resource_permission',

  // PERMISSION POLICY
  PERMISSION_POLICY: 'auth.permission_policy',
  // ORGANIZATION
  ORG: 'organization.organization',
  ORG_MEMBERSHIP: 'organization.organization_membership',
  ORG_INVITATION: 'organization.organization_invitation',
};

export const JWT_SECRET_BYTES = 64;

export const HASHED_SALT = 10;

export const SESSION_LIMIT = 3;

export const clearAuthCookies = (res) => {
  res.clearCookie('token', {});
  res.clearCookie('temp-session-id', {});
  res.clearCookie('refresh-token');
  res.clearCookie('session-id');
  res.clearCookie('XSRF-TOKEN');
};

export const OTP_TYPE = {
  LOGIN_VERIFICATION_OTP: 'LOGIN_VERIFICATION_OTP',
};
