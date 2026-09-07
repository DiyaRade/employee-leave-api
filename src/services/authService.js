const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = require("../models/prisma");
const ServiceError = require("../models/serviceError");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

const login = async (email, password) => {
  const employee = await prisma.employee.findUnique({
    where: { email },
  });

  if (!employee || !employee.password) {
    throw new ServiceError(401, "Invalid email or password");
  }

  let valid = false;
  try {
    valid = await bcrypt.compare(password, employee.password);
  } catch {
    valid = false;
  }

  if (!valid) {
    throw new ServiceError(401, "Invalid email or password");
  }

  const token = jwt.sign(
    { sub: employee.id, role: employee.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: employee.id,
      name: employee.name,
      department: employee.department,
      email: employee.email,
      role: employee.role,
    },
  };
};

module.exports = {
  login,
};