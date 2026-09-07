const { z } = require("zod");

const createLeaveRequestSchema = z
  .object({
    employee_id: z.number().int().positive("employee_id must be a positive integer"),
    leave_type: z.string().min(1, "leave_type is required"),
    from_date: z.string().date("from_date must be a valid date (YYYY-MM-DD)"),
    to_date: z.string().date("to_date must be a valid date (YYYY-MM-DD)"),
  })
  .strict()
  .refine((data) => data.from_date <= data.to_date, {
    message: "from_date must not be after to_date",
    path: ["from_date"],
  });

const listLeaveRequestsQuerySchema = z
  .object({
    employee_id: z
      .coerce
      .number()
      .int()
      .positive("employee_id must be a positive integer")
      .optional(),
    status: z
      .enum(["pending", "approved", "rejected"], { message: "status must be one of: pending, approved, rejected" })
      .optional(),
  })
  .strict();

const leaveIdParamSchema = z.object({
  id: z.coerce.number().int().positive("id must be a positive integer"),
});

const employeeIdParamSchema = z.object({
  employee_id: z.coerce.number().int().positive("employee_id must be a positive integer"),
});

const updateLeaveStatusSchema = z
  .object({
    status: z.enum(["approved", "rejected"], { message: "status must be either approved or rejected" }),
  })
  .strict();

module.exports = {
  createLeaveRequestSchema,
  listLeaveRequestsQuerySchema,
  leaveIdParamSchema,
  employeeIdParamSchema,
  updateLeaveStatusSchema,
};