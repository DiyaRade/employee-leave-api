const sendValidationError = (res, parsed) => {
  return res.status(400).json({
    error: "Validation failed",
    details: parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
};

module.exports = {
  sendValidationError,
};