const jwt = require("jsonwebtoken");

const ServiceError = require("../models/serviceError");

const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ServiceError(401, "Authentication required"));
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ServiceError(401, "Token has expired"));
    }
    return next(new ServiceError(401, "Invalid token"));
  }

  req.user = { id: payload.sub, role: payload.role };
  return next();
};

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ServiceError(403, "Forbidden"));
    }
    return next();
  };
};

module.exports = {
  authenticate,
  authorizeRole,
};