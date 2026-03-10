const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { getUserById } = require("../modules/auth/repository.js");
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
      "Access denied: no authentication token provided, please sign in again",
    );
  }

  const csrfTokenStatus = verifyToken(token, csrf);

  if (!csrfTokenStatus) {
    res.status(401);
    throw new Error("Request verification failed.");
  }

  try {
    const decodedToken = jwt.decode(token, { complete: true });

    // console.log("DECODED TOKEN : ", decodedToken);

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
    console.log("ERROR : ", error);
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      domain: "localhost",
      secure: process.env.NODE_ENV === "production",
    });

    res.clearCookie("XSRF-TOKEN", {
      httpOnly: false,
      domain: "localhost",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(500);
    throw new Error("Verification failed, please try again after sometime");
  }
});

module.exports = authMiddleware;
