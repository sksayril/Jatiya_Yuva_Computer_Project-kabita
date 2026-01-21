const mongoose = require('mongoose');

const superAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      default: 'SUPER_ADMIN',
      enum: ['SUPER_ADMIN'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Remove password from JSON output
superAdminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Check if model already exists to avoid overwrite error
const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', superAdminSchema);

module.exports = SuperAdmin;

