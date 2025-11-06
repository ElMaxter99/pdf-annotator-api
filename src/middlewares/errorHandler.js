export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const body = {
    error: err.code || "internal_error",
    message: err.message || "Unexpected error",
  };

  if (err.currentVersion) {
    body.currentVersion = err.currentVersion;
  }

  res.status(status).json(body);
};
