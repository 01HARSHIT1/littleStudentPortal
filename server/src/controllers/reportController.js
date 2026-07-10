const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Candidate = require('../models/Candidate');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Ticket = require('../models/Ticket');
const Asset = require('../models/Asset');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/roles');

const orgMatch = (user, field = 'organization') => {
  if (user.role === ROLES.SUPER_ADMIN) return {};
  return { [field]: user.organization };
};

const dashboard = asyncHandler(async (req, res) => {
  const org = orgMatch(req.user);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    employeeCount,
    activeEmployees,
    departments,
    presentToday,
    pendingLeaves,
    openTickets,
    activeProjects,
    candidates,
    assetsAssigned,
    recentPayrolls,
  ] = await Promise.all([
    Employee.countDocuments({ ...org, status: { $ne: 'Archived' } }),
    Employee.countDocuments({ ...org, status: { $in: ['Active', 'Permanent', 'Probation'] } }),
    Department.countDocuments({ ...org, status: 'Active' }),
    Attendance.countDocuments({
      ...org,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['Present', 'Late', 'Half Day'] },
    }),
    Leave.countDocuments({ ...org, status: 'Pending' }),
    Ticket.countDocuments({ ...org, status: { $in: ['Open', 'In Progress'] } }),
    Project.countDocuments({ ...org, status: 'Active' }),
    Candidate.countDocuments({
      ...org,
      status: { $nin: ['Rejected', 'Joined'] },
    }),
    Asset.countDocuments({ ...org, status: 'Assigned' }),
    Payroll.find({ ...org })
      .sort({ year: -1, month: -1 })
      .limit(5)
      .populate('employee', 'employeeId personal'),
  ]);

  const taskStats = await Task.aggregate([
    { $match: req.user.role === ROLES.SUPER_ADMIN ? {} : { organization: req.user.organization } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      counts: {
        employees: employeeCount,
        activeEmployees,
        departments,
        presentToday,
        pendingLeaves,
        openTickets,
        activeProjects,
        activeCandidates: candidates,
        assetsAssigned,
      },
      taskStats,
      recentPayrolls,
    },
  });
});

const attendanceReport = asyncHandler(async (req, res) => {
  const { from, to, employee } = req.query;
  const filter = { ...orgMatch(req.user) };
  if (employee) filter.employee = employee;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const records = await Attendance.find(filter)
    .populate('employee', 'employeeId personal')
    .sort({ date: -1 });

  const summary = {
    total: records.length,
    present: records.filter((r) => ['Present', 'Late'].includes(r.status)).length,
    absent: records.filter((r) => r.status === 'Absent').length,
    halfDay: records.filter((r) => r.status === 'Half Day').length,
    overtimeHours: records.reduce((s, r) => s + (r.overtime || 0), 0),
  };

  res.json({ success: true, data: { summary, records } });
});

const leaveReport = asyncHandler(async (req, res) => {
  const filter = { ...orgMatch(req.user) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.year) {
    const y = parseInt(req.query.year, 10);
    filter.startDate = { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31) };
  }

  const leaves = await Leave.find(filter)
    .populate('employee', 'employeeId personal')
    .sort({ startDate: -1 });

  const byType = leaves.reduce((acc, l) => {
    acc[l.leaveType] = (acc[l.leaveType] || 0) + l.days;
    return acc;
  }, {});

  res.json({ success: true, data: { byType, leaves } });
});

const payrollReport = asyncHandler(async (req, res) => {
  const filter = { ...orgMatch(req.user) };
  if (req.query.month) filter.month = parseInt(req.query.month, 10);
  if (req.query.year) filter.year = parseInt(req.query.year, 10);

  const payrolls = await Payroll.find(filter)
    .populate('employee', 'employeeId personal professional')
    .sort({ year: -1, month: -1 });

  const totals = payrolls.reduce(
    (acc, p) => {
      acc.net += p.netSalary || 0;
      acc.basic += p.components?.basic || 0;
      acc.deductions += (p.components?.deductions || 0) + (p.components?.pf || 0) + (p.components?.tax || 0);
      return acc;
    },
    { net: 0, basic: 0, deductions: 0 }
  );

  res.json({ success: true, data: { totals, payrolls } });
});

const auditReport = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.entity) filter.entity = req.query.entity;
  if (req.query.user) filter.user = req.query.user;

  const logs = await AuditLog.find(filter)
    .populate('user', 'email role')
    .sort({ createdAt: -1 })
    .limit(parseInt(req.query.limit, 10) || 100);

  res.json({ success: true, data: logs });
});

module.exports = {
  dashboard,
  attendanceReport,
  leaveReport,
  payrollReport,
  auditReport,
};
