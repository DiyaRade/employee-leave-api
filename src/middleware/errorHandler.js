const notFoundHandler = (req, res) => {
  return res.status(404).json({ error: "Route not found" });
};

const errorHandler = (err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};