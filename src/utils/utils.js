const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

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

module.exports = {
  generateToken,
  generateCSRFToken,
  verifyToken,
  compareToken,
};
