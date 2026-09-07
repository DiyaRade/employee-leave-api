const prisma = require("../models/prisma");
const ServiceError = require("../models/serviceError");

const createLeaveRequest = async (data) => {
  const employee = await prisma.employee.findUnique({
    where: { id: data.employee_id },
  });

  if (!employee) {
    throw new ServiceError(404, "Employee not found");
  }

  return prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      leaveType: data.leave_type,
      fromDate: new Date(data.from_date),
      toDate: new Date(data.to_date),
      status: "pending",
    },
  });
};

const listLeaveRequests = async (filters) => {
  const where = {};

  if (filters.employee_id !== undefined) {
    where.employeeId = filters.employee_id;
  }

  if (filters.status !== undefined) {
    where.status = filters.status;
  }

  return prisma.leaveRequest.findMany({
    where,
    orderBy: { id: "asc" },
  });
};

const updateLeaveStatus = async (id, status) => {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id },
  });

  if (!leave) {
    throw new ServiceError(404, "Leave request not found");
  }

  return prisma.leaveRequest.update({
    where: { id },
    data: { status },
  });
};

const getLeaveSummary = async (employeeId) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new ServiceError(404, "Employee not found");
  }

  const groups = await prisma.leaveRequest.groupBy({
    by: ["leaveType"],
    where: {
      employeeId,
      status: "approved",
    },
    _count: {
      leaveType: true,
    },
  });

  const summary = {};
  for (const group of groups) {
    summary[group.leaveType] = group._count.leaveType;
  }

  const total = groups.reduce((sum, group) => sum + group._count.leaveType, 0);

  return { employeeId, summary, total };
};

module.exports = {
  createLeaveRequest,
  listLeaveRequests,
  updateLeaveStatus,
  getLeaveSummary,
};