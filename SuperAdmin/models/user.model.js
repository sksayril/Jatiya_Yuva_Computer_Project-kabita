const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
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
    originalPassword: {
      type: String,
      select: false, // Don't include by default in queries
    },
    role: {
      type: String,
      enum: ['ADMIN', 'STAFF', 'TEACHER'],
      required: [true, 'Role is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  // Keep originalPassword for SuperAdmin visibility
  return obj;
};

// Check if model already exists to avoid overwrite error
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;

