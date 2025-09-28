const express = require("express");
require("colors");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const { pool } = require("./config/db.js");
const errorHandler = require("./middleware/errorMiddleware.js");

const PORT = process.env.PORT || 5000;

const app = express();

// Middleware

//Returns middleware that only parses json and only looks at requests where the Content-Type header matches the type option.
app.use(express.json());
app.use(cors());

// Routes
app.use("/api", require("./routes/routes.js"));

// Testing postgres connection
// app.get("/", async (req, res) => {
//   const result = await pool.query("SELECT current_database()");
//   res.send(`The database name is : ${result.rows[0].current_database}`);
// });

// Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${process.env.DOMAIN}${PORT}`.blue.underline
  );
});
