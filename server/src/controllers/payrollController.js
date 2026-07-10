const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { generatePayroll, calculateSalary } = require('../services/payrollService');
const { createNotification } = require('../services/notificationService');
const aiService = require('../services/aiService');
const { ROLES } = require('../config/roles');

const orgFilter = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return {};
  return { organization: user.organization };
};

const generate = asyncHandler(async (req, res) => {
  const { employeeId, month, year, bonus, deductions } = req.body;
  if (!employeeId || !month || !year) {
    throw new ApiError(400, 'employeeId, month, and year are required');
  }

  const payroll = await generatePayroll({
    employeeId,
    month,
    year,
    organizationId: req.user.organization,
    generatedBy: req.user._id,
    bonus,
    deductions,
  });

  const employee = await Employee.findById(employeeId);
  if (employee?.user) {
    await createNotification({
      userId: employee.user,
      title: 'Payslip generated',
      message: `Payroll for ${month}/${year} has been generated.`,
      type: 'payroll',
      link: '/payroll',
      io: req.app.get('io'),
    });
  }

  const populated = await Payroll.findById(payroll._id).populate(
    'employee',
    'employeeId personal professional'
  );

  res.status(201).json({ success: true, message: 'Payroll generated', data: populated });
});

const generateBulk = asyncHandler(async (req, res) => {
  const { month, year } = req.body;
  if (!month || !year) throw new ApiError(400, 'month and year are required');

  const filter = { status: { $in: ['Active', 'Probation', 'Permanent'] } };
  if (req.user.role !== ROLES.SUPER_ADMIN) filter.organization = req.user.organization;

  const employees = await Employee.find(filter);
  const results = [];

  for (const emp of employees) {
    try {
      const payroll = await generatePayroll({
        employeeId: emp._id,
        month,
        year,
        organizationId: emp.organization,
        generatedBy: req.user._id,
      });
      results.push({ employeeId: emp.employeeId, success: true, payrollId: payroll._id });
    } catch (err) {
      results.push({ employeeId: emp.employeeId, success: false, error: err.message });
    }
  }

  res.json({ success: true, message: 'Bulk payroll processed', data: results });
});

const getPayrolls = asyncHandler(async (req, res) => {
  const filter = { ...orgFilter(req.user) };
  const financeRoles = [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_ADMIN,
    ROLES.HR_MANAGER,
    ROLES.FINANCE,
    ROLES.AUDITOR,
  ];

  if (!financeRoles.includes(req.user.role)) {
    const empId =
      typeof req.user.employee === 'object' ? req.user.employee?._id : req.user.employee;
    filter.employee = empId;
  } else if (req.query.employee) {
    filter.employee = req.query.employee;
  }

  if (req.query.month) filter.month = parseInt(req.query.month, 10);
  if (req.query.year) filter.year = parseInt(req.query.year, 10);
  if (req.query.status) filter.status = req.query.status;

  const payrolls = await Payroll.find(filter)
    .populate('employee', 'employeeId personal professional')
    .sort({ year: -1, month: -1 });

  res.json({ success: true, data: payrolls });
});

const getPayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id).populate(
    'employee',
    'employeeId personal professional'
  );
  if (!payroll) throw new ApiError(404, 'Payroll not found');
  res.json({ success: true, data: payroll });
});

const markPaid = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByIdAndUpdate(
    req.params.id,
    { status: 'Paid', paidAt: new Date() },
    { new: true }
  ).populate('employee', 'employeeId personal');

  if (!payroll) throw new ApiError(404, 'Payroll not found');
  res.json({ success: true, message: 'Payroll marked as paid', data: payroll });
});

const preview = asyncHandler(async (req, res) => {
  const { employeeId, month, year } = req.query;
  if (!employeeId || !month || !year) {
    throw new ApiError(400, 'employeeId, month, and year are required');
  }
  const calc = await calculateSalary(employeeId, parseInt(month, 10), parseInt(year, 10));
  res.json({
    success: true,
    data: {
      components: calc.components,
      netSalary: calc.netSalary,
      workingDays: calc.workingDays,
      presentDays: calc.presentDays,
      leaveDays: calc.leaveDays,
      overtimeHours: calc.overtimeHours,
    },
  });
});

const explain = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw new ApiError(404, 'Payroll not found');
  const explanation = await aiService.explainPayroll(payroll);
  res.json({ success: true, data: explanation });
});

module.exports = {
  generate,
  generateBulk,
  getPayrolls,
  getPayroll,
  markPaid,
  preview,
  explain,
};
