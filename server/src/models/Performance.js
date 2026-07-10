const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    target: String,
    progress: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Deferred'],
      default: 'Not Started',
    },
  },
  { _id: true }
);

const performanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    quarter: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    year: {
      type: Number,
      required: true,
    },
    goals: [goalSchema],
    kpiScore: { type: Number, default: 0, min: 0, max: 100 },
    attendanceScore: { type: Number, default: 0, min: 0, max: 100 },
    managerRating: { type: Number, default: 0, min: 0, max: 5 },
    selfAssessment: String,
    overall: { type: Number, default: 0, min: 0, max: 100 },
    feedback: String,
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Reviewed', 'Finalized'],
      default: 'Draft',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  { timestamps: true }
);

performanceSchema.index({ employee: 1, quarter: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Performance', performanceSchema);
