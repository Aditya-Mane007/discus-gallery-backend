// import { config } from "../config/config";
import {
  generateOTPQuery,
  resetOtpStatus,
} from "../modules/admin/auth/repository.js";
import redisClient from "./redisClient.js";
import bcrypt from "bcrypt";
import { HASHED_SALT, OTP_EXPIRY_TIME } from "../utils/constant.js";

export const generateOTPService = async (
  userId,
  tempSessionId,
  otp_type,
  hashedOTP,
  otpExpiryTime,
) => {
  if (!userId) {
    throw new Error("User is not authorised, please login");
  }

  let otpAttempts = await redisClient.get(`${otp_type}_attempts:${userId}`);

  if (otpAttempts !== null) {
    if (Number(otpAttempts) === 0) {
      throw new Error(
        "You have reached the maximum of 3 OTP attempts. try again after 1 hours",
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
      "EX",
      60 * 60,
      "NX",
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
    throw new Error("Error Generating OTP");
  }

  const data = {
    otp_attempts: otpAttempts,
    otp_created_at: userInfo?.rows[0]?.otp_created_at,
    screen: "otp",
  };

  return data;
};

export const generate2FAOTPService = async (
  userId,
  tempSessionId,
  otp,
  otpType,
) => {
  const hashedOTP = await bcrypt.hash(otp, HASHED_SALT);
  const userInfo = {
    userid: userId,
    status: otpType,
    created_at: new Date().getTime(),
    expires_at: new Date().getTime() + OTP_EXPIRY_TIME,
  };

  await redisClient.set(
    `temp_session:${tempSessionId}`,
    JSON.stringify(userInfo),
    "EX",
    10 * 60,
    "NX",
  );

  await redisClient.set(`otp:${userId}`, hashedOTP, "EX", 5 * 60, "NX");
  await redisClient.set(
    `otp_verify_attempts:${tempSessionId}`,
    2,
    "EX",
    5 * 60,
    "NX",
  );

  await redisClient.set(`otp_request_count:${userId}`, 3, "EX", 60 * 60, "NX");

  await redisClient.set(`otp_cooldown:${userId}`, true, "EX", 60 * 5, "NX");
};
