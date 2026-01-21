const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    addresses: [
      {
        areaname: {
          type: String,
          required: [true, 'Area name is required'],
          trim: true,
        },
        city: {
          type: String,
          required: [true, 'City is required'],
          trim: true,
        },
        pincode: {
          type: String,
          required: [true, 'Pincode is required'],
          trim: true,
        },
        location: {
          latitude: {
            type: Number,
            required: [true, 'Latitude is required'],
          },
          longitude: {
            type: Number,
            required: [true, 'Longitude is required'],
          },
        },
      },
    ],
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'LOCKED'],
      default: 'ACTIVE',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Check if model already exists to avoid overwrite error
const Branch = mongoose.models.Branch || mongoose.model('Branch', branchSchema);

module.exports = Branch;

