const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { getUserById } = require("../modules/auth/repository.js");
const { verifyToken } = require("../utils/utils");
const { clearAuthCookies } = require("../utils/constant.js");

const authMiddleware = asyncHandler(async (req, res, next) => {
  let csrf = req?.cookies?.["XSRF-TOKEN"];
  let token = req?.cookies?.token;

  if (!csrf) {
    res.status(400).json({ message: "Invalid request: csrf token required." });
  }

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  const csrfTokenStatus = verifyToken(token, csrf);

  if (!csrfTokenStatus) {
    res.status(401);
    throw new Error("Request verification failed.");
  }

  try {
    const decodedToken = jwt.decode(token, { complete: true });

    if (!decodedToken?.payload?.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await getUserById(decodedToken?.payload?.id);

    if (user.rowCount === 0) {
      res.status(404);
      throw new Error("Unable to retrieve user account.");
    }

    jwt.verify(token, user?.rows[0]?.jwt_secret);

    const userInfo = user.rows[0];

    delete userInfo?.jwt_secret;

    req.user = userInfo;

    next();
  } catch (error) {
    if (error.name == "TokenExpiredError") {
      return res.status(401).json({
        message: "Access Token Expired",
      });
    }

    clearAuthCookies(res);

    res.status(500);
    throw new Error("Verification failed, please try again after sometime");
  }
});

module.exports = authMiddleware;
