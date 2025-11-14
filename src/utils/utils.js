const dotenv = require("dotenv");
dotenv.config();
const jwt = require("jsonwebtoken");
const AES = require("crypto-js/aes");
const ENC = require("crypto-js/enc-utf8");
const crypto = require("crypto");

// To compare csrf token
const compareToken = (recievedToken, generatedToken) => {
  if (recievedToken.length !== generatedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < recievedToken.length; i++) {
    result |= recievedToken.charAt(i) ^ generatedToken.charAt(i);
  }

  return result === 0;
};

// Generate JWT Token
const generateToken = (userInfo) => {
  return jwt.sign(userInfo, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });
};

// To Generate CSRF token
const generateCSRFToken = (token) => {
  const hashedToken = crypto
    .createHmac("sha256", process.env.CSRF_TOKEN_SECRET)
    .update(token)
    .digest("hex");

  return hashedToken;
};

// To verify/compare/check token received token, generated csrf token from(received jwt token)
const verifyToken = (jwtToken, receivedCSRFtoken) => {
  const hashedToken = crypto
    .createHmac("sha256", process.env.CSRF_TOKEN_SECRET)
    .update(jwtToken)
    .digest("hex");

  return compareToken(receivedCSRFtoken, hashedToken);
};

const encryptPayload = (payload) => {
  try {
    const encrytedData = AES.encrypt(
      payload,
      process.env.ENCRYPTION_KEY
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
      process.env.ENCRYPTION_KEY
    ).toString(ENC);

    return JSON.parse(decryptedData);
  } catch (error) {
    throw new Error("Error : ", error);
  }
};

module.exports = {
  generateToken,
  generateCSRFToken,
  verifyToken,
  compareToken,
  encryptPayload,
  decryptPayload,
};
