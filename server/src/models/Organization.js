const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zip: String,
    },
    settings: {
      officeHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
      },
      leavePolicy: {
        casual: { type: Number, default: 12 },
        sick: { type: Number, default: 10 },
        earned: { type: Number, default: 15 },
        unpaid: { type: Number, default: 0 },
      },
      payrollSettings: {
        hraPercent: { type: Number, default: 20 },
        pfPercent: { type: Number, default: 12 },
        taxPercent: { type: Number, default: 10 },
        overtimeRate: { type: Number, default: 1.5 },
        workingHoursPerDay: { type: Number, default: 8 },
      },
    },
    logo: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
