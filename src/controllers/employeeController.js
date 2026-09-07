const employeeService = require("../services/employeeService");
const { createEmployeeSchema } = require("../validators/employeeValidator");
const { sendValidationError } = require("./validationError");

const createEmployee = async (req, res) => {
  const parsed = createEmployeeSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed);
  }

  const employee = await employeeService.createEmployee(parsed.data);
  return res.status(201).json({
    id: employee.id,
    name: employee.name,
    department: employee.department,
    email: employee.email,
    role: employee.role,
  });
};

module.exports = {
  createEmployee,
};