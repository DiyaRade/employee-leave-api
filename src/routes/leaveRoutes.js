const express = require("express");

const router = express.Router();
const leaveController = require("../controllers/leaveController");
const { authenticate, authorizeRole } = require("../middleware/auth");
const { employeeIdBody, employeeIdParam, enforceSelfQuery } = require("../middleware/guards");

router.post(
  "/",
  authenticate,
  authorizeRole("Employee"),
  employeeIdBody,
  leaveController.createLeaveRequest
);

router.get(
  "/",
  authenticate,
  enforceSelfQuery,
  leaveController.listLeaveRequests
);

router.get(
  "/summary/:employee_id",
  authenticate,
  employeeIdParam,
  leaveController.getLeaveSummary
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRole("HR"),
  leaveController.updateLeaveStatus
);

module.exports = router;
