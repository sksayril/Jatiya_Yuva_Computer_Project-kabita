# Staff Panel Backend

Complete backend system for Staff role in National Youth Computer Center.

## Overview

The Staff Panel is a branch-level system designed for staff members to:
- Manage their own attendance (QR scan based)
- Register students (with PENDING status)
- Mark student attendance
- Track absent students and create follow-ups
- Collect fees (limited - no discounts)
- Manage inquiries
- View salary information (read-only)
- Generate reports (limited to own data)

## Features

### ✅ Authentication
- Login with Staff ID or Email + Password
- JWT-based authentication
- Branch isolation enforced

### ✅ Dashboard
- Self attendance status
- Today's absent students count
- Students registered by staff
- Pending follow-ups
- Notifications (high due, consecutive absent, pending inquiries)

### ✅ Self Attendance
- QR scan-based check-in/check-out
- Prevents duplicate scans
- Time-based attendance tracking

### ✅ Student Attendance
- Mark student attendance (QR/Manual)
- Slot-wise attendance
- Duplicate prevention

### ✅ Student Registration
- Manual registration (creates PENDING status)
- Form scan with OCR placeholder
- Auto-generates Student ID
- File uploads supported

### ✅ Absent Students & Follow-ups
- List absent students (today or consecutive days)
- Auto-flag drop-risk students
- Create follow-ups with call status, reason, expected return date
- Update follow-up status
- Permanent storage linked to staff and student

### ✅ Payment Collection
- Collect fees from students
- **Limited:** Cannot apply discounts
- Auto-generates receipt number
- Receipt PDF generation (placeholder)

### ✅ Inquiry Management
- Create inquiries
- Update follow-up notes
- Track inquiry status

### ✅ Salary View
- Read-only salary information
- Attendance-based calculation
- Month-wise breakdown (last 6 months)
- Supports PER_CLASS, MONTHLY_FIXED, HOURLY salary types

### ✅ Reports
- Attendance report (own data)
- Follow-up report (own data)
- Summary statistics

## Project Structure

```
Staff/
├── config/
│   └── env.config.js          # Environment configuration
├── controllers/
│   ├── auth.controller.js     # Authentication
│   ├── dashboard.controller.js # Dashboard summary
│   ├── attendance.controller.js # Self & student attendance
│   ├── student.controller.js   # Student registration
│   ├── followUp.controller.js  # Absent students & follow-ups
│   ├── payment.controller.js   # Payment collection (limited)
│   ├── inquiry.controller.js   # Inquiry management
│   ├── salary.controller.js    # Salary view (read-only)
│   └── report.controller.js    # Reports
├── middlewares/
│   ├── auth.middleware.js      # JWT authentication
│   └── branchIsolation.middleware.js # Branch isolation
├── models/
│   └── followUp.model.js       # Follow-up model
├── routes/
│   ├── auth.routes.js
│   ├── dashboard.routes.js
│   ├── attendance.routes.js
│   ├── student.routes.js
│   ├── followUp.routes.js
│   ├── payment.routes.js
│   ├── inquiry.routes.js
│   ├── salary.routes.js
│   └── report.routes.js
├── utils/
│   ├── jwt.js                  # JWT utilities
│   └── auditLogger.js          # Audit logging
├── docs/
│   └── Staff_API.md            # Complete API documentation
├── app.js                      # Express app (mounted in root app.js)
└── README.md                   # This file
```

## API Endpoints

### Authentication
- `POST /api/staff/login` - Staff login

### Dashboard
- `GET /api/staff/dashboard/summary` - Dashboard summary

### Attendance
- `POST /api/staff/attendance/self` - Mark self attendance (QR scan)
- `POST /api/staff/attendance/student` - Mark student attendance

### Student Management
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

## Access Rules

### ✅ Staff CAN:
- Login with Staff ID or Email
- View own dashboard
- Mark own attendance (QR scan)
- Mark student attendance
- Register students (creates PENDING status)
- Create and update follow-ups
- Collect fees (without discounts)
- Create and manage inquiries
- View own salary information
- View reports (own data only)

### ❌ Staff CANNOT:
- Access Admin settings
- Access Super Admin APIs
- Access other branch data
- Edit fees or apply discounts
- Delete students
- Approve pending students (admin only)
- Modify salary information
- View other staff's data

## Branch Isolation

All queries are automatically scoped to the staff's branch:
- Middleware enforces branch isolation
- Staff can only access data from their assigned branch
- Branch ID is automatically added to all queries

## Student Registration Flow

1. Staff registers student → Status: `PENDING`
2. Admin reviews and approves → Status: `ACTIVE`
3. Student can then attend classes and make payments

## Follow-up System

Follow-ups are permanently stored and include:
- Student ID
- Absent date
- Call status (Connected / Not Reachable / No Answer / Busy)
- Reason (Sick / Personal / Financial / Not Interested / Other)
- Expected return date
- Remarks
- Follow-up status (Pending / Resolved / Dropped)

## Payment Collection

Staff can collect fees but with limitations:
- ✅ Can collect full or partial payments
- ✅ Receipt auto-generated
- ❌ Cannot apply discounts
- ❌ Cannot modify fee rules
- ✅ All payments logged under staff ID

## Integration

The Staff Panel is integrated with:
- **Admin Panel** - Shares models (Student, Attendance, Payment, Inquiry)
- **SuperAdmin Panel** - Shares models (Branch, Course)
- **Root app.js** - Mounted at `/api/staff`

## Environment Variables

Required environment variables (shared with Admin/SuperAdmin):
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)

## Running the Server

The Staff Panel runs as part of the unified server:

```bash
npm start
# or
npm run dev
```

Server runs on port 3000 (unified with SuperAdmin and Admin panels).

## API Documentation

Complete API documentation is available in:
- `Staff/docs/Staff_API.md`

## Security Features

- ✅ JWT authentication
- ✅ Branch isolation middleware
- ✅ Role-based access control (STAFF only)
- ✅ Audit logging for all actions
- ✅ Password hashing (bcrypt)
- ✅ Input validation

## Notes

- Staff-registered students require admin approval
- Follow-ups are permanent and visible to admin
- Salary view is read-only
- All file uploads support both S3 and local storage
- OCR integration is placeholder-ready
