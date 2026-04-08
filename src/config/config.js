export const config = {
  OTP_CONFIG: {
    LOGIN: {
      max_attempts: Number(process.env.LOGIN_MAX_ATTEMPTS ?? 3),
      verification_attempts: Number(
        process.env.LOGIN_VERIFICATION_ATTEMPTS ?? 3,
      ),
      expiry: Number(process.env.LOGIN_EXPIRTY ?? 300),
    },
    PASSWORD_RESET: {
      max_attempts: Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS ?? 3),
      verification_attempts: Number(
        process.env.PASSWORD_RESET_VERIFICATION_ATTEMPTS ?? 3,
      ),
      expiry: Number(process.env.PASSWORD_RESET_EXPIRTY ?? 300),
    },
    EMAIL_VERIFICATION: {
      max_attempts: Number(process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS ?? 3),
      verification_attempts: Number(
        process.env.EMAIL_VERIFICATION_VERIFICATION_ATTEMPTS ?? 3,
      ),
      expiry: Number(process.env.EMAIL_VERIFICATION_EXPIRTY ?? 600),
    },
  },
};
