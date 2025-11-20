const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { getUserById } = require("../models/userModel");
const { verifyToken } = require("../utils/utils");

const authMiddleware = asyncHandler(async (req, res, next) => {
  let csrf = req?.cookies?.["XSRF-TOKEN"];
  let token = req?.cookies?.token;

  if (!csrf) {
    res.status(400);
    throw new Error("Invalid request: csrf token required.");
  }

  if (!token) {
    res.status(400);
    throw new Error(
      "Access denied: no authentication token provided, please sign in again"
    );
  }

  const csrfTokenStatus = verifyToken(token, csrf);

  if (!csrfTokenStatus) {
    res.status(401);
    throw new Error("Request verification failed.");
  }

  try {
    const decodedTokon = jwt.verify(token, process.env.JWT_SECRET);


    const user = await getUserById(decodedTokon?.id);



    if (user.rowCount === 0) {
      res.status(404);
      throw new Error("Unable to retrieve user account.");
    }

    req.user = user.rows[0];
    next();
  } catch (error) {
    res.status(500);
    throw new Error("Verification failed, please try again after sometime");
  }
});

module.exports = authMiddleware;
