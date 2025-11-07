const asyncHandler = require("express-async-handler");
const CryptoJS = require("crypto-js");

const encryptionMiddleware = asyncHandler(async (req, res, next) => {
  // Correctly bind res.json to res
  const originalJson = res.json.bind(res);

  // Log the originalJson function reference for debugging
  console.log("Original res.json:", originalJson);

  //   res.json = (body) => {
  //     let bodyString =
  //       typeof body === "object" ? JSON.stringify(body) : String(body);

  //     const encrypted = CryptoJS.AES.encrypt(
  //       bodyString,
  //       process.env.ENCRYPTION_KEY
  //     ).toString();

  //     // Send encrypted payload wrapped in an object
  //     return originalJson({ data: encrypted });
  //   };

  next();
});

module.exports = encryptionMiddleware;
