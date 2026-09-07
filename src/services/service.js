// import { config } from "../config/config";
import {
  generateOTPQuery,
  resetOtpStatus,
} from '../modules/admin/auth/repository.js';
import redisClient from './redisClient.js';
import bcrypt from 'bcrypt';
import { HASHED_SALT, OTP_EXPIRY_TIME } from '../utils/constant.js';
import { generateOTP } from '../utils/utils.js';

export const generateOTPService = async (
  userId,
  tempSessionId,
  otp_type,
  hashedOTP,
  otpExpiryTime,
) => {
  if (!userId) {
    throw new Error('User is not authorised, please login');
  }

  let otpAttempts = await redisClient.get(`${otp_type}_attempts:${userId}`);

  if (otpAttempts !== null) {
    if (Number(otpAttempts) === 0) {
      throw new Error(
        'You have reached the maximum of 3 OTP attempts. try again after 1 hours',
      );
    } else {
      otpAttempts = await redisClient.decrby(
        `${otp_type}_attempts:${userId}`,
        1,
      );
      await redisClient.del(`${otp_type}_verification_attempts:${userId}`);
    }
  } else {
    await redisClient.set(
      `${otp_type}_attempts:${userId}`,
      2,
      'EX',
      60 * 60,
      'NX',
    );
    otpAttempts = 2;
    await resetOtpStatus(userId);
  }

  const userInfo = await generateOTPQuery(
    userId,
    tempSessionId,
    otp_type,
    hashedOTP,
    otpExpiryTime,
  );

  if (!userInfo?.rowCount) {
    throw new Error('Error Generating OTP');
  }

  const data = {
    otp_attempts: otpAttempts,
    otp_created_at: userInfo?.rows[0]?.otp_created_at,
    screen: 'otp',
  };

  return data;
};

export const generate2FAOTPService = async (
  userId,
  tempSessionId,
  otpType,
  res,
) => {
  const currentTime = new Date();
  const userInfo = {
    userid: userId,
    status: otpType,
    created_at: new Date().toISOString(),
    expires_at: new Date(
      currentTime.getTime() + OTP_EXPIRY_TIME * 60 * 1000,
    ).toISOString(),
  };

  const cooldownKey = `otp_cooldown:${userId}`;
  const attemptsKey = `otp_request_count:${userId}`;

  // 1. 🚫 Cooldown check
  const otpCooldown = await redisClient.get(cooldownKey);

  if (otpCooldown === 'true') {
    const remaining = await redisClient.get(attemptsKey);

    return res.status(400).json({
      otpAttempts: Number(remaining ?? 0),
      message: 'OTP already sent. Please wait before requesting again.',
    });
  }

  // 2. 🔢 Get attempts ONCE
  let otpAttempts = await redisClient.get(attemptsKey);

  if (otpAttempts !== null && Number(otpAttempts) <= 0) {
    return res.status(400).json({
      otpAttempts: 0,
      message:
        'You have reached the maximum number of OTP requests. Try again after 1 hour.',
    });
  }

  // 3. 🔁 Initialize OR decrement (BEFORE OTP generation)
  let remaining;

  if (otpAttempts === null) {
    await redisClient.set(attemptsKey, 2, 'EX', 3600);
    remaining = 2;
  } else {
    remaining = await redisClient.decr(attemptsKey);

    if (remaining < 0) {
      await redisClient.set(attemptsKey, 0, 'KEEPTTL');

      return res.status(400).json({
        otpAttempts: 0,
        message: 'OTP request limit reached',
      });
    }
  }

  // ✅ 4. NOW generate OTP
  const otp = generateOTP();

  const hashedOTP = await bcrypt.hash(otp.toString(), HASHED_SALT);

  // 5. 🔁 Store OTP
  await redisClient.set(`otp:${userId}`, hashedOTP, 'EX', 300);

  // 6. 🔄 Reset verify attempts
  await redisClient.set(`otp_verify_attempts:${tempSessionId}`, 3, 'EX', 300);

  // 7. 🧾 Temp session
  await redisClient.set(
    `temp_session:${tempSessionId}`,
    JSON.stringify(userInfo),
    'EX',
    600,
  );

  // 8. ⏳ Cooldown
  await redisClient.set(cooldownKey, 'true', 'EX', 60);

  return res.status(200).json({
    otpAttempts: Number(remaining),
    data: userInfo,
    message: 'OTP sent successfully',
  });
};
