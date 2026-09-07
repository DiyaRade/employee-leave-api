require("dotenv").config();

const prisma = require("../models/prisma");
const ServiceError = require("../models/serviceError");

const employeeIdBody = (req, res, next) => {
  const eid = req.user && req.user.id;
  if (req.body.employee_id !== undefined && req.body.employee_id !== eid) {
    return next(new ServiceError(403, "Forbidden"));
  }
  return next();
};

const employeeIdParam = (req, res, next) => {
  if (req.user.role === "HR") return next();
  const eid = req.user.id;
  const paramVal = Number(req.params.employee_id);
  if (paramVal !== eid) {
    return next(new ServiceError(403, "Forbidden"));
  }
  return next();
};

const enforceSelfQuery = async (req, res, next) => {
  if (req.user.role === "HR") {
    return next();
  }

  const raw = req.query.employee_id;

  if (raw === undefined || raw === "") {
    req.query.employee_id = String(req.user.id);
    return next();
  }

  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed !== req.user.id) {
    return next(new ServiceError(403, "Forbidden"));
  }

  return next();
};

module.exports = {
  employeeIdBody,
  employeeIdParam,
  enforceSelfQuery,
};
