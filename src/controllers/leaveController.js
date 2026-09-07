const leaveService = require("../services/leaveService");
const {
  createLeaveRequestSchema,
  listLeaveRequestsQuerySchema,
  leaveIdParamSchema,
  employeeIdParamSchema,
  updateLeaveStatusSchema,
} = require("../validators/leaveValidator");
const { sendValidationError } = require("./validationError");

const formatDate = (date) => date.toISOString().slice(0, 10);

const serializeLeave = (leave) => ({
  id: leave.id,
  employee_id: leave.employeeId,
  leave_type: leave.leaveType,
  from_date: formatDate(leave.fromDate),
  to_date: formatDate(leave.toDate),
  status: leave.status,
});

const createLeaveRequest = async (req, res) => {
  const parsed = createLeaveRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed);
  }

  const leave = await leaveService.createLeaveRequest(parsed.data);
  return res.status(201).json(serializeLeave(leave));
};

const listLeaveRequests = async (req, res) => {
  const parsed = listLeaveRequestsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(res, parsed);
  }

  const leaves = await leaveService.listLeaveRequests(parsed.data);
  return res.status(200).json({
    count: leaves.length,
    leaves: leaves.map(serializeLeave),
  });
};

const updateLeaveStatus = async (req, res) => {
  const paramsParsed = leaveIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return sendValidationError(res, paramsParsed);
  }

  const bodyParsed = updateLeaveStatusSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return sendValidationError(res, bodyParsed);
  }

  const leave = await leaveService.updateLeaveStatus(
    paramsParsed.data.id,
    bodyParsed.data.status
  );
  return res.status(200).json(serializeLeave(leave));
};

const getLeaveSummary = async (req, res) => {
  const parsed = employeeIdParamSchema.safeParse(req.params);

  if (!parsed.success) {
    return sendValidationError(res, parsed);
  }

  const result = await leaveService.getLeaveSummary(parsed.data.employee_id);
  return res.status(200).json({
    employee_id: result.employeeId,
    summary: result.summary,
    total: result.total,
  });
};

module.exports = {
  createLeaveRequest,
  listLeaveRequests,
  updateLeaveStatus,
  getLeaveSummary,
};