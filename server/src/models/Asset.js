const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    assetTag: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Laptop', 'Desktop', 'Monitor', 'Phone', 'Tablet', 'Furniture', 'Software', 'Other'],
      default: 'Other',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    status: {
      type: String,
      enum: ['Available', 'Assigned', 'Maintenance', 'Retired', 'Lost'],
      default: 'Available',
    },
    purchaseDate: Date,
    purchaseCost: Number,
    warrantyExpiry: Date,
    notes: String,
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Asset', assetSchema);
