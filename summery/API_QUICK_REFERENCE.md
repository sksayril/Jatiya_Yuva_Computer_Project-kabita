# API Quick Reference Guide

**Quick lookup guide for all API endpoints in the Jatiya Yuva Computer Project**

---

## SuperAdmin APIs (`/api/super-admin`)

### Authentication
- `POST /signup` - Create SuperAdmin
- `POST /login` - Login
- `POST /logout` - Logout

### Dashboard
- `GET /dashboard/summary` - System summary
- `GET /dashboard/graphs` - Analytics graphs

### Branches
- `POST /branches` - Create
- `GET /branches` - List all
- `POST /branches/:id/update` - Update
- `POST /branches/:id/lock` - Lock
- `POST /branches/:id/unlock` - Unlock
- `POST /branches/:id/soft-delete` - Soft delete
- `POST /branches/:id/delete` - Hard delete

### Branch Admins
- `POST /branch-admins` - Create
- `GET /branch-admins` - List all
- `POST /branch-admins/:id/update` - Update
- `POST /branch-admins/:id/block` - Block
- `POST /branch-admins/:id/unblock` - Unblock
- `POST /branch-admins/:id/delete` - Delete
- `POST /branch-admins/:id/reset-password` - Reset password

### Finance
- `GET /finance/overview` - Overview
- `GET /finance/export?type=pdf|excel` - Export

### Master Settings
- `POST /master/courses` - Create course
- `GET /master/courses` - List courses
- `POST /master/courses/:id/update` - Update course
- `POST /master/courses/:id/delete` - Delete course
- `POST /master/courses/:id/approve` - Approve course
- `POST /master/courses/:id/reject` - Reject course
- `GET /master/courses/pending` - Pending courses
- `POST /master/fee-rules` - Set fee rules
- `POST /master/discount-policy` - Set discount policy
- `POST /master/exam-rules` - Set exam rules
- `POST /master/certificate-template` - Set template

### Certificates
- `POST /certificates/template` - Set template
- `POST /certificates/rules` - Set rules

### Leads
- `GET /leads` - List leads
- `GET /leads/analytics` - Analytics

### System
- `POST /system/backup` - Backup
- `POST /system/permissions` - Permissions
- `POST /system/notifications` - Notifications

---

## Admin APIs (`/api/admin`)

### Authentication
- `POST /login` - Login
- `POST /logout` - Logout

### Dashboard
- `GET /dashboard/summary` - Summary

### Students
- `POST /students/manual` - Register
- `POST /students/:id/approve` - Approve
- `POST /students/:id/drop` - Drop
- `POST /students/:id/reactivate` - Reactivate
- `POST /students/:id/change-batch` - Change batch
- `POST /students/:studentId/join-batch` - Join batch
- `GET /students` - List (with filters)
- `GET /students/:id` - Get by ID

### Attendance
- `POST /attendance/student` - Mark student
- `POST /attendance/staff` - Mark staff
- `GET /attendance/student` - Get student (with filters)
- `GET /attendance/staff` - Get staff (with filters)
- `GET /attendance/staff/:id` - Get staff by ID
- `POST /attendance/staff/:id/update` - Update staff
- `POST /attendance/staff/:id/delete` - Delete staff
- `GET /attendance/student/:id` - Get student by ID
- `POST /attendance/student/:id/update` - Update student
- `POST /attendance/student/:id/delete` - Delete student

### Payments
- `POST /payments` - Create
- `GET /payments` - List (with filters)
- `GET /payments/:id` - Get by ID
- `POST /payments/:id/update` - Update
- `POST /payments/:id/delete` - Delete

### Courses
- `POST /courses` - Create
- `GET /courses` - List (with filters)

### Batches
- `POST /batches` - Create
- `GET /batches` - List (with filters)
- `GET /batches/:id` - Get by ID
- `POST /batches/:id/update` - Update
- `POST /batches/:id/delete` - Delete
- `POST /batches/:id/assign-teacher` - Assign teacher

### Staff
- `POST /staff` - Create
- `GET /staff` - List (with filters)
- `GET /staff/:id` - Get by ID
- `POST /staff/:id/update` - Update
- `POST /staff/:id/delete` - Delete

### Teachers
- `POST /teachers` - Create
- `GET /teachers` - List (with filters)
- `GET /teachers/:id` - Get by ID
- `POST /teachers/:id/update` - Update
- `POST /teachers/:id/delete` - Delete

### Exams
- `POST /exams` - Create
- `GET /exams` - List (with filters)
- `GET /exams/:id` - Get by ID
- `POST /exams/:id/update` - Update
- `POST /exams/:id/assign-teacher` - Assign teacher
- `POST /exams/:id/delete` - Delete

### Results
- `POST /results` - Create/update
- `GET /results` - List (with filters)
- `GET /results/:id` - Get by ID
- `POST /results/:id/update` - Update
- `POST /results/:id/delete` - Delete

### Certificates
- `POST /certificates` - Generate
- `GET /certificates` - List (with filters)

### Inquiries
- `POST /inquiries` - Create
- `GET /inquiries` - List (with filters)
- `GET /inquiries/:id` - Get by ID
- `POST /inquiries/:id/update` - Update
- `POST /inquiries/:id/delete` - Delete
- `POST /inquiries/:id/convert` - Convert to student

### Recorded Classes
- `POST /recorded-classes` - Create
- `GET /recorded-classes` - List (with filters)
- `GET /recorded-classes/:id` - Get by ID
- `POST /recorded-classes/:id/update` - Update
- `POST /recorded-classes/:id/delete` - Delete

### Reports
- `GET /reports/attendance` - Attendance report
- `GET /reports/fees` - Fees report
- `GET /reports/salary` - Salary report

---

## Staff APIs (`/api/staff`)

### Authentication
- `POST /login` - Login
- `POST /logout` - Logout

### Dashboard
- `GET /dashboard/summary` - Summary

### Self Attendance
- `POST /attendance/self` - Mark self (QR scan)

### Student Attendance
- `POST /attendance/student` - Mark student

### Student Registration
- `POST /students/manual` - Register (creates PENDING)
- `POST /students/scan-form` - Scan form (OCR placeholder)

### Follow-ups
- `GET /absent-students` - Get absent students
- `GET /follow-ups/absent-students` - Alternative route
- `POST /follow-ups` - Create follow-up
- `GET /follow-ups` - List (with filters)
- `PATCH /follow-ups/:id` - Update follow-up

### Payments
- `POST /payments` - Create (no discount)
- `GET /payments` - List (by staff)

### Inquiries
- `POST /inquiries` - Create
- `GET /inquiries` - List (with filters)
- `PATCH /inquiries/:id/follow-up` - Update follow-up

### Salary
- `GET /salary` - View (read-only)

### Reports
- `GET /reports/attendance` - Attendance report
- `GET /reports/follow-ups` - Follow-up report

### Batch Management
- `POST /admin/batches/:id/assign-teacher` - Assign teacher (accessible to STAFF)

---

## Teacher APIs (`/api/teacher`)

### Authentication
- `POST /login` - Login
- `POST /logout` - Logout

### Dashboard
- `GET /dashboard/summary` - Summary

### Student Attendance
- `POST /attendance/student` - Mark attendance

### Batches
- `GET /batches` - Get batch details (read-only)

### Exams & Marks
- `GET /exams` - Get assigned exams
- `GET /exams/:examId/marks` - Get exam marks
- `POST /exams/:examId/marks` - Upload marks

### Recorded Classes
- `POST /recorded-classes` - Upload class/material
- `GET /recorded-classes` - List (with filters)

### Notices
- `POST /notices` - Create batch notice
- `GET /notices` - List (with filters)

### Notifications
- `GET /notifications` - Get notifications

### Performance
- `GET /performance` - View (read-only)

---

## Student APIs (`/api/student`)

### Authentication
- `POST /login` - Login
- `POST /logout` - Logout

### Dashboard
- `GET /dashboard/summary` - Summary

### Profile
- `GET /profile` - Get profile
- `GET /profile/id-card` - Get ID card

### Attendance
- `GET /attendance` - View (read-only)

### Fees
- `GET /fees` - Get fees status

### Payments
- `POST /payments` - Create online payment
- `GET /payments` - Get payment history
- `GET /payments/:id/receipt` - Download receipt

### Alerts
- `GET /alerts` - Get alerts

### Course & Batch
- `GET /course` - Get course & batch details

### Classes
- `GET /classes/live` - Get live classes (placeholder)
- `GET /classes/recorded` - Get recorded classes

### Exams
- `GET /exams` - Get exams

### Results
- `GET /results` - Get results

### Certificates
- `GET /certificates` - Get certificates
- `GET /certificates/:id/download` - Download certificate

### Notices
- `GET /notices` - Get notices

### Absence History
- `GET /absence-history` - Get absence history (read-only)

---

## Public APIs

### Certificate Verification
- `GET /api/certificates/verify/:certificateId` - Verify certificate (no auth)

---

## Common Query Parameters

### Filtering
- `status` - Filter by status (varies by endpoint)
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `batchId` - Filter by batch
- `courseId` - Filter by course
- `studentId` - Filter by student
- `staffId` - Filter by staff
- `isActive` - Filter by active status

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Examples
```
GET /api/admin/students?status=ACTIVE&batchId=<ID>
GET /api/admin/payments?startDate=2024-01-01&endDate=2024-01-31
GET /api/teacher/exams?status=upcoming
GET /api/staff/follow-ups?status=Pending&page=1&limit=20
```

---

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Authentication Header Format

```
Authorization: Bearer <JWT_TOKEN>
```

---

## Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Error message",
  "error": "Details (development only)"
}
```

---

## Health Check

```
GET /api/health
```

Returns status of all services and database connection.

---

**For detailed API documentation, see:**
- `SuperAdmin/docs/SuperAdmin_Api.md`
- `Admin/docs/Admin_API.md`
- `Teacher/docs/Teacher_API.md`
- `Staff/docs/Staff_API.md`
- `Student/docs/Student_API.md`
