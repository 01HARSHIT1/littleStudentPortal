const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const Payroll = require('../models/Payroll');
const ApiError = require('../utils/ApiError');

const getMonthRange = (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

const countWorkingDays = (month, year) => {
  const { start, end } = getMonthRange(month, year);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const calculateSalary = async (employeeId, month, year, extras = {}) => {
  const employee = await Employee.findById(employeeId).populate('organization');
  if (!employee) throw new ApiError(404, 'Employee not found');

  const org =
    (employee.organization && employee.organization.settings
      ? employee.organization
      : await Organization.findById(employee.organization)) || {};

  const settings = org.settings?.payrollSettings || {
    hraPercent: 20,
    pfPercent: 12,
    taxPercent: 10,
    overtimeRate: 1.5,
    workingHoursPerDay: 8,
  };

  const { start, end } = getMonthRange(month, year);
  const attendance = await Attendance.find({
    employee: employeeId,
    date: { $gte: start, $lte: end },
  });

  const leaves = await Leave.find({
    employee: employeeId,
    status: 'Approved',
    startDate: { $lte: end },
    endDate: { $gte: start },
  });

  const presentDays = attendance.filter((a) =>
    ['Present', 'Late', 'Half Day'].includes(a.status)
  ).length;
  const halfDays = attendance.filter((a) => a.status === 'Half Day').length;
  const effectivePresent = presentDays - halfDays * 0.5;
  const leaveDays = leaves.reduce((sum, l) => sum + (l.days || 0), 0);
  const overtimeHours = attendance.reduce((sum, a) => sum + (a.overtime || 0), 0);
  const workingDays = countWorkingDays(month, year);

  const basic = Number(employee.professional?.basicSalary || 0);
  const dailyRate = workingDays > 0 ? basic / workingDays : 0;
  const payableBasic = Math.round(dailyRate * Math.min(effectivePresent + leaveDays, workingDays));

  const hra = Math.round((payableBasic * (settings.hraPercent || 20)) / 100);
  const hourlyRate = settings.workingHoursPerDay
    ? payableBasic / (workingDays * settings.workingHoursPerDay)
    : 0;
  const overtimePay = Math.round(overtimeHours * hourlyRate * (settings.overtimeRate || 1.5));
  const bonus = Number(extras.bonus || 0);
  const otherDeductions = Number(extras.deductions || 0);

  const gross = payableBasic + hra + overtimePay + bonus;
  const pf = Math.round((payableBasic * (settings.pfPercent || 12)) / 100);
  const tax = Math.round((gross * (settings.taxPercent || 10)) / 100);
  const netSalary = Math.max(0, gross - pf - tax - otherDeductions);

  return {
    employee,
    components: {
      basic: payableBasic,
      hra,
      bonus,
      overtime: overtimePay,
      deductions: otherDeductions,
      pf,
      tax,
    },
    netSalary,
    workingDays,
    presentDays: effectivePresent,
    leaveDays,
    overtimeHours,
  };
};

const generatePayroll = async ({
  employeeId,
  month,
  year,
  organizationId,
  generatedBy,
  bonus = 0,
  deductions = 0,
}) => {
  const existing = await Payroll.findOne({ employee: employeeId, month, year });
  if (existing && existing.status === 'Paid') {
    throw new ApiError(400, 'Payroll already paid for this period');
  }

  const calc = await calculateSalary(employeeId, month, year, { bonus, deductions });

  const payload = {
    employee: employeeId,
    month,
    year,
    components: calc.components,
    netSalary: calc.netSalary,
    workingDays: calc.workingDays,
    presentDays: calc.presentDays,
    leaveDays: calc.leaveDays,
    overtimeHours: calc.overtimeHours,
    organization: organizationId || calc.employee.organization,
    generatedBy,
    status: 'Generated',
  };

  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return existing;
  }

  return Payroll.create(payload);
};

module.exports = {
  calculateSalary,
  generatePayroll,
  getMonthRange,
  countWorkingDays,
};
