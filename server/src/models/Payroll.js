const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    components: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      overtime: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      pf: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
    },
    netSalary: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Generated', 'Paid', 'Cancelled'],
      default: 'Draft',
    },
    payslipUrl: String,
    workingDays: Number,
    presentDays: Number,
    leaveDays: Number,
    overtimeHours: Number,
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paidAt: Date,
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
