const asyncHandler = require("express-async-handler");
const { decryptPayload } = require("../utils/utils");

const decryptionMiddleware = asyncHandler(async (req, res, next) => {
  const { request } = req.body;

  const decryptedData = JSON.parse(decryptPayload(request));

  req.body = decryptedData;

  next();
});

module.exports = decryptionMiddleware;
