# Jatiya Yuva Computer Project - Complete Project Summary

**Version:** 1.0.0  
**Last Updated:** January 31, 2026  
**Project Type:** Multi-Module Backend System for Computer Training Center Management

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Flow & Workflows](#project-flow--workflows)
4. [Complete API Reference](#complete-api-reference)
5. [Data Models](#data-models)
6. [Security Features](#security-features)
7. [Integration Points](#integration-points)
8. [Technology Stack](#technology-stack)
9. [Deployment & Configuration](#deployment--configuration)

---

## Project Overview

**Jatiya Yuva Computer Project** is a comprehensive backend system for managing a multi-branch computer training center. The system supports five distinct user roles, each with specific access levels and functionalities:

- **SuperAdmin**: System-wide management across all branches
- **Admin**: Branch-level management and operations
- **Staff**: Student registration, attendance, follow-ups, and payment collection
- **Teacher**: Batch management, attendance marking, exam marks upload, and content delivery
- **Student**: Self-service portal for viewing attendance, fees, results, and accessing study materials

### Key Features

- ✅ Multi-branch support with strict isolation
- ✅ Complete student lifecycle management
- ✅ Multiple attendance tracking methods (QR, Manual, Face recognition placeholder)
- ✅ Comprehensive fee and payment management
- ✅ Exam and result management system
- ✅ Certificate generation and verification
- ✅ Recorded class and study material management
- ✅ Inquiry and lead management
- ✅ Comprehensive reporting system
- ✅ Audit logging for all actions
- ✅ Role-based access control (RBAC)

---

## Architecture

### Unified Server Architecture

The project uses a **single unified Express server** (`app.js`) that mounts all module routers:

```
app.js (Root Server - Port 3000)
├── /api/super-admin/* → SuperAdmin Router
├── /api/admin/* → Admin Router
├── /api/staff/* → Staff Router
├── /api/student/* → Student Router
├── /api/teacher/* → Teacher Router
└── /api/certificates/* → Public Certificate Verification
```

### Module Structure

Each module follows a consistent structure:

```
Module/
├── app.js              # Express router (mounted in root app.js)
├── config/
│   └── env.config.js   # Environment configuration
├── controllers/        # Business logic
├── routes/             # Route definitions
├── middlewares/        # Authentication & authorization
├── models/             # Database models (shared where appropriate)
├── utils/              # Utility functions
└── docs/               # API documentation
```

### Database Architecture

- **Single MongoDB Database**: `Jatiya_Yuva_Computer`
- **Shared Connection**: All modules use the same database connection (`db.js`)
- **Model Sharing**: Models are shared across modules where appropriate
  - SuperAdmin models: Branch, Course, User, SuperAdmin
  - Admin models: Student, Batch, Exam, Result, Attendance, Payment, Certificate, etc.
  - Shared models are imported from their respective locations

---

## Project Flow & Workflows

### 1. System Initialization Flow

```
1. SuperAdmin Signup
   ↓
2. Create Branches
   ↓
3. Create Branch Admins
   ↓
4. Create Courses (SuperAdmin or Admin with approval)
   ↓
5. Create Batches (Admin)
   ↓
6. Create Teachers & Staff (Admin)
   ↓
7. System Ready for Operations
```

### 2. Student Registration Flow

```
Option A: Admin Registration
├── Admin registers student → Status: ACTIVE
├── Auto-generates Student ID (BRANCH_CODE-YEAR-SEQUENCE)
├── Generates QR code
├── Creates login credentials
└── Student can immediately access portal

Option B: Staff Registration
├── Staff registers student → Status: PENDING
├── Auto-generates Student ID
├── Admin reviews and approves → Status: ACTIVE
└── Student can then access portal
```

### 3. Attendance Flow

```
Student Attendance:
├── QR Scan Method
│   ├── Student scans QR code from ID card
│   ├── System validates QR data
│   └── Marks attendance (Present/Late)
├── Manual Method
│   ├── Admin/Staff/Teacher manually marks
│   └── System records attendance
└── Face Recognition (Placeholder)
    └── Future integration ready

Staff Attendance:
├── QR Scan Method
│   ├── First scan → Check-in
│   └── Second scan → Check-out
└── Manual Method
    └── Admin marks attendance
```

### 4. Payment Flow

```
Payment Collection:
├── Admin Payment
│   ├── Can apply discounts
│   ├── Multiple payment modes (CASH, UPI, ONLINE)
│   └── Auto-updates student fees
├── Staff Payment
│   ├── Cannot apply discounts (limited)
│   ├── Multiple payment modes
│   └── Auto-updates student fees
└── Student Payment
    ├── Online modes only (UPI, ONLINE, QR, GATEWAY)
    ├── Requires transaction ID
    └── Auto-updates student fees
```

### 5. Exam & Result Flow

```
Exam Creation:
├── Admin creates exam
├── Assigns teacher (optional)
├── Exam scheduled for batch/course
└── Students notified

Marks Upload:
├── Teacher uploads marks for assigned batches
├── Supports written + MCQ marks
├── Can save as draft
├── Admin reviews and finalizes
└── Results visible to students

Certificate Generation:
├── Student completes course
├── Meets attendance requirement (75%)
├── Passes all required exams
├── Admin generates certificate
└── Certificate verified via public API
```

### 6. Batch Assignment Flow

```
Teacher Assignment:
├── Admin creates batch
├── Assigns teacher to batch
├── Teacher's assignedBatches array updated
└── Teacher can access batch data

Student Assignment:
├── Admin registers student
├── Assigns to batch during registration
├── OR assigns later via join-batch endpoint
├── Batch currentStudents count updated
└── Student can attend classes
```

### 7. Follow-up Flow

```
Absent Student Tracking:
├── Staff identifies absent students
├── Creates follow-up record
├── Records call status, reason, expected return
├── Updates follow-up status
└── Admin can view all follow-ups
```

---

## Complete API Reference

### Base URLs

- **SuperAdmin**: `/api/super-admin`
- **Admin**: `/api/admin`
- **Staff**: `/api/staff`
- **Student**: `/api/student`
- **Teacher**: `/api/teacher`
- **Public**: `/api/certificates`

### Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## SuperAdmin APIs

### Authentication
- `POST /api/super-admin/signup` - Create SuperAdmin account
- `POST /api/super-admin/login` - SuperAdmin login
- `POST /api/super-admin/logout` - Logout

### Dashboard
- `GET /api/super-admin/dashboard/summary` - System-wide summary
- `GET /api/super-admin/dashboard/graphs` - Analytics graphs

### Branch Management
- `POST /api/super-admin/branches` - Create branch
- `GET /api/super-admin/branches` - List all branches
- `POST /api/super-admin/branches/:id/update` - Update branch
- `POST /api/super-admin/branches/:id/lock` - Lock branch
- `POST /api/super-admin/branches/:id/unlock` - Unlock branch
- `POST /api/super-admin/branches/:id/soft-delete` - Soft delete branch
- `POST /api/super-admin/branches/:id/delete` - Hard delete branch

### Branch Admin Management
- `POST /api/super-admin/branch-admins` - Create branch admin
- `GET /api/super-admin/branch-admins` - List all branch admins
- `POST /api/super-admin/branch-admins/:id/update` - Update branch admin
- `POST /api/super-admin/branch-admins/:id/block` - Block branch admin
- `POST /api/super-admin/branch-admins/:id/unblock` - Unblock branch admin
- `POST /api/super-admin/branch-admins/:id/delete` - Delete branch admin
- `POST /api/super-admin/branch-admins/:id/reset-password` - Reset password

### Finance
- `GET /api/super-admin/finance/overview` - Finance overview
- `GET /api/super-admin/finance/export?type=pdf|excel` - Export finance data

### Master Settings
- `POST /api/super-admin/master/courses` - Create course
- `GET /api/super-admin/master/courses` - List all courses
- `POST /api/super-admin/master/courses/:id/update` - Update course
- `POST /api/super-admin/master/courses/:id/delete` - Delete course
- `POST /api/super-admin/master/courses/:id/approve` - Approve course
- `POST /api/super-admin/master/courses/:id/reject` - Reject course
- `GET /api/super-admin/master/courses/pending` - Get pending courses
- `POST /api/super-admin/master/fee-rules` - Set fee rules
- `POST /api/super-admin/master/discount-policy` - Set discount policy
- `POST /api/super-admin/master/exam-rules` - Set exam rules
- `POST /api/super-admin/master/certificate-template` - Set certificate template

### Certificate Control
- `POST /api/super-admin/certificates/template` - Set admin template
- `POST /api/super-admin/certificates/rules` - Set admin rules

### Leads & Marketing
- `GET /api/super-admin/leads` - Get leads
- `GET /api/super-admin/leads/analytics` - Lead analytics

### System Settings
- `POST /api/super-admin/system/backup` - System backup
- `POST /api/super-admin/system/permissions` - Set permissions
- `POST /api/super-admin/system/notifications` - Configure notifications

---

## Admin APIs

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Logout

### Dashboard
- `GET /api/admin/dashboard/summary` - Branch dashboard summary

### Student Management
- `POST /api/admin/students/manual` - Manual student registration
- `POST /api/admin/students/:id/approve` - Approve pending student
- `POST /api/admin/students/:id/drop` - Drop student
- `POST /api/admin/students/:id/reactivate` - Reactivate dropped student
- `POST /api/admin/students/:id/change-batch` - Change student batch
- `POST /api/admin/students/:studentId/join-batch` - Join student to batch
- `GET /api/admin/students` - Get all students (with filters)
- `GET /api/admin/students/:id` - Get student by ID

### Attendance
- `POST /api/admin/attendance/student` - Mark student attendance
- `POST /api/admin/attendance/staff` - Mark staff attendance
- `GET /api/admin/attendance/student` - Get student attendance
- `GET /api/admin/attendance/staff` - Get staff attendance
- `GET /api/admin/attendance/staff/:id` - Get staff attendance by ID
- `POST /api/admin/attendance/staff/:id/update` - Update staff attendance
- `POST /api/admin/attendance/staff/:id/delete` - Delete staff attendance
- `GET /api/admin/attendance/student/:id` - Get student attendance by ID
- `POST /api/admin/attendance/student/:id/update` - Update student attendance
- `POST /api/admin/attendance/student/:id/delete` - Delete student attendance

### Payments
- `POST /api/admin/payments` - Create payment
- `GET /api/admin/payments` - Get payments (with filters)
- `GET /api/admin/payments/:id` - Get payment by ID
- `POST /api/admin/payments/:id/update` - Update payment
- `POST /api/admin/payments/:id/delete` - Delete payment

### Courses
- `POST /api/admin/courses` - Create course
- `GET /api/admin/courses` - Get courses (with filters)

### Batches
- `POST /api/admin/batches` - Create batch
- `GET /api/admin/batches` - Get batches (with filters)
- `GET /api/admin/batches/:id` - Get batch by ID
- `POST /api/admin/batches/:id/update` - Update batch
- `POST /api/admin/batches/:id/delete` - Delete batch
- `POST /api/admin/batches/:id/assign-teacher` - Assign teacher to batch

### Staff Management
- `POST /api/admin/staff` - Create staff
- `GET /api/admin/staff` - Get staff (with filters)
- `GET /api/admin/staff/:id` - Get staff by ID
- `POST /api/admin/staff/:id/update` - Update staff
- `POST /api/admin/staff/:id/delete` - Delete staff

### Teacher Management
- `POST /api/admin/teachers` - Create teacher
- `GET /api/admin/teachers` - Get all teachers
- `GET /api/admin/teachers/:id` - Get teacher by ID
- `POST /api/admin/teachers/:id/update` - Update teacher
- `POST /api/admin/teachers/:id/delete` - Delete teacher

### Exams
- `POST /api/admin/exams` - Create exam
- `GET /api/admin/exams` - Get exams (with filters)
- `GET /api/admin/exams/:id` - Get exam by ID
- `POST /api/admin/exams/:id/update` - Update exam
- `POST /api/admin/exams/:id/assign-teacher` - Assign teacher to exam
- `POST /api/admin/exams/:id/delete` - Delete exam

### Results
- `POST /api/admin/results` - Create/update result
- `GET /api/admin/results` - Get results (with filters)
- `GET /api/admin/results/:id` - Get result by ID
- `POST /api/admin/results/:id/update` - Update result
- `POST /api/admin/results/:id/delete` - Delete result

### Certificates
- `POST /api/admin/certificates` - Generate certificate
- `GET /api/admin/certificates` - Get certificates (with filters)

### Inquiries
- `POST /api/admin/inquiries` - Create inquiry
- `GET /api/admin/inquiries` - Get inquiries (with filters)
- `GET /api/admin/inquiries/:id` - Get inquiry by ID
- `POST /api/admin/inquiries/:id/update` - Update inquiry
- `POST /api/admin/inquiries/:id/delete` - Delete inquiry
- `POST /api/admin/inquiries/:id/convert` - Convert inquiry to student

### Recorded Classes
- `POST /api/admin/recorded-classes` - Create recorded class
- `GET /api/admin/recorded-classes` - Get recorded classes (with filters)
- `GET /api/admin/recorded-classes/:id` - Get recorded class by ID
- `POST /api/admin/recorded-classes/:id/update` - Update recorded class
- `POST /api/admin/recorded-classes/:id/delete` - Delete recorded class

### Reports
- `GET /api/admin/reports/attendance` - Attendance report
- `GET /api/admin/reports/fees` - Fees report
- `GET /api/admin/reports/salary` - Salary report

---

## Staff APIs

### Authentication
- `POST /api/staff/login` - Staff login
- `POST /api/staff/logout` - Logout

### Dashboard
- `GET /api/staff/dashboard/summary` - Staff dashboard summary

### Self Attendance
- `POST /api/staff/attendance/self` - Mark self attendance (QR scan)

### Student Attendance
- `POST /api/staff/attendance/student` - Mark student attendance

### Student Registration
- `POST /api/staff/students/manual` - Manual student registration
- `POST /api/staff/students/scan-form` - Scan form (OCR placeholder)

### Follow-ups
- `GET /api/staff/absent-students` - Get absent students
- `GET /api/staff/follow-ups/absent-students` - Get absent students (alternative)
- `POST /api/staff/follow-ups` - Create follow-up
- `GET /api/staff/follow-ups` - Get follow-ups
- `PATCH /api/staff/follow-ups/:id` - Update follow-up

### Payments
- `POST /api/staff/payments` - Create payment (no discount)
- `GET /api/staff/payments` - Get payments (by staff)

### Inquiries
- `POST /api/staff/inquiries` - Create inquiry
- `GET /api/staff/inquiries` - Get inquiries
- `PATCH /api/staff/inquiries/:id/follow-up` - Update inquiry follow-up

### Salary
- `GET /api/staff/salary` - Get salary view (read-only)

### Reports
- `GET /api/staff/reports/attendance` - Attendance report
- `GET /api/staff/reports/follow-ups` - Follow-up report

### Batch Management
- `POST /api/admin/batches/:id/assign-teacher` - Assign teacher to batch (accessible to STAFF)

---

## Teacher APIs

### Authentication
- `POST /api/teacher/login` - Teacher login
- `POST /api/teacher/logout` - Logout

### Dashboard
- `GET /api/teacher/dashboard/summary` - Teacher dashboard summary

### Student Attendance
- `POST /api/teacher/attendance/student` - Mark student attendance

### Batches
- `GET /api/teacher/batches` - Get batch details (read-only)

### Exams & Marks
- `GET /api/teacher/exams` - Get assigned exams
- `GET /api/teacher/exams/:examId/marks` - Get exam marks (view/edit)
- `POST /api/teacher/exams/:examId/marks` - Upload marks

### Recorded Classes
- `POST /api/teacher/recorded-classes` - Upload recorded class/material
- `GET /api/teacher/recorded-classes` - Get recorded classes

### Notices
- `POST /api/teacher/notices` - Create batch notice
- `GET /api/teacher/notices` - Get notices

### Notifications
- `GET /api/teacher/notifications` - Get notifications & alerts

### Performance
- `GET /api/teacher/performance` - Get performance view (read-only)

---

## Student APIs

### Authentication
- `POST /api/student/login` - Student login
- `POST /api/student/logout` - Logout

### Dashboard
- `GET /api/student/dashboard/summary` - Student dashboard summary

### Profile & ID Card
- `GET /api/student/profile` - Get student profile
- `GET /api/student/profile/id-card` - Get ID card

### Attendance
- `GET /api/student/attendance` - Get attendance (view only)

### Fees
- `GET /api/student/fees` - Get fees status

### Payments
- `POST /api/student/payments` - Create online payment
- `GET /api/student/payments` - Get payment history
- `GET /api/student/payments/:id/receipt` - Download receipt

### Alerts
- `GET /api/student/alerts` - Get alerts

### Course & Batch
- `GET /api/student/course` - Get course & batch details

### Classes
- `GET /api/student/classes/live` - Get live classes (placeholder)
- `GET /api/student/classes/recorded` - Get recorded classes

### Exams
- `GET /api/student/exams` - Get exams

### Results
- `GET /api/student/results` - Get results

### Certificates
- `GET /api/student/certificates` - Get certificates
- `GET /api/student/certificates/:id/download` - Download certificate

### Notices
- `GET /api/student/notices` - Get notices & announcements

### Absence History
- `GET /api/student/absence-history` - Get absence history (view only)

---

## Public APIs

### Certificate Verification
- `GET /api/certificates/verify/:certificateId` - Verify certificate (public, no auth required)

---

## Data Models

### SuperAdmin Models

#### Branch
```javascript
{
  name: String,
  code: String (unique),
  addresses: [{
    areaname: String,
    city: String,
    pincode: String,
    location: { latitude: Number, longitude: Number }
  }],
  contactNumber: String,
  status: 'ACTIVE' | 'LOCKED',
  isDeleted: Boolean
}
```

#### Course
```javascript
{
  name: String,
  description: String,
  duration: String,
  courseCategory: 'Basic' | 'Advanced' | 'Diploma',
  courseFees: Number,
  admissionFees: Number,
  monthlyFees: Number,
  imageUrl: String (S3 URL),
  pdfUrl: String (S3 URL),
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED',
  createdBy: 'SUPER_ADMIN' | 'ADMIN',
  isActive: Boolean
}
```

#### User (Admin/Staff/Teacher)
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'ADMIN' | 'STAFF' | 'TEACHER',
  branchId: ObjectId (ref: Branch),
  isActive: Boolean
}
```

#### SuperAdmin
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'SUPER_ADMIN',
  isActive: Boolean
}
```

### Admin Models

#### Student
```javascript
{
  branchId: ObjectId (ref: Branch),
  studentId: String (unique, format: BRANCH_CODE-YEAR-SEQUENCE),
  studentName: String,
  guardianName: String,
  motherName: String,
  dateOfBirth: Date,
  gender: 'Male' | 'Female' | 'Other',
  religion: String,
  category: String,
  mobileNumber: String,
  whatsappNumber: String,
  guardianMobile: String,
  email: String,
  address: String,
  pincode: String,
  lastQualification: String,
  courseId: ObjectId (ref: Course),
  courseName: String,
  courseType: String,
  batchId: ObjectId (ref: Batch),
  batchTime: 'AM' | 'PM' | 'EVENING',
  admissionDate: Date,
  registrationDate: Date,
  officeEntryDate: Date,
  formNumber: String,
  receiptNumber: String,
  studentPhoto: String (URL),
  studentSignature: String (URL),
  officeSignature: String (URL),
  formScanImage: String (URL),
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'DROPPED',
  totalFees: Number,
  paidAmount: Number,
  dueAmount: Number,
  lastPaymentDate: Date,
  qrCode: String (data URL),
  idCardUrl: String (URL),
  registrationPdfUrl: String (URL),
  loginCredentials: {
    email: String,
    password: String (hashed)
  },
  createdBy: 'ADMIN' | 'STAFF',
  createdById: ObjectId (ref: User)
}
```

#### Batch
```javascript
{
  branchId: ObjectId (ref: Branch),
  name: String,
  timeSlot: String,
  monthlyFee: Number,
  isKidsBatch: Boolean,
  discountPercentage: Number,
  batchType: 'OFFLINE' | 'ONLINE' | 'HYBRID',
  teacherId: ObjectId (ref: Teacher),
  courseId: ObjectId (ref: Course),
  maxStudents: Number,
  currentStudents: Number,
  isActive: Boolean
}
```

#### Exam
```javascript
{
  branchId: ObjectId (ref: Branch),
  name: String,
  examType: 'MONTHLY' | '6M' | '1Y',
  courseId: ObjectId (ref: Course),
  batchId: ObjectId (ref: Batch),
  teacherId: ObjectId (ref: Teacher),
  examDate: Date,
  maxMarks: Number,
  passingMarks: Number,
  isActive: Boolean
}
```

#### Result
```javascript
{
  branchId: ObjectId (ref: Branch),
  examId: ObjectId (ref: Exam),
  studentId: ObjectId (ref: Student),
  marksObtained: Number,
  maxMarks: Number,
  percentage: Number,
  status: 'PASS' | 'FAIL',
  remarks: String
}
```

#### Attendance (Student)
```javascript
{
  branchId: ObjectId (ref: Branch),
  studentId: ObjectId (ref: Student),
  batchId: ObjectId (ref: Batch),
  date: Date,
  timeSlot: String,
  status: 'Present' | 'Absent' | 'Late',
  method: 'QR' | 'FACE' | 'MANUAL',
  markedBy: ObjectId (ref: User)
}
```

#### Attendance (Staff)
```javascript
{
  branchId: ObjectId (ref: Branch),
  staffId: ObjectId (ref: Staff),
  date: Date,
  checkIn: Date,
  checkOut: Date,
  timeSlot: String,
  status: 'Present' | 'Absent' | 'Late',
  method: 'QR' | 'FACE' | 'MANUAL',
  markedBy: ObjectId (ref: User)
}
```

#### Payment
```javascript
{
  branchId: ObjectId (ref: Branch),
  studentId: ObjectId (ref: Student),
  amount: Number,
  paymentMode: 'CASH' | 'UPI' | 'ONLINE',
  discount: Number,
  receiptNumber: String (format: BRANCH_CODE-YEARMONTH-SEQUENCE),
  month: String,
  year: Number,
  description: String,
  collectedBy: ObjectId (ref: User),
  receiptPdfUrl: String (URL)
}
```

#### Certificate
```javascript
{
  branchId: ObjectId (ref: Branch),
  studentId: ObjectId (ref: Student),
  courseId: ObjectId (ref: Course),
  certificateId: String (format: CERT-YEAR-SEQUENCE),
  issueDate: Date,
  verified: Boolean,
  qrCode: String (data URL),
  certificatePdfUrl: String (URL)
}
```

#### Staff
```javascript
{
  branchId: ObjectId (ref: Branch),
  staffId: String (unique, format: BRANCH_CODE-STF-SEQUENCE),
  name: String,
  email: String (unique),
  mobile: String,
  role: 'STAFF' | 'TEACHER',
  salaryType: 'PER_CLASS' | 'MONTHLY_FIXED' | 'HOURLY',
  salaryRate: Number,
  qrCode: String (data URL),
  idCardUrl: String (URL),
  loginCredentials: {
    email: String,
    password: String (hashed)
  },
  isActive: Boolean
}
```

#### Teacher
```javascript
{
  branchId: ObjectId (ref: Branch),
  teacherId: String (unique, format: BRANCH_CODE-TCH-SEQUENCE),
  name: String,
  email: String (unique),
  mobile: String,
  assignedBatches: [ObjectId] (ref: Batch),
  salaryType: 'PER_CLASS' | 'MONTHLY_FIXED' | 'HOURLY',
  salaryRate: Number,
  currentMonthClasses: Number,
  currentMonthSalary: Number,
  idCardUrl: String (URL),
  loginCredentials: {
    email: String,
    password: String (hashed)
  },
  isActive: Boolean
}
```

#### Inquiry
```javascript
{
  branchId: ObjectId (ref: Branch),
  name: String,
  mobile: String,
  email: String,
  address: String,
  courseInterest: String,
  source: String,
  status: 'NEW' | 'CONTACTED' | 'FOLLOW_UP' | 'CONVERTED' | 'LOST',
  notes: String,
  followUpNotes: String,
  convertedToStudentId: ObjectId (ref: Student),
  handledBy: ObjectId (ref: User),
  nextFollowUpDate: Date
}
```

#### RecordedClass
```javascript
{
  branchId: ObjectId (ref: Branch),
  batchId: ObjectId (ref: Batch),
  courseId: ObjectId (ref: Course),
  title: String,
  description: String,
  videoUrl: String (URL),
  pdfUrl: String (URL),
  thumbnailUrl: String (URL),
  duration: Number (seconds),
  expiryDate: Date,
  accessControl: {
    allowedStudents: [ObjectId] (ref: Student),
    allowDownload: Boolean
  },
  uploadedBy: ObjectId (ref: User),
  isActive: Boolean
}
```

#### FollowUp (Staff Model)
```javascript
{
  branchId: ObjectId (ref: Branch),
  studentId: ObjectId (ref: Student),
  staffId: ObjectId (ref: Staff),
  absentDate: Date,
  callStatus: 'Connected' | 'Not Reachable' | 'No Answer' | 'Busy',
  reason: 'Sick' | 'Personal' | 'Financial' | 'Not Interested' | 'Other',
  reasonDetails: String,
  expectedReturnDate: Date,
  remarks: String,
  followUpStatus: 'Pending' | 'Resolved' | 'Dropped',
  nextFollowUpDate: Date
}
```

#### Notice
```javascript
{
  branchId: ObjectId (ref: Branch),
  title: String,
  content: String,
  noticeType: 'CLASS' | 'EXAM' | 'HOLIDAY' | 'GENERAL' | 'PAYMENT',
  targetAudience: 'ALL' | 'BATCH' | 'COURSE' | 'STUDENT',
  targetBatchIds: [ObjectId] (ref: Batch),
  targetCourseIds: [ObjectId] (ref: Course),
  targetStudentIds: [ObjectId] (ref: Student),
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
  startDate: Date,
  endDate: Date,
  createdBy: 'ADMIN' | 'TEACHER',
  isActive: Boolean
}
```

#### AuditLog
```javascript
{
  branchId: ObjectId (ref: Branch),
  userId: ObjectId (ref: User),
  role: String,
  action: String,
  module: String,
  entityId: ObjectId,
  oldData: Object,
  newData: Object,
  ip: String,
  userAgent: String,
  timestamp: Date
}
```

---

## Security Features

### 1. Authentication & Authorization

- **JWT-based Authentication**: All modules use JWT tokens
- **Token Expiry**: Configurable (default: 7 days for Admin/Staff/Teacher, 30 days for Student/SuperAdmin)
- **Role-Based Access Control (RBAC)**: Strict role enforcement
- **Password Hashing**: bcrypt with configurable salt rounds (default: 10)

### 2. Data Isolation

- **Branch Isolation**: Admin/Staff/Teacher can only access their branch data
  - Enforced via middleware (`branchIsolation.middleware.js`)
  - Automatic filtering of all queries by `branchId`
  
- **Batch Isolation**: Teachers can only access assigned batches
  - Enforced via middleware (`batchIsolation.middleware.js`)
  - Batch assignment verification on every request
  
- **Student Isolation**: Students can only access their own data
  - Enforced via middleware (`studentIsolation.middleware.js`)
  - Automatic filtering by `studentId`

### 3. Input Validation

- Required field validation
- Data type validation
- Format validation (email, ObjectId, dates)
- Range validation (marks, fees, percentages)

### 4. Audit Logging

- All actions logged in `AuditLog` collection
- Includes: user, action, module, entity, IP, user agent, timestamp
- Enables tracking and compliance

### 5. Error Handling

- Environment-aware error messages
- Detailed errors in development
- Generic errors in production
- Proper HTTP status codes

### 6. File Upload Security

- File type validation
- File size limits
- AWS S3 integration for secure storage
- Local storage fallback

---

## Integration Points

### 1. Shared Models

Models are shared across modules:
- **SuperAdmin** → Branch, Course, User, SuperAdmin
- **Admin** → Student, Batch, Exam, Result, Attendance, Payment, Certificate, Staff, Teacher, Inquiry, RecordedClass
- **Staff** → Uses Admin models (Student, Attendance, Payment, Inquiry) + FollowUp model
- **Teacher** → Uses Admin models (Student, Batch, Exam, Result, Attendance, RecordedClass)
- **Student** → Uses Admin models (Student, Attendance, Payment, Exam, Result, Certificate, RecordedClass, Notice)

### 2. Database Connection

- Single MongoDB connection (`db.js`)
- Shared across all modules
- Connection pooling handled by Mongoose

### 3. JWT Token Sharing

- Same JWT secret across all modules
- Tokens can be validated across modules
- Role and branch information in token payload

### 4. File Storage

- AWS S3 for production (configurable)
- Local storage fallback
- Shared upload utilities

### 5. QR Code Generation

- Shared QR code utility
- Used for: Students, Staff, Certificates
- Contains JSON data with IDs

### 6. ID Generation

- Shared ID generation utilities
- Formats:
  - Student: `BRANCH_CODE-YEAR-SEQUENCE`
  - Staff: `BRANCH_CODE-STF-SEQUENCE`
  - Teacher: `BRANCH_CODE-TCH-SEQUENCE`
  - Receipt: `BRANCH_CODE-YEARMONTH-SEQUENCE`
  - Certificate: `CERT-YEAR-SEQUENCE`

---

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB with Mongoose 8.0.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 5.1.1
- **File Upload**: Multer 1.4.5-lts.1
- **QR Code**: qrcode 1.5.4

### Cloud Services
- **File Storage**: AWS S3 (via @aws-sdk/client-s3 3.758.0)
- **Storage**: multer-s3 3.0.1

### Development
- **Environment**: dotenv 16.3.1
- **Auto-reload**: nodemon 3.1.11

---

## Deployment & Configuration

### Environment Variables

Required environment variables (in root `.env` file):

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=Jatiya_Yuva_Computer

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=10

# AWS S3 Configuration (optional)
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name

# QR Code Configuration
QR_CODE_SIZE=200

# File Upload
MAX_FILE_SIZE=5242880
MAX_VIDEO_SIZE=104857600
```

### Running the Application

#### Unified Server (Recommended)
```bash
# Development
npm run dev

# Production
npm start
```

#### Individual Modules (Alternative)
```bash
# SuperAdmin only
npm run dev:superadmin

# Admin only
npm run dev:admin
```

### Health Check

```bash
GET /api/health
```

Returns status of all services and database connection.

---

## Key Workflows Summary

### Student Lifecycle
1. **Registration** → Admin/Staff registers student
2. **Approval** → Admin approves (if registered by Staff)
3. **Batch Assignment** → Student assigned to batch
4. **Attendance** → Daily attendance tracking
5. **Payments** → Fee collection and tracking
6. **Exams** → Exam scheduling and result recording
7. **Certificate** → Certificate generation upon completion

### Staff Workflow
1. **Check-in** → QR scan attendance
2. **Student Registration** → Register new students (PENDING status)
3. **Attendance Marking** → Mark student attendance
4. **Follow-ups** → Track absent students and create follow-ups
5. **Payment Collection** → Collect fees (limited - no discounts)
6. **Inquiry Management** → Handle inquiries and convert to students

### Teacher Workflow
1. **Login** → Access assigned batches only
2. **Attendance** → Mark attendance for assigned batches
3. **Marks Upload** → Upload exam marks for assigned batches
4. **Content Upload** → Upload recorded classes/materials
5. **Notices** → Create batch-specific notices
6. **Performance View** → View own performance (read-only)

### Admin Workflow
1. **Student Management** → Full CRUD operations
2. **Batch Management** → Create and manage batches
3. **Staff/Teacher Management** → Create and manage staff/teachers
4. **Exam Management** → Create exams and manage results
5. **Payment Management** → Full payment operations with discounts
6. **Certificate Generation** → Generate certificates
7. **Reports** → Generate comprehensive reports

### SuperAdmin Workflow
1. **Branch Management** → Create and manage branches
2. **Branch Admin Management** → Create and manage branch admins
3. **Course Management** → Create and approve courses
4. **System Settings** → Configure system-wide settings
5. **Finance Overview** → View system-wide finance data
6. **Analytics** → View system-wide analytics

---

## Notes & Best Practices

### 1. Branch Isolation
- Always enforced via middleware
- Never trust client-provided `branchId`
- Always use `req.branchId` from authenticated user

### 2. Batch Assignment
- Teachers must be assigned to batches before accessing batch data
- Batch assignment determines all teacher permissions
- Verify batch assignment on every request

### 3. Student Status
- `PENDING`: Registered by Staff, awaiting Admin approval
- `ACTIVE`: Approved and can access portal
- `INACTIVE`: Temporarily inactive
- `DROPPED`: Dropped from course

### 4. Payment Modes
- **Admin**: All modes (CASH, UPI, ONLINE) + discounts
- **Staff**: All modes but NO discounts
- **Student**: Online modes only (UPI, ONLINE, QR, GATEWAY)

### 5. File Uploads
- Supports both AWS S3 and local storage
- Falls back to local if S3 not configured
- File URLs are stored in database

### 6. Placeholders Ready for Integration
- **OCR**: Form scanning (Tesseract, Google Vision API)
- **PDF Generation**: Receipts and certificates (PDFKit, jsPDF)
- **Face Recognition**: Attendance marking (Face API, AWS Rekognition)
- **Live Classes**: Video streaming integration

### 7. ID Generation
- All IDs are auto-generated
- Format: `PREFIX-SEQUENCE` or `PREFIX-YEAR-SEQUENCE`
- Sequence numbers are auto-incremented

### 8. Audit Logging
- All create, update, delete operations logged
- Includes user, action, module, entity, IP, timestamp
- Essential for compliance and tracking

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

## Conclusion

This project provides a comprehensive backend system for managing a multi-branch computer training center. The modular architecture allows for easy maintenance and extension, while the unified server approach simplifies deployment and management.

All APIs are well-documented, security is enforced at multiple levels, and the system is designed to scale with the organization's growth.

For detailed API documentation, refer to:
- `SuperAdmin/docs/SuperAdmin_Api.md`
- `Admin/docs/Admin_API.md`
- `Teacher/docs/Teacher_API.md`
- `Staff/docs/Staff_API.md`
- `Student/docs/Student_API.md`

---

**End of Document**
