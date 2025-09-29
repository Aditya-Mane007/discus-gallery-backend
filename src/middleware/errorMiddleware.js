const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode).json({
    status: statusCode,
    message: err.message, 
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });

  next();
};

module.exports = errorHandler;
