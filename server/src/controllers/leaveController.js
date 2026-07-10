const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const Holiday = require('../models/Holiday');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');
const { createNotification } = require('../services/notificationService');

const orgFilter = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return {};
  return { organization: user.organization };
};

const calcLeaveDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  let days = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) days += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(days, 1);
};

const applyLeave = asyncHandler(async (req, res) => {
  const employeeId =
    req.body.employee ||
    (typeof req.user.employee === 'object' ? req.user.employee?._id : req.user.employee);

  if (!employeeId) throw new ApiError(400, 'Employee profile required');
  const { leaveType, startDate, endDate, reason } = req.body;
  if (!leaveType || !startDate || !endDate || !reason) {
    throw new ApiError(400, 'leaveType, startDate, endDate, and reason are required');
  }

  const days = req.body.days || calcLeaveDays(startDate, endDate);
  const year = new Date(startDate).getFullYear();

  let balance = await LeaveBalance.findOne({ employee: employeeId, year });
  if (!balance) {
    balance = await LeaveBalance.create({
      employee: employeeId,
      year,
      organization: req.user.organization,
    });
  }

  const available = balance.balances?.[leaveType];
  if (leaveType !== 'unpaid' && (available === undefined || available < days)) {
    throw new ApiError(400, `Insufficient ${leaveType} leave balance`);
  }

  const leave = await Leave.create({
    employee: employeeId,
    leaveType,
    startDate,
    endDate,
    days,
    reason,
    organization: req.user.organization,
    status: 'Pending',
  });

  const populated = await Leave.findById(leave._id).populate('employee', 'employeeId personal');
  res.status(201).json({ success: true, message: 'Leave applied', data: populated });
});

const getLeaves = asyncHandler(async (req, res) => {
  const filter = { ...orgFilter(req.user) };
  const manageRoles = [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_ADMIN,
    ROLES.HR_MANAGER,
    ROLES.MANAGER,
    ROLES.TEAM_LEAD,
  ];

  if (!manageRoles.includes(req.user.role)) {
    const empId =
      typeof req.user.employee === 'object' ? req.user.employee?._id : req.user.employee;
    filter.employee = empId;
  } else if (req.query.employee) {
    filter.employee = req.query.employee;
  }

  if (req.query.status) filter.status = req.query.status;

  const leaves = await Leave.find(filter)
    .populate('employee', 'employeeId personal')
    .populate('approvedBy', 'email role')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: leaves });
});

const getLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id)
    .populate('employee', 'employeeId personal')
    .populate('approvedBy', 'email role');
  if (!leave) throw new ApiError(404, 'Leave not found');
  res.json({ success: true, data: leave });
});

const reviewLeave = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    throw new ApiError(400, 'Status must be Approved or Rejected');
  }

  const leave = await Leave.findById(req.params.id).populate('employee');
  if (!leave) throw new ApiError(404, 'Leave not found');
  if (leave.status !== 'Pending') throw new ApiError(400, 'Leave already reviewed');

  leave.status = status;
  leave.approvedBy = req.user._id;
  leave.approvedAt = new Date();
  if (status === 'Rejected') leave.rejectionReason = rejectionReason || 'Rejected';

  if (status === 'Approved' && leave.leaveType !== 'unpaid') {
    const year = new Date(leave.startDate).getFullYear();
    const balance = await LeaveBalance.findOne({ employee: leave.employee._id, year });
    if (!balance || (balance.balances[leave.leaveType] || 0) < leave.days) {
      throw new ApiError(400, 'Insufficient leave balance at approval time');
    }
    balance.balances[leave.leaveType] -= leave.days;
    await balance.save();
  }

  await leave.save();

  if (leave.employee?.user) {
    await createNotification({
      userId: leave.employee.user,
      title: `Leave ${status.toLowerCase()}`,
      message: `Your ${leave.leaveType} leave request was ${status.toLowerCase()}.`,
      type: 'leave',
      link: '/leave',
      io: req.app.get('io'),
    });
  }

  res.json({ success: true, message: `Leave ${status.toLowerCase()}`, data: leave });
});

const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) throw new ApiError(404, 'Leave not found');
  if (leave.status !== 'Pending') throw new ApiError(400, 'Only pending leaves can be cancelled');

  leave.status = 'Cancelled';
  await leave.save();
  res.json({ success: true, message: 'Leave cancelled', data: leave });
});

const getLeaveBalance = asyncHandler(async (req, res) => {
  const employeeId =
    req.query.employee ||
    (typeof req.user.employee === 'object' ? req.user.employee?._id : req.user.employee);
  if (!employeeId) throw new ApiError(400, 'Employee required');

  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  let balance = await LeaveBalance.findOne({ employee: employeeId, year });
  if (!balance) {
    balance = await LeaveBalance.create({
      employee: employeeId,
      year,
      organization: req.user.organization,
    });
  }
  res.json({ success: true, data: balance });
});

const getHolidays = asyncHandler(async (req, res) => {
  const filter = { ...orgFilter(req.user) };
  if (req.query.year) {
    const y = parseInt(req.query.year, 10);
    filter.date = { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31) };
  }
  const holidays = await Holiday.find(filter).sort({ date: 1 });
  res.json({ success: true, data: holidays });
});

const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.create({
    ...req.body,
    organization: req.body.organization || req.user.organization,
  });
  res.status(201).json({ success: true, message: 'Holiday created', data: holiday });
});

module.exports = {
  applyLeave,
  getLeaves,
  getLeave,
  reviewLeave,
  cancelLeave,
  getLeaveBalance,
  getHolidays,
  createHoliday,
};
