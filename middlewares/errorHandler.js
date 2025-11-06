export const errorHandler = (err, req, res, next) => {
  console.error("KO ERROR:", err);
  res.status(err.status || 500).json({
    error: err.code || "internal_error",
    message: err.message || "Internal server error",
  });
};
