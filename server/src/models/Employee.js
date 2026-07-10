const mongoose = require('mongoose');

const documentItemSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      required: true,
    },
    personal: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      mobile: { type: String },
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zip: String,
      },
      gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
      bloodGroup: String,
      dob: Date,
    },
    professional: {
      department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
      designation: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
      joiningDate: { type: Date, default: Date.now },
      manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
        default: 'Full-time',
      },
      salaryGrade: String,
      basicSalary: { type: Number, default: 0 },
    },
    documents: [documentItemSchema],
    status: {
      type: String,
      enum: ['Active', 'Probation', 'Permanent', 'Resigned', 'Archived'],
      default: 'Active',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

employeeSchema.virtual('fullName').get(function () {
  return `${this.personal?.firstName || ''} ${this.personal?.lastName || ''}`.trim();
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Employee', employeeSchema);
