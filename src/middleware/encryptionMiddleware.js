const { encryptPayload } = require("../utils/utils");

const encryptionMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  console.log("originalJson : ", res);
  res.json = (data) => {
    try {
      const dataString = JSON.stringify(data);
      const encrypted = encryptPayload(dataString);

      // Send encrypted data wrapped in an object
      return originalJson({ response: encrypted });
    } catch (err) {
      // If encryption fails, send error or propagate error
      if (!res.headersSent) {
        return originalJson({ error: "Encryption Error" });
      }

      // prevent Express from trying to respond again
      return;
    }
  };

  next();
};

module.exports = encryptionMiddleware;
