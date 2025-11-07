const express = require("express");
require("colors");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const errorHandler = require("./middleware/errorMiddleware.js");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const decryptionMiddleware = require("./middleware/decryptionMiddlware.js");
// const encryptionMiddleware = require("./middleware/encryptionMiddleware.js");

const PORT = process.env.PORT || 5000;

const app = express();

// Middleware

//Returns middleware that only parses json and only looks at requests where the Content-Type header matches the type option.
app.use(express.json());
app.use(cookieParser());
// Returns middleware that only parses urlencoded bodies and only looks at requests where the Content-Type header matches the type option
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000", // your frontend origin
    credentials: true, // enable cookies to be sent cross-origin
  })
);

// Routes
app.use("/api", decryptionMiddleware, require("./routes/routes.js"));

app.use("/test", (req, res) => {
  res.status(200).json({
    message: "TEST ROUTE",
  });
});
// Testing postgres connection
// app.get("/", async (req, res) => {
//   const result = await pool.query("SELECT current_database()");
//   res.send(`The database name is : ${result.rows[0].current_database}`);
// });

// Error Handling Middleware
// app.use("/test", encryptionMiddleware);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${process.env.DOMAIN}${PORT}`.blue.underline
  );
});
