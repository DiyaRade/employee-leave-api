const { z } = require("zod");

const loginSchema = z
  .object({
    email: z.email("A valid email is required"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

module.exports = {
  loginSchema,
};