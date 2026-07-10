const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: Number,
      default: 1,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
  },
  { timestamps: true }
);

designationSchema.index({ organization: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('Designation', designationSchema);
