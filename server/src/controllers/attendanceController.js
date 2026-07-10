const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');
const { createNotification } = require('../services/notificationService');

const STANDARD_HOURS = 8;

const startOfDay = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const calcHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return { workingHours: 0, overtime: 0 };
  const ms = new Date(clockOut) - new Date(clockIn);
  const workingHours = Math.max(0, Math.round((ms / (1000 * 60 * 60)) * 100) / 100);
  const overtime = Math.max(0, Math.round((workingHours - STANDARD_HOURS) * 100) / 100);
  return { workingHours, overtime };
};

const resolveEmployeeId = async (req) => {
  if (req.body.employeeId || req.query.employeeId) {
    return req.body.employeeId || req.query.employeeId;
  }
  if (req.user.employee) {
    return typeof req.user.employee === 'object' ? req.user.employee._id : req.user.employee;
  }
  throw new ApiError(400, 'Employee profile required');
};

const clockIn = asyncHandler(async (req, res) => {
  const employeeId = await resolveEmployeeId(req);
  const today = startOfDay();

  let record = await Attendance.findOne({ employee: employeeId, date: today });
  if (record?.clockIn && !record.clockOut) {
    throw new ApiError(400, 'Already clocked in today');
  }
  if (record?.clockOut) {
    throw new ApiError(400, 'Attendance already completed for today');
  }

  const now = new Date();
  const officeStart = new Date(today);
  officeStart.setHours(9, 15, 0, 0);
  const status = now > officeStart ? 'Late' : 'Present';

  if (!record) {
    record = await Attendance.create({
      employee: employeeId,
      date: today,
      clockIn: now,
      status,
      location: req.body.location,
      organization: req.user.organization,
      notes: req.body.notes,
    });
  } else {
    record.clockIn = now;
    record.status = status;
    if (req.body.location) record.location = req.body.location;
    await record.save();
  }

  res.status(201).json({ success: true, message: 'Clocked in', data: record });
});

const clockOut = asyncHandler(async (req, res) => {
  const employeeId = await resolveEmployeeId(req);
  const today = startOfDay();
  const record = await Attendance.findOne({ employee: employeeId, date: today });

  if (!record || !record.clockIn) throw new ApiError(400, 'Please clock in first');
  if (record.clockOut) throw new ApiError(400, 'Already clocked out');

  record.clockOut = new Date();
  const { workingHours, overtime } = calcHours(record.clockIn, record.clockOut);
  record.workingHours = workingHours;
  record.overtime = overtime;
  if (workingHours < 4) record.status = 'Half Day';
  await record.save();

  res.json({ success: true, message: 'Clocked out', data: record });
});

const getAttendance = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.SUPER_ADMIN) {
    // no org filter required
  } else {
    filter.organization = req.user.organization;
  }

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
    if (!empId) throw new ApiError(400, 'Employee profile required');
    filter.employee = empId;
  } else if (req.query.employee) {
    filter.employee = req.query.employee;
  }

  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  const records = await Attendance.find(filter)
    .populate('employee', 'employeeId personal')
    .sort({ date: -1 })
    .limit(parseInt(req.query.limit, 10) || 100);

  res.json({ success: true, data: records });
});

const getToday = asyncHandler(async (req, res) => {
  const employeeId = await resolveEmployeeId(req);
  const record = await Attendance.findOne({
    employee: employeeId,
    date: startOfDay(),
  });
  res.json({ success: true, data: record });
});

const requestCorrection = asyncHandler(async (req, res) => {
  const { attendanceId, reason, requestedClockIn, requestedClockOut } = req.body;
  const record = await Attendance.findById(attendanceId);
  if (!record) throw new ApiError(404, 'Attendance record not found');

  record.correctionRequest = {
    requested: true,
    reason,
    requestedClockIn,
    requestedClockOut,
    status: 'Pending',
  };
  record.status = 'Pending Correction';
  await record.save();

  res.json({ success: true, message: 'Correction requested', data: record });
});

const reviewCorrection = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    throw new ApiError(400, 'Status must be Approved or Rejected');
  }

  const record = await Attendance.findById(req.params.id);
  if (!record || !record.correctionRequest?.requested) {
    throw new ApiError(404, 'Correction request not found');
  }

  record.correctionRequest.status = status;
  record.correctionRequest.reviewedBy = req.user._id;
  record.correctionRequest.reviewedAt = new Date();

  if (status === 'Approved') {
    if (record.correctionRequest.requestedClockIn) {
      record.clockIn = record.correctionRequest.requestedClockIn;
    }
    if (record.correctionRequest.requestedClockOut) {
      record.clockOut = record.correctionRequest.requestedClockOut;
    }
    const { workingHours, overtime } = calcHours(record.clockIn, record.clockOut);
    record.workingHours = workingHours;
    record.overtime = overtime;
    record.status = workingHours < 4 ? 'Half Day' : 'Present';
  } else {
    record.status = record.clockIn ? 'Present' : 'Absent';
  }

  await record.save();

  const employee = await Employee.findById(record.employee);
  if (employee?.user) {
    await createNotification({
      userId: employee.user,
      title: 'Attendance correction reviewed',
      message: `Your correction request was ${status.toLowerCase()}.`,
      type: 'attendance',
      io: req.app.get('io'),
    });
  }

  res.json({ success: true, message: `Correction ${status.toLowerCase()}`, data: record });
});

const upsertAttendance = asyncHandler(async (req, res) => {
  const { employee, date, clockIn, clockOut, status, notes } = req.body;
  if (!employee || !date) throw new ApiError(400, 'employee and date are required');

  const day = startOfDay(date);
  let record = await Attendance.findOne({ employee, date: day });
  const { workingHours, overtime } = calcHours(clockIn, clockOut);

  if (record) {
    Object.assign(record, {
      clockIn,
      clockOut,
      status,
      notes,
      workingHours,
      overtime,
    });
    await record.save();
  } else {
    record = await Attendance.create({
      employee,
      date: day,
      clockIn,
      clockOut,
      status: status || 'Present',
      notes,
      workingHours,
      overtime,
      organization: req.user.organization,
    });
  }

  res.json({ success: true, message: 'Attendance saved', data: record });
});

module.exports = {
  clockIn,
  clockOut,
  getAttendance,
  getToday,
  requestCorrection,
  reviewCorrection,
  upsertAttendance,
};
