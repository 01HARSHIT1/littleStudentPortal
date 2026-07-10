const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    round: String,
    scheduledAt: Date,
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    feedback: String,
    score: Number,
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
      default: 'Scheduled',
    },
  },
  { _id: true }
);

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: String,
    experience: { type: Number, default: 0 },
    skills: [String],
    resumeUrl: String,
    status: {
      type: String,
      enum: [
        'Applied',
        'Screening',
        'Technical',
        'HR Interview',
        'Offer',
        'Accepted',
        'Rejected',
        'Joined',
      ],
      default: 'Applied',
    },
    aiAnalysis: {
      summary: String,
      matchScore: Number,
      strengths: [String],
      gaps: [String],
      recommendation: String,
      analyzedAt: Date,
    },
    interviews: [interviewSchema],
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    appliedFor: String,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Candidate', candidateSchema);
