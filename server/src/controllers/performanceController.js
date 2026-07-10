const Performance = require('../models/Performance');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');

const orgFilter = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return {};
  return { organization: user.organization };
};

const createPerformance = asyncHandler(async (req, res) => {
  const employee =
    req.body.employee ||
    (typeof req.user.employee === 'object' ? req.user.employee?._id : req.user.employee);
  if (!employee) throw new ApiError(400, 'Employee is required');

  const record = await Performance.create({
    ...req.body,
    employee,
    organization: req.body.organization || req.user.organization,
  });

  res.status(201).json({ success: true, message: 'Performance record created', data: record });
});

const getPerformances = asyncHandler(async (req, res) => {
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

  if (req.query.year) filter.year = parseInt(req.query.year, 10);
  if (req.query.quarter) filter.quarter = parseInt(req.query.quarter, 10);

  const records = await Performance.find(filter)
    .populate('employee', 'employeeId personal')
    .sort({ year: -1, quarter: -1 });

  res.json({ success: true, data: records });
});

const getPerformance = asyncHandler(async (req, res) => {
  const record = await Performance.findById(req.params.id).populate(
    'employee',
    'employeeId personal'
  );
  if (!record) throw new ApiError(404, 'Performance record not found');
  res.json({ success: true, data: record });
});

const updatePerformance = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (
    updates.kpiScore !== undefined ||
    updates.attendanceScore !== undefined ||
    updates.managerRating !== undefined
  ) {
    const existing = await Performance.findById(req.params.id);
    if (!existing) throw new ApiError(404, 'Performance record not found');

    const kpi = updates.kpiScore ?? existing.kpiScore ?? 0;
    const attendance = updates.attendanceScore ?? existing.attendanceScore ?? 0;
    const manager = (updates.managerRating ?? existing.managerRating ?? 0) * 20;
    updates.overall = Math.round(kpi * 0.5 + attendance * 0.2 + manager * 0.3);
  }

  const record = await Performance.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter(req.user) },
    updates,
    { new: true, runValidators: true }
  ).populate('employee', 'employeeId personal');

  if (!record) throw new ApiError(404, 'Performance record not found');
  res.json({ success: true, message: 'Performance updated', data: record });
});

const deletePerformance = asyncHandler(async (req, res) => {
  const record = await Performance.findOneAndDelete({
    _id: req.params.id,
    ...orgFilter(req.user),
  });
  if (!record) throw new ApiError(404, 'Performance record not found');
  res.json({ success: true, message: 'Performance deleted' });
});

module.exports = {
  createPerformance,
  getPerformances,
  getPerformance,
  updatePerformance,
  deletePerformance,
};
