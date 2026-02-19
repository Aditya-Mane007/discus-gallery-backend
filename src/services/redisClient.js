const { Redis } = require("ioredis");

const redisClient = new Redis();

redisClient.on("connect", () => {
  console.log("REDIS CONNECTED".red.underline);
});

module.exports = redisClient;
