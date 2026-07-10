const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    clockIn: Date,
    clockOut: Date,
    workingHours: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half Day', 'Late', 'On Leave', 'Holiday', 'Pending Correction'],
      default: 'Present',
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      address: String,
    },
    correctionRequest: {
      requested: { type: Boolean, default: false },
      reason: String,
      requestedClockIn: Date,
      requestedClockOut: Date,
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', null],
        default: null,
      },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    notes: String,
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
