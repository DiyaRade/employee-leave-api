const authService = require("../services/authService");
const { loginSchema } = require("../validators/authValidator");
const { sendValidationError } = require("./validationError");

const login = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed);
  }

  const result = await authService.login(parsed.data.email, parsed.data.password);
  return res.status(200).json(result);
};

module.exports = {
  login,
};