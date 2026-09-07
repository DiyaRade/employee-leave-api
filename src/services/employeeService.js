const bcrypt = require("bcryptjs");

const prisma = require("../models/prisma");
const ServiceError = require("../models/serviceError");

const EMPLOYEE_PUBLIC_FIELDS = {
  id: true,
  name: true,
  department: true,
  email: true,
  role: true,
};

const createEmployee = async (data) => {
  try {
    return await prisma.employee.create({
      data: {
        name: data.name,
        department: data.department,
        email: data.email,
        password: await bcrypt.hash(data.password, 10),
        role: data.role,
      },
      select: EMPLOYEE_PUBLIC_FIELDS,
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new ServiceError(409, "An employee with this email already exists");
    }
    throw err;
  }
};

module.exports = {
  createEmployee,
};