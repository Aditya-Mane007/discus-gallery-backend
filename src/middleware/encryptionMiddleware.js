const { encryptPayload } = require("../utils/utils");

const encryptionMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    try {
      const dataString = JSON.stringify(data);
      const encrypted = encryptPayload(dataString);

      // Send encrypted data wrapped in an object
      return originalJson({ response: encrypted });
    } catch (err) {
      // If encryption fails, send error or propagate error
      return res.status(500).json({ error: "Encryption Error" });
    }
  };

  next();
};

module.exports = encryptionMiddleware;
