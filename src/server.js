const express = require("express");
require("colors");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const bcrypt = require("bcrypt");

const errorHandler = require("./middleware/errorMiddleware.js");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const decryptionMiddleware = require("./middleware/decryptionMiddlware.js");
const encryptionMiddleware = require("./middleware/encryptionMiddleware.js");
const { generateJWTSecret, generateRefreshToken } = require("./utils/utils.js");
const { HASHED_SALT } = require("./utils/constant.js");
const {
  createUser,
  checkIfUsersExists,
} = require("./modules/admin/auth/repository.js");

const PORT = process.env.PORT || 5000;

const app = express();

// Middleware

app.get("/server", (req, res) => {
  console.log(
    "REQ : ",
    req.ip,
    req.socket.remoteAddress,
    req?.headers["sec-ch-ua-platform"].replaceAll("'", ""),
  );
  return res.status(201).json({
    message: `Hello ${req?.headers["sec-ch-ua-platform"].replace(/["']/g, "")} User`,
  });
});

//Returns middleware that only parses json and only looks at requests where the Content-Type header matches the type option.
app.use(express.json());
app.use(cookieParser());

// Returns middleware that only parses urlencoded bodies and only looks at requests where the Content-Type header matches the type option
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000", // your frontend origin
    credentials: true, // enable cookies to be sent cross-origin
  }),
);

// app.get("/create-super-user", async (req, res) => {
//   const email = "aditya.mane.superadmin@discusgallery.com";
//   const password = "ADITYA27@SA";
//   const name = "ADITYA ASHOK MANE";

//   const useExists = await checkIfUsersExists(email);

//   if (useExists) {
//     return res
//       .status(400)
//       .json({ message: "User already exists, please login" });
//   }

//   const jwtSecret = generateJWTSecret();

//   const hashpassword = await bcrypt.hash(password, HASHED_SALT);

//   await createUser(name, email, hashpassword, jwtSecret);
// });

app.use("/api", decryptionMiddleware);

app.use("/api", encryptionMiddleware);

app.use("/api", require("./routes/routes.js"));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${process.env.DOMAIN}${PORT}`.blue.underline,
  );
});
