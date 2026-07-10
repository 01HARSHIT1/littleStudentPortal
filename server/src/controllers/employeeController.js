const Employee = require('../models/Employee');
const User = require('../models/User');
const LeaveBalance = require('../models/LeaveBalance');
const Organization = require('../models/Organization');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const generateEmployeeId = require('../utils/generateEmployeeId');
const { validatePassword } = require('../utils/passwordValidator');
const { ROLES } = require('../config/roles');

const orgFilter = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return {};
  return { organization: user.organization };
};

const createEmployee = asyncHandler(async (req, res) => {
  const organization = req.body.organization || req.user.organization;
  if (!organization) throw new ApiError(400, 'Organization is required');
  if (!req.body.personal?.firstName || !req.body.personal?.lastName || !req.body.personal?.email) {
    throw new ApiError(400, 'Personal firstName, lastName, and email are required');
  }

  const employeeId = await generateEmployeeId(organization);
  const employee = await Employee.create({
    ...req.body,
    employeeId,
    organization,
  });

  let user = null;
  if (req.body.createUser) {
    const password = req.body.password || 'Secure@123';
    const check = validatePassword(password);
    if (!check.valid) throw new ApiError(400, check.message);

    user = await User.create({
      email: req.body.personal.email.toLowerCase(),
      password,
      role: req.body.role || ROLES.EMPLOYEE,
      organization,
      employee: employee._id,
    });
    employee.user = user._id;
    await employee.save();
  }

  const org = await Organization.findById(organization);
  const year = new Date().getFullYear();
  await LeaveBalance.create({
    employee: employee._id,
    year,
    organization,
    balances: {
      casual: org?.settings?.leavePolicy?.casual ?? 12,
      sick: org?.settings?.leavePolicy?.sick ?? 10,
      earned: org?.settings?.leavePolicy?.earned ?? 15,
      unpaid: 0,
    },
  });

  await AuditLog.create({
    action: 'CREATE',
    user: req.user._id,
    entity: 'Employee',
    entityId: employee._id,
    details: { employeeId },
    ip: req.ip,
  });

  const populated = await Employee.findById(employee._id)
    .populate('professional.department', 'name code')
    .populate('professional.designation', 'title level')
    .populate('professional.manager', 'employeeId personal')
    .populate('user', 'email role isActive');

  res.status(201).json({
    success: true,
    message: 'Employee created',
    data: populated,
  });
});

const getEmployees = asyncHandler(async (req, res) => {
  const filter = { ...orgFilter(req.user) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.department) filter['professional.department'] = req.query.department;
  if (req.query.search) {
    const s = req.query.search;
    filter.$or = [
      { employeeId: new RegExp(s, 'i') },
      { 'personal.firstName': new RegExp(s, 'i') },
      { 'personal.lastName': new RegExp(s, 'i') },
      { 'personal.email': new RegExp(s, 'i') },
    ];
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .populate('professional.department', 'name code')
      .populate('professional.designation', 'title level')
      .populate('professional.manager', 'employeeId personal')
      .populate('user', 'email role isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Employee.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: employees,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ _id: req.params.id, ...orgFilter(req.user) })
    .populate('professional.department', 'name code')
    .populate('professional.designation', 'title level')
    .populate('professional.manager', 'employeeId personal')
    .populate('user', 'email role isActive lastLogin')
    .populate('organization', 'name code');

  if (!employee) throw new ApiError(404, 'Employee not found');
  res.json({ success: true, data: employee });
});

const getMyEmployee = asyncHandler(async (req, res) => {
  if (!req.user.employee) throw new ApiError(404, 'No employee profile linked');
  const employee = await Employee.findById(req.user.employee)
    .populate('professional.department', 'name code')
    .populate('professional.designation', 'title level')
    .populate('professional.manager', 'employeeId personal');

  if (!employee) throw new ApiError(404, 'Employee not found');
  res.json({ success: true, data: employee });
});

const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter(req.user) },
    req.body,
    { new: true, runValidators: true }
  )
    .populate('professional.department', 'name code')
    .populate('professional.designation', 'title level')
    .populate('professional.manager', 'employeeId personal')
    .populate('user', 'email role isActive');

  if (!employee) throw new ApiError(404, 'Employee not found');

  await AuditLog.create({
    action: 'UPDATE',
    user: req.user._id,
    entity: 'Employee',
    entityId: employee._id,
    details: req.body,
    ip: req.ip,
  });

  res.json({ success: true, message: 'Employee updated', data: employee });
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter(req.user) },
    { status: 'Archived' },
    { new: true }
  );
  if (!employee) throw new ApiError(404, 'Employee not found');

  if (employee.user) {
    await User.findByIdAndUpdate(employee.user, { isActive: false });
  }

  res.json({ success: true, message: 'Employee archived', data: employee });
});

module.exports = {
  createEmployee,
  getEmployees,
  getEmployee,
  getMyEmployee,
  updateEmployee,
  deleteEmployee,
};
