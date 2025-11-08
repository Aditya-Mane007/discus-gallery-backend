const asyncHandler = require("express-async-handler");
const { decryptPayload } = require("../utils/utils");

const decryptionMiddleware = asyncHandler(async (req, res, next) => {
  const { request } = req.body;
  try {
    const decryptedData = JSON.parse(decryptPayload(request));
    req.body = decryptedData;
  } catch (error) {
    return res.status(500).json({
      message: "Decryption Error",
    });
  }

  next();
});

module.exports = decryptionMiddleware;
