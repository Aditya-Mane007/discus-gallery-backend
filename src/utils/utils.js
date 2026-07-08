const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
dotenv.config();
const jwt = require("jsonwebtoken");
const AES = require("crypto-js/aes");
const ENC = require("crypto-js/enc-utf8");
const crypto = require("crypto");
const { userInfo } = require("os");
const { JWT_SECRET_BYTES, HASHED_SALT } = require("./constant");
const bcrypt = require("bcrypt");

// To compare csrf token
// const compareToken = (recievedToken, generatedToken) => {
//   if (recievedToken.length !== generatedToken.length) {
//     return false;
//   }

//   let result = 0;
//   for (let i = 0; i < recievedToken.length; i++) {
//     result |= recievedToken.charAt(i) ^ generatedToken.charAt(i);
//   }

//   return result === 0;
// };

const compareToken = (receivedToken, generatedToken) => {
  return crypto.timingSafeEqual(
    Buffer.from(receivedToken),
    Buffer.from(generatedToken),
  );
};

// Generate JWT Token
const generateToken = (userInfo, jwt_Secret) => {
  return jwt.sign(userInfo, jwt_Secret, {
    expiresIn: "15m",
  });
};

// Generate the UUID
const generateUUID = () => {
  return crypto.randomUUID();
};

const generateTempSessionToken = (userInfo, jwt_Secret) => {
  return jwt.sign(userInfo, jwt_Secret, {
    expiresIn: "3d",
  });
};

// To Generate Refresh Token
const generateRefreshToken = () => {
  return crypto.randomBytes(JWT_SECRET_BYTES).toString("hex");
};

// To Generate CSRF token
const generateCSRFToken = (token) => {
  const hashedToken = crypto
    .createHmac("sha256", process.env.CSRF_TOKEN_SECRET)
    .update(token)
    .digest("hex");

  return hashedToken;
};

// To Generate JWT Secret for user
const generateJWTSecret = () => {
  return crypto.randomBytes(JWT_SECRET_BYTES).toString("hex");
};

// To verify/compare/check token received token, generated csrf token from(received jwt token)
// const verifyToken = (jwtToken, receivedCSRFtoken) => {
//   const hashedToken = crypto
//     .createHmac("sha256", process.env.CSRF_TOKEN_SECRET)
//     .update(jwtToken)
//     .digest("hex");

//   return compareToken(receivedCSRFtoken, hashedToken);
// };

const verifyToken = (jwtToken, receivedCSRFtoken) => {
  const hashedToken = crypto
    .createHmac("sha256", process.env.CSRF_TOKEN_SECRET)
    .update(jwtToken)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(receivedCSRFtoken),
    Buffer.from(hashedToken),
  );
};

const encryptPayload = (payload) => {
  try {
    const encrytedData = AES.encrypt(
      payload,
      process.env.ENCRYPTION_KEY,
    ).toString();
    return encrytedData;
  } catch (error) {
    throw new Error("Error : ", error);
  }
};

const decryptPayload = (payload) => {
  try {
    const decryptedData = AES.decrypt(
      payload,
      process.env.ENCRYPTION_KEY,
    ).toString(ENC);

    return JSON.parse(decryptedData);
  } catch (error) {
    throw new Error("Error : ", error);
  }
};

const generateOTP = () => {
  const otp = crypto.randomInt(100000, 1000000);
  return otp;
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_APP_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const send = async (recipent, otp) => {
  const info = await transporter.sendMail({
    from: `"Discus Gallery" <${process.env.GMAIL_APP_USER}>`,
    to: recipent,
    subject: "User Identity Verifcation ",
    text: `YOUR OTP : ${otp}`,
  });

  console.log("Message sent:", info.messageId);
};

module.exports = {
  generateToken,
  generateTempSessionToken,
  generateRefreshToken,
  generateCSRFToken,
  generateJWTSecret,
  verifyToken,
  compareToken,
  encryptPayload,
  decryptPayload,
  generateOTP,
  send,
  generateUUID,
};
