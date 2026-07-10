const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const aiService = require('../services/aiService');
const Attendance = require('../models/Attendance');
const Document = require('../models/Document');
const Payroll = require('../models/Payroll');
const Organization = require('../models/Organization');

const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new ApiError(400, 'message is required');

  let org = null;
  if (req.user.organization) {
    org = await Organization.findById(req.user.organization).select('name code settings');
  }

  const result = await aiService.chat(message, {
    role: req.user.role,
    org: org
      ? { name: org.name, code: org.code, officeHours: org.settings?.officeHours }
      : {},
    userId: req.user._id,
  });

  res.json({ success: true, data: result });
});

const analyzeResume = asyncHandler(async (req, res) => {
  const { text, requiredSkills } = req.body;
  if (!text) throw new ApiError(400, 'text is required');
  const result = await aiService.analyzeResume(text, requiredSkills || []);
  res.json({ success: true, data: result });
});

const summarizeDocument = asyncHandler(async (req, res) => {
  const { text, documentId } = req.body;
  let content = text;

  if (!content && documentId) {
    const doc = await Document.findById(documentId);
    if (!doc) throw new ApiError(404, 'Document not found');
    content = `Document title: ${doc.title}. Category: ${doc.category}. File: ${doc.fileName || doc.fileUrl}`;
  }

  if (!content) throw new ApiError(400, 'text or documentId is required');
  const result = await aiService.summarizeDocument(content);
  res.json({ success: true, data: result });
});

const explainPayroll = asyncHandler(async (req, res) => {
  const { payrollId, payroll } = req.body;
  let data = payroll;

  if (!data && payrollId) {
    data = await Payroll.findById(payrollId);
    if (!data) throw new ApiError(404, 'Payroll not found');
  }

  if (!data) throw new ApiError(400, 'payrollId or payroll object is required');
  const result = await aiService.explainPayroll(data);
  res.json({ success: true, data: result });
});

const attendanceInsights = asyncHandler(async (req, res) => {
  const employeeId =
    req.body.employeeId ||
    req.query.employeeId ||
    (typeof req.user.employee === 'object' ? req.user.employee?._id : req.user.employee);

  const filter = {};
  if (employeeId) filter.employee = employeeId;
  else if (req.user.organization) filter.organization = req.user.organization;

  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  const records = await Attendance.find(filter).sort({ date: -1 }).limit(90).lean();
  const result = await aiService.attendanceInsights(records);
  res.json({ success: true, data: result });
});

module.exports = {
  chat,
  analyzeResume,
  summarizeDocument,
  explainPayroll,
  attendanceInsights,
};
