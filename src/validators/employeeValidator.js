const { z } = require("zod");

const createEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.string().min(1, "Department is required"),
  email: z.email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z
    .enum(["Employee", "HR"], { message: "role must be either Employee or HR" })
    .optional(),
});

module.exports = {
  createEmployeeSchema,
};