# Teacher Panel Backend

Complete backend system for Teacher role in National Youth Computer Center.

## Overview

The Teacher Panel is a branch-level system designed for teachers to:
- Mark student attendance for assigned batches
- Upload exam marks for assigned batches
- Upload recorded classes and study materials
- Create batch-specific notices
- View performance analytics (read-only)
- Access dashboard with class schedules and notifications

## Features

### ✅ Authentication
- Login with Teacher ID or Email + Password
- JWT-based authentication
- Branch and batch isolation enforced

### ✅ Dashboard
- Today's classes (assigned batches)
- Assigned courses & batches
- Today's student attendance summary
- Notifications (exams, class reminders, content alerts)

### ✅ Student Attendance
- Mark attendance for students in assigned batches only
- QR scan, Manual, or Face recognition (placeholder)
- Slot-based attendance
- Auto-detect Late status
- Duplicate prevention

### ✅ Batch Details
- View batch information (read-only)
- Student list for each batch
- Course syllabus
- Teacher information

### ✅ Exam & Marks Management
- View assigned exams
- Upload marks for students in assigned batches
- Support for written marks and MCQ marks
- Save as draft option
- View/edit existing marks

### ✅ Recorded Classes & Study Materials
- Upload videos or PDFs for assigned batches
- Batch-wise content organization
- Expiry date support
- Download disabled for students (streaming only)

### ✅ Notices
- Create batch-specific notices
- Class, exam, holiday notices
- Priority-based notifications

### ✅ Notifications
- Today's class reminders
- Exam duty alerts
- Marks pending alerts
- Content upload reminders

### ✅ Performance View
- Classes taken count
- Student attendance trend (6 months)
- Exam result performance (batch-wise)
- Read-only access

## Project Structure

```
Teacher/
├── config/
│   └── env.config.js          # Environment configuration
├── controllers/
│   ├── auth.controller.js     # Authentication
│   ├── dashboard.controller.js # Dashboard summary
│   ├── attendance.controller.js # Student attendance
│   ├── batch.controller.js     # Batch details (read-only)
│   ├── exam.controller.js      # Exams & marks management
│   ├── recordedClass.controller.js # Recorded classes upload
│   ├── notice.controller.js   # Batch notices
│   ├── notification.controller.js # Notifications
│   └── performance.controller.js # Performance view (read-only)
├── middlewares/
│   ├── auth.middleware.js      # JWT authentication
│   └── batchIsolation.middleware.js # Batch isolation
├── routes/
│   ├── auth.routes.js
│   ├── dashboard.routes.js
│   ├── attendance.routes.js
│   ├── batch.routes.js
│   ├── exam.routes.js
│   ├── recordedClass.routes.js
│   ├── notice.routes.js
│   ├── notification.routes.js
│   └── performance.routes.js
├── utils/
│   ├── jwt.js                  # JWT utilities
│   └── auditLogger.js          # Audit logging
├── docs/
│   └── Teacher_API.md          # Complete API documentation
├── app.js                      # Express app (mounted in root app.js)
└── README.md                   # This file
```

## API Endpoints

### Authentication
- `POST /api/teacher/login` - Teacher login

### Dashboard
- `GET /api/teacher/dashboard/summary` - Dashboard summary

### Attendance
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

## Access Rules

### ✅ Teacher CAN:
- Login with Teacher ID or Email
- View own dashboard
- Mark attendance for students in assigned batches
- View batch details (read-only)
- Upload marks for exams of assigned batches
- Upload recorded classes/materials for assigned batches
- Create batch notices for assigned batches
- View own performance analytics
- View notifications

### ❌ Teacher CANNOT:
- Access Admin settings
- Access Staff APIs
- Access Student APIs
- Access fees/payments
- Register students
- View salary information
- Access other teachers' batches
- Edit batch settings
- Finalize exam marks (admin handles)

## Batch Isolation

All queries are automatically scoped to the teacher's assigned batches:
- Middleware enforces batch isolation
- Teachers can only access data for batches assigned to them
- Batch assignment is verified on every request

## Attendance Marking

Teachers can mark attendance using:
- **QR Scan:** Student scans QR code from ID card
- **Manual:** Manual entry (if allowed by admin)
- **Face Recognition:** Placeholder-ready (not yet implemented)

Status is auto-determined:
- **Present:** On time
- **Late:** After batch start time
- **Absent:** Not marked (handled by system)

## Marks Upload

Teachers can upload marks for:
- Written exam marks
- MCQ marks
- Combined marks
- Remarks for each student

Features:
- Save as draft option
- Update existing marks
- Batch validation (only assigned batches)
- Auto-calculate percentage and pass/fail status

## Content Upload

Teachers can upload:
- **Videos:** Recorded class videos
- **PDFs:** Study materials, notes, assignments

Security:
- Download disabled for students
- Streaming only
- Expiry date support
- Batch-specific access

## Integration

The Teacher Panel is integrated with:
- **Admin Panel** - Shares models (Student, Attendance, Exam, Result, RecordedClass, Batch)
- **SuperAdmin Panel** - Shares models (Branch, Course)
- **Root app.js** - Mounted at `/api/teacher`

## Environment Variables

Required environment variables (shared with Admin/SuperAdmin):
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)

## Running the Server

The Teacher Panel runs as part of the unified server:

```bash
npm start
# or
npm run dev
```

Server runs on port 3000 (unified with SuperAdmin, Admin, Staff, and Student panels).

## API Documentation

Complete API documentation is available in:
- `Teacher/docs/Teacher_API.md`

## Security Features

- ✅ JWT authentication
- ✅ Branch & batch isolation middleware
- ✅ Role-based access control (TEACHER only)
- ✅ Password hashing (bcrypt)
- ✅ Input validation
- ✅ Batch assignment verification
- ✅ Audit logging for all actions

## Notes

- Teachers must be assigned to batches by Admin
- Batch assignment determines all access permissions
- Marks can be saved as draft and finalized by Admin
- Content uploads are batch-specific
- Performance view is read-only (no salary information)
- Face recognition is placeholder-ready for future implementation
