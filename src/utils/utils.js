const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const csrfToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHmac("sha256", process.env.CSRF_TOKEN_SECRET)
    .update(token)
    .digest("hex");

  const isVerified = crypto.verify(
    "sha256",
    token,
    process.env.CSRF_TOKEN_SECRET
  );

  console.log(isVerified);
  return hashedToken;
};

csrfToken();

const generateCSRFToken = (token) => {
  const hashedToken = crypto
    .createHmac("sha256", process.env.CSRF_TOKEN_SECRET)
    .update(token)
    .digest("hex");

  return hashedToken;
};

const verifyToken = (jwtToken, receivedCSRFtoken) => {
  const hashedToken = crypto
    .createHmac("sha256", process.env.CSRF_TOKEN_SECRET)
    .update(jwtToken)
    .digest("hex");

  const result = 0;
};

const compareToken = (recievedToken, generatedToken) => {
  if (recievedToken.length !== generatedToken.length) {
    return false;
  }

  const result = 0;
  for (let i = 0; i < recievedToken.length; i++) {
    result |= recievedToken.charAt(i) ^ generatedToken.charAt(i);
  }

  return result;
};

// node src/utils/utils.js
