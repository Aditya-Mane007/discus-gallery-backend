export const OTP_EXPIRY_TIME = 2;
export const OTP_VERIFICATION_ATTEMPTS = 3;
export const PRE_AUTH_ATTEMPTS = 5;
export const PRE_AUTH_ATTEMPTS_EXPIRY = 60; // 1 hour in seconds

export const TABLE_SCHEMA = {
  AUTH: "auth.users",
  OTP: "auth.otp",
  SESSION: "auth.sessions",

  // ADMIN
  ADMIN_AUTH: "admin.users",
  ADMIN_SESSION: "admin.user_sessions",
  ADMIN_PORTAL: "admin.portal",
  ADMIN_OTP: "admin.otps",
};

export const JWT_SECRET_BYTES = 64;

export const HASHED_SALT = 10;

export const SESSION_LIMIT = 3;

export const clearAuthCookies = (res) => {
  res.clearCookie("token", {});
  res.clearCookie("temp-session-id", {});
  res.clearCookie("refresh-token");
  res.clearCookie("session-id");
  res.clearCookie("XSRF-TOKEN");
};

export const OTP_TYPE = {
  LOGIN_VERIFICATION_OTP: "LOGIN_VERIFICATION_OTP",
};
