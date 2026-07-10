const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    type: {
      type: String,
      enum: ['National', 'Regional', 'Company', 'Optional'],
      default: 'Company',
    },
  },
  { timestamps: true }
);

holidaySchema.index({ organization: 1, date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
