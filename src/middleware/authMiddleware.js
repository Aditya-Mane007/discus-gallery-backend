const asyncHandler = require("express-async-handler");

const authMiddleware = asyncHandler((err, req, res, next) => {
  let token;

  console.log("REQ : ", req);

  next();
});

module.exports = authMiddleware;
