const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    // Personal Information
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    }, // Keep for backward compatibility
    guardianName: {
      type: String,
      trim: true,
    },
    motherName: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      trim: true,
    },
    religion: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    // Contact Information
    mobileNumber: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    }, // Keep for backward compatibility
    whatsappNumber: {
      type: String,
      trim: true,
    },
    guardianMobile: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    // Address
    address: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    // Education
    lastQualification: {
      type: String,
      trim: true,
    },
    // Course Information
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    courseName: {
      type: String,
      trim: true,
    },
    courseType: {
      type: String,
      trim: true,
    },
    // Batch Information
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    batchTime: {
      type: String,
      enum: ['AM', 'PM', 'EVENING'],
      trim: true,
    },
    // Dates
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    }, // Keep for backward compatibility
    officeEntryDate: {
      type: Date,
      default: Date.now,
    },
    // Form Information
    formNumber: {
      type: String,
      trim: true,
    },
    receiptNumber: {
      type: String,
      trim: true,
    },
    // File URLs
    studentPhoto: {
      type: String,
      trim: true,
    },
    studentSignature: {
      type: String,
      trim: true,
    },
    officeSignature: {
      type: String,
      trim: true,
    },
    formScanImage: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'DROPPED'],
      default: 'PENDING',
    },
    totalFees: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPaymentDate: {
      type: Date,
    },
    qrCode: {
      type: String,
      trim: true,
    },
    idCardUrl: {
      type: String,
      trim: true,
    },
    registrationPdfUrl: {
      type: String,
      trim: true,
    },
    loginCredentials: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      password: {
        type: String,
      },
    },
    createdBy: {
      type: String,
      enum: ['ADMIN', 'STAFF'],
      required: true,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Indexes for performance
studentSchema.index({ branchId: 1, status: 1 });
// studentId already indexed via unique: true
studentSchema.index({ mobile: 1 });
studentSchema.index({ mobileNumber: 1 });
studentSchema.index({ studentName: 1 });
studentSchema.index({ courseName: 1 });
studentSchema.index({ formNumber: 1 });
studentSchema.index({ receiptNumber: 1 });

// Explicitly delete existing model if it exists to avoid conflicts with SuperAdmin Student model
// This ensures we always use the Admin Student model for Admin operations
if (mongoose.models.Student) {
  delete mongoose.models.Student;
}

// Register the Admin Student model
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
