# Teacher Panel API Documentation

Complete API documentation for the Teacher Panel of National Youth Computer Center.

**Base URL:** `http://localhost:3000/api/teacher`

**Authentication:** All endpoints (except login) require JWT token in header: `Authorization: Bearer <token>`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [My Attendance](#my-attendance)
4. [My Profile](#my-profile)
5. [Student Attendance](#student-attendance)
6. [Batch Details](#batch-details)
7. [Exams & Marks Management](#exams--marks-management)
8. [Recorded Classes & Study Materials](#recorded-classes--study-materials)
9. [Notices](#notices)
10. [Notifications](#notifications)
11. [Performance View](#performance-view)

---

## Authentication

### Teacher Login
**Method:** `POST`  
**URL:** `/api/teacher/login`  
**Body (raw JSON):**
```json
{
  "teacherId": "DHK001-TCH-001",
  "password": "password123"
}
```
**OR**
```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "TEACHER",
    "branchId": "507f1f77bcf86cd799439011",
    "teacherId": "DHK001-TCH-001",
    "name": "John Teacher",
    "email": "teacher@example.com",
    "assignedBatches": [
      "507f1f77bcf86cd799439012",
      "507f1f77bcf86cd799439013"
    ]
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Note:** OTP login is placeholder-ready but not yet implemented.

---

### Teacher Logout
**Method:** `POST`  
**URL:** `/api/teacher/logout`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**Note:** This is a stateless logout endpoint. The client should delete the JWT token from storage (localStorage, sessionStorage, or secure cookie) after receiving a successful logout response.

---

## Dashboard

### Get Dashboard Summary
**Method:** `GET`  
**URL:** `/api/teacher/dashboard/summary`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "teacher": {
      "_id": "507f1f77bcf86cd799439010",
      "teacherId": "DHK001-TCH-001",
      "name": "John Teacher",
      "email": "teacher@example.com",
      "mobile": "1234567890"
    },
    "branch": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Dhaka Branch",
      "code": "DHK001"
    },
    "todayClasses": [
      {
        "batchId": "507f1f77bcf86cd799439012",
        "batchName": "Morning Batch",
        "timeSlot": "6:00 AM - 8:00 AM",
        "courseId": "507f1f77bcf86cd799439011",
        "courseName": "DCA",
        "weekdays": ["Monday", "Wednesday", "Friday"]
      }
    ],
    "upcomingClasses": [
      {
        "date": "2024-01-25",
        "dayName": "Thursday",
        "batchId": "507f1f77bcf86cd799439012",
        "batchName": "Morning Batch",
        "timeSlot": "6:00 AM - 8:00 AM",
        "courseId": "507f1f77bcf86cd799439011",
        "courseName": "DCA"
      },
      {
        "date": "2024-01-26",
        "dayName": "Friday",
        "batchId": "507f1f77bcf86cd799439012",
        "batchName": "Morning Batch",
        "timeSlot": "6:00 AM - 8:00 AM",
        "courseId": "507f1f77bcf86cd799439011",
        "courseName": "DCA"
      }
    ],
    "assignedCourses": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "DCA",
        "category": "Certificate"
      }
    ],
    "assignedBatches": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Morning Batch",
        "timeSlot": "6:00 AM - 8:00 AM",
        "weekdays": ["Monday", "Wednesday", "Friday"]
      }
    ],
    "todayAttendance": {
      "total": 25,
      "present": 20,
      "absent": 3,
      "late": 2,
      "totalStudents": 25,
      "attendancePercentage": 80
    },
    "myAttendance": {
      "thisWeek": {
        "totalDays": 5,
        "present": 4,
        "absent": 1,
        "totalHours": 32.5
      },
      "thisMonth": {
        "totalDays": 20,
        "present": 18,
        "absent": 2,
        "totalHours": 144.0
      },
      "attendancePercentage": 80
    },
    "thisWeekHours": 32.5,
    "graphData": [
      {
        "date": "2024-01-19",
        "dayName": "Friday",
        "present": 1,
        "absent": 0,
        "hours": 8.0
      },
      {
        "date": "2024-01-20",
        "dayName": "Saturday",
        "present": 0,
        "absent": 0,
        "hours": 0
      },
      {
        "date": "2024-01-21",
        "dayName": "Sunday",
        "present": 0,
        "absent": 0,
        "hours": 0
      },
      {
        "date": "2024-01-22",
        "dayName": "Monday",
        "present": 1,
        "absent": 0,
        "hours": 8.5
      },
      {
        "date": "2024-01-23",
        "dayName": "Tuesday",
        "present": 0,
        "absent": 0,
        "hours": 0
      },
      {
        "date": "2024-01-24",
        "dayName": "Wednesday",
        "present": 1,
        "absent": 0,
        "hours": 8.0
      },
      {
        "date": "2024-01-25",
        "dayName": "Thursday",
        "present": 1,
        "absent": 0,
        "hours": 8.0
      }
    ],
    "notifications": [
      {
        "type": "CLASS_REMINDER",
        "message": "You have 1 class(es) today",
        "batches": ["Morning Batch"],
        "priority": "MEDIUM"
      },
      {
        "type": "UPCOMING_EXAM",
        "message": "2 upcoming exam(s) for your batches",
        "exams": [
          {
            "name": "Monthly Test",
            "type": "Monthly",
            "date": "2024-01-25T10:00:00.000Z"
          }
        ],
        "priority": "HIGH"
      }
    ]
  }
}
```

**Response Fields:**
- `teacher` - Teacher information (name, teacherId, email, mobile)
- `branch` - Branch information (name, code)
- `todayClasses` - Today's scheduled classes based on batch weekdays
- `upcomingClasses` - Next 10 upcoming classes (next 7 days)
- `assignedCourses` - List of courses assigned to teacher
- `assignedBatches` - List of batches assigned to teacher with weekdays
- `todayAttendance` - Today's student attendance summary for assigned batches
- `myAttendance` - Teacher's own attendance statistics:
  - `thisWeek` - This week's attendance (totalDays, present, absent, totalHours)
  - `thisMonth` - This month's attendance (totalDays, present, absent, totalHours)
  - `attendancePercentage` - Overall attendance percentage
- `thisWeekHours` - Total hours worked this week (calculated from check-in/check-out)
- `graphData` - Last 7 days attendance data for graph visualization:
  - `date` - Date in YYYY-MM-DD format
  - `dayName` - Day of the week
  - `present` - 1 if present, 0 if absent
  - `absent` - 1 if absent, 0 if present
  - `hours` - Hours worked on that day (from check-in/check-out)
- `notifications` - Array of notifications and reminders

---

## My Attendance

### Get My Attendance Details
**Method:** `GET`  
**URL:** `/api/teacher/attendance/my`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `startDate` (optional) - Start date for filtering (YYYY-MM-DD)
- `endDate` (optional) - End date for filtering (YYYY-MM-DD)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Records per page (default: 30)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "attendance": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "date": "2024-01-25T00:00:00.000Z",
        "status": "Present",
        "timeSlot": "6:00 AM - 8:00 AM",
        "checkIn": "2024-01-25T06:00:00.000Z",
        "checkOut": "2024-01-25T08:00:00.000Z",
        "method": "MANUAL",
        "hours": 2.0,
        "createdAt": "2024-01-25T06:05:00.000Z",
        "updatedAt": "2024-01-25T08:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "date": "2024-01-24T00:00:00.000Z",
        "status": "Present",
        "timeSlot": "6:00 AM - 8:00 AM",
        "checkIn": "2024-01-24T06:05:00.000Z",
        "checkOut": "2024-01-24T08:00:00.000Z",
        "method": "QR",
        "hours": 1.92,
        "createdAt": "2024-01-24T06:05:00.000Z",
        "updatedAt": "2024-01-24T08:00:00.000Z"
      }
    ],
    "statistics": {
      "overall": {
        "totalDays": 45,
        "present": 40,
        "absent": 3,
        "late": 2,
        "totalHours": 320.5,
        "percentage": 89
      },
      "thisWeek": {
        "totalDays": 5,
        "present": 4,
        "absent": 1,
        "totalHours": 32.5,
        "percentage": 80
      },
      "thisMonth": {
        "totalDays": 20,
        "present": 18,
        "absent": 2,
        "totalHours": 144.0,
        "percentage": 90
      }
    },
    "pagination": {
      "page": 1,
      "limit": 30,
      "total": 45,
      "pages": 2
    }
  }
}
```

**Response Fields:**
- `attendance` - Array of attendance records with:
  - `date` - Attendance date
  - `status` - Present, Absent, or Late
  - `timeSlot` - Time slot if available
  - `checkIn` - Check-in timestamp
  - `checkOut` - Check-out timestamp
  - `method` - Attendance method (QR, MANUAL)
  - `hours` - Hours worked (calculated from check-in/check-out)
- `statistics` - Attendance statistics:
  - `overall` - Overall statistics (all time)
  - `thisWeek` - This week's statistics
  - `thisMonth` - This month's statistics
  - Each includes: totalDays, present, absent, late (overall only), totalHours, percentage
- `pagination` - Pagination information

**Error Responses:**
- `404` - Teacher not found
- `500` - Server error

---

### Get My Absence and Late History
**Method:** `GET`  
**URL:** `/api/teacher/attendance/absence-history`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Records per page (default: 30)
- `status` (optional) - Filter by status: `Absent`, `Late`, or both (default: both)

**Description:** Get all absent and late attendance records for the authenticated teacher. Similar to student absence history API.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "absences": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "date": "2024-01-20T00:00:00.000Z",
        "timeSlot": "6:00 AM - 8:00 AM",
        "checkIn": null,
        "checkOut": null,
        "method": "MANUAL",
        "hours": 0,
        "markedBy": "<USER_ID>",
        "createdAt": "2024-01-20T06:05:00.000Z",
        "updatedAt": "2024-01-20T06:05:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "date": "2024-01-18T00:00:00.000Z",
        "timeSlot": "6:00 AM - 8:00 AM",
        "checkIn": null,
        "checkOut": null,
        "method": "MANUAL",
        "hours": 0,
        "markedBy": "<USER_ID>",
        "createdAt": "2024-01-18T06:05:00.000Z",
        "updatedAt": "2024-01-18T06:05:00.000Z"
      }
    ],
    "lates": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "date": "2024-01-22T00:00:00.000Z",
        "timeSlot": "6:00 AM - 8:00 AM",
        "checkIn": "2024-01-22T06:15:00.000Z",
        "checkOut": "2024-01-22T08:00:00.000Z",
        "method": "QR",
        "hours": 1.75,
        "markedBy": "<USER_ID>",
        "createdAt": "2024-01-22T06:15:00.000Z",
        "updatedAt": "2024-01-22T08:00:00.000Z"
      }
    ],
    "summary": {
      "totalAbsentDays": 2,
      "totalLateDays": 1,
      "totalDays": 3
    },
    "pagination": {
      "page": 1,
      "limit": 30,
      "total": 3,
      "pages": 1
    },
    "note": "Absence and late history is read-only. Contact admin for any queries."
  }
}
```

**Response Fields:**
- `absences` - Array of absent attendance records:
  - `_id` - Attendance record ID
  - `date` - Absence date
  - `timeSlot` - Time slot if available
  - `checkIn` - Check-in timestamp (usually null for absent)
  - `checkOut` - Check-out timestamp (usually null for absent)
  - `method` - Attendance method (QR, MANUAL)
  - `hours` - Hours worked (usually 0 for absent)
  - `markedBy` - User who marked the attendance
  - `createdAt` - Record creation timestamp
  - `updatedAt` - Record update timestamp
- `lates` - Array of late attendance records:
  - Same structure as absences
  - `checkIn` and `checkOut` may be present
  - `hours` - Hours worked (calculated from check-in/check-out)
- `summary` - Summary statistics:
  - `totalAbsentDays` - Total number of absent days
  - `totalLateDays` - Total number of late days
  - `totalDays` - Total absent and late days combined
- `pagination` - Pagination information
- `note` - Informational message

**Example Requests:**
- Get all absence and late records: `GET /api/teacher/attendance/absence-history`
- Get only absent records: `GET /api/teacher/attendance/absence-history?status=Absent`
- Get only late records: `GET /api/teacher/attendance/absence-history?status=Late`
- Get with pagination: `GET /api/teacher/attendance/absence-history?page=1&limit=20`

**Notes:**
- Returns both absent and late records by default
- Use `status` parameter to filter by specific status
- Records are sorted by date in descending order (most recent first)
- If teacher has no Staff record for attendance tracking, returns empty results
- Absence and late history is read-only

**Error Responses:**
- `404` - Teacher not found
- `500` - Server error

---

## My Profile

### Get My Profile
**Method:** `GET`  
**URL:** `/api/teacher/profile`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "teacher": {
      "_id": "507f1f77bcf86cd799439010",
      "teacherId": "DHK001-TCH-001",
      "name": "John Teacher",
      "email": "teacher@example.com",
      "mobile": "1234567890",
      "isActive": true,
      "imageUrl": "/uploads/teachers/photo.jpg",
      "idCardUrl": "/uploads/teachers/id-card.jpg",
      "createdAt": "2024-01-15T00:00:00.000Z"
    },
    "branch": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Dhaka Branch",
      "code": "DHK001",
      "contactNumber": "1234567890",
      "addresses": [
        {
          "areaname": "Dhanmondi",
          "city": "Dhaka",
          "pincode": "1205",
          "location": {
            "latitude": 23.7465,
            "longitude": 90.3760
          }
        }
      ]
    },
    "assignedBatches": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Morning Batch",
        "timeSlot": "6:00 AM - 8:00 AM",
        "weekdays": ["Monday", "Wednesday", "Friday"],
        "course": {
          "id": "507f1f77bcf86cd799439011",
          "name": "DCA",
          "category": "Certificate"
        },
        "isActive": true
      }
    ],
    "assignedCourses": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "DCA",
        "category": "Certificate",
        "duration": "6 months"
      }
    ],
    "totalStudents": 25,
    "todayAttendance": {
      "status": "Present",
      "checkIn": "2024-01-25T06:00:00.000Z",
      "checkOut": "2024-01-25T08:00:00.000Z",
      "timeSlot": "6:00 AM - 8:00 AM",
      "method": "MANUAL",
      "hours": 2.0
    },
    "attendance": {
      "overall": {
        "totalDays": 45,
        "present": 40,
        "absent": 3,
        "late": 2,
        "totalHours": 320.5,
        "percentage": 88.89
      },
      "thisWeek": {
        "totalDays": 5,
        "present": 4,
        "absent": 1,
        "totalHours": 32.5,
        "percentage": 80.0
      },
      "thisMonth": {
        "totalDays": 20,
        "present": 18,
        "absent": 2,
        "totalHours": 144.0,
        "percentage": 90.0
      },
      "recentAttendance": [
        {
          "date": "2024-01-25T00:00:00.000Z",
          "status": "Present",
          "checkIn": "2024-01-25T06:00:00.000Z",
          "checkOut": "2024-01-25T08:00:00.000Z",
          "timeSlot": "6:00 AM - 8:00 AM",
          "method": "MANUAL",
          "hours": 2.0
        }
      ]
    },
    "salary": {
      "salaryType": "PER_CLASS",
      "salaryRate": 500,
      "currentMonthClasses": 20,
      "currentMonthSalary": 10000,
      "estimatedSalary": 10000
    },
    "upcomingExams": [
      {
        "_id": "507f1f77bcf86cd799439018",
        "examName": "Monthly Test",
        "examType": "Monthly",
        "examDate": "2024-01-25T10:00:00.000Z",
        "batch": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Morning Batch"
        },
        "course": {
          "id": "507f1f77bcf86cd799439011",
          "name": "DCA"
        },
        "maxMarks": 100,
        "passingMarks": 40
      }
    ]
  }
}
```

**Response Fields:**
- `teacher` - Teacher information (teacherId, name, email, mobile, isActive, imageUrl, idCardUrl, createdAt)
- `branch` - Branch information (name, code, contactNumber, addresses)
- `assignedBatches` - List of batches assigned to teacher with course details and weekdays
- `assignedCourses` - List of courses assigned to teacher
- `totalStudents` - Total number of active students in assigned batches
- `todayAttendance` - Today's attendance record (if marked)
- `attendance` - Attendance statistics:
  - `overall` - Overall statistics (all time)
  - `thisWeek` - This week's statistics
  - `thisMonth` - This month's statistics
  - `recentAttendance` - Last 10 attendance records
- `salary` - Salary information:
  - `salaryType` - PER_CLASS, MONTHLY_FIXED, or HOURLY
  - `salaryRate` - Rate per class/month/hour
  - `currentMonthClasses` - Classes taken this month (for PER_CLASS)
  - `currentMonthSalary` - Salary earned this month
  - `estimatedSalary` - Estimated salary based on salary type
- `upcomingExams` - Next 5 upcoming exams for assigned batches

**Error Responses:**
- `404` - Teacher not found
- `500` - Server error

---

## Student Attendance

### Mark Student Attendance (Class Time)
**Method:** `POST`  
**URL:** `/api/teacher/attendance/student`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "studentId": "507f1f77bcf86cd799439014",
  "batchId": "507f1f77bcf86cd799439012",
  "timeSlot": "AM",
  "method": "QR"
}
```

**OR with QR data:**
```json
{
  "studentId": "507f1f77bcf86cd799439014",
  "batchId": "507f1f77bcf86cd799439012",
  "method": "QR",
  "qrData": "{\"studentId\":\"DHK001-2024-001\"}"
}
```

**OR Manual:**
```json
{
  "studentId": "507f1f77bcf86cd799439014",
  "batchId": "507f1f77bcf86cd799439012",
  "method": "MANUAL"
}
```

**Required Fields:**
- `studentId` - Student ID
- `batchId` - Batch ID (must be assigned to teacher)

**Optional Fields:**
- `timeSlot` - Time slot (default: batch timeSlot)
- `method` - QR / FACE / MANUAL (default: MANUAL)
- `qrData` - QR code data (required if method is QR)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Student attendance marked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "branchId": "507f1f77bcf86cd799439011",
    "studentId": "507f1f77bcf86cd799439014",
    "batchId": "507f1f77bcf86cd799439012",
    "date": "2024-01-20T09:00:00.000Z",
    "timeSlot": "AM",
    "status": "Present",
    "method": "QR",
    "markedBy": "507f1f77bcf86cd799439016"
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Access denied. Batch not assigned to you"
}
```

**Note:** 
- Teachers can only mark attendance for students in their assigned batches
- Face recognition is placeholder-ready but not yet implemented
- Status is auto-determined (Present/Late) based on batch time

---

## Batch Details

### Get Batch Details (Read Only)
**Method:** `GET`  
**URL:** `/api/teacher/batches`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Morning Batch",
        "timeSlot": "AM",
        "isActive": true,
        "maxStudents": 30,
        "currentStudents": 25,
        "course": {
          "id": "507f1f77bcf86cd799439011",
          "name": "DCA",
          "category": "Certificate",
          "duration": "6 months",
          "syllabus": "Course syllabus content...",
          "description": "Diploma in Computer Applications"
        },
        "teacher": {
          "id": "507f1f77bcf86cd799439016",
          "name": "John Teacher",
          "email": "teacher@example.com"
        },
        "students": [
          {
            "id": "507f1f77bcf86cd799439014",
            "studentId": "DHK001-2024-001",
            "name": "John Doe",
            "mobileNumber": "9876543210",
            "email": "john@example.com"
          }
        ],
        "note": "Batch details are read-only. Contact administrator for changes."
      }
    ],
    "totalBatches": 2
  }
}
```

**Note:** Batch details are read-only. Teachers cannot edit batch information.

---

## Exams & Marks Management

### Get Assigned Exams
**Method:** `GET`  
**URL:** `/api/teacher/exams`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `status` (optional) - all / upcoming / past (default: all)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "exams": [
      {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Monthly Test",
        "examType": "Monthly",
        "examDate": "2024-01-25T10:00:00.000Z",
        "maxMarks": 100,
        "passingMarks": 40,
        "course": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "DCA",
          "courseCategory": "Certificate"
        },
        "batch": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Morning Batch",
          "timeSlot": "AM"
        },
        "resultsUploaded": 20,
        "totalStudents": 25,
        "pendingResults": 5,
        "isUpcoming": true
      }
    ],
    "summary": {
      "total": 5,
      "upcoming": 2,
      "past": 3
    }
  }
}
```

### Get Exam Marks (View/Edit)
**Method:** `GET`  
**URL:** `/api/teacher/exams/:examId/marks`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "exam": {
      "id": "507f1f77bcf86cd799439018",
      "name": "Monthly Test",
      "examType": "Monthly",
      "examDate": "2024-01-25T10:00:00.000Z",
      "maxMarks": 100,
      "passingMarks": 40,
      "batch": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Morning Batch",
        "timeSlot": "AM"
      },
      "course": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "DCA"
      }
    },
    "students": [
      {
        "studentId": "507f1f77bcf86cd799439014",
        "studentIdString": "DHK001-2024-001",
        "studentName": "John Doe",
        "mobileNumber": "9876543210",
        "marks": {
          "marksObtained": 75,
          "percentage": 75,
          "status": "PASS",
          "remarks": "Good performance"
        }
      },
      {
        "studentId": "507f1f77bcf86cd799439020",
        "studentIdString": "DHK001-2024-002",
        "studentName": "Jane Smith",
        "mobileNumber": "9876543211",
        "marks": null
      }
    ],
    "summary": {
      "totalStudents": 25,
      "marksUploaded": 20,
      "pending": 5
    }
  }
}
```

### Upload Marks for Exam
**Method:** `POST`  
**URL:** `/api/teacher/exams/:examId/marks`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "marks": [
    {
      "studentId": "507f1f77bcf86cd799439014",
      "marksObtained": 75,
      "remarks": "Good performance"
    },
    {
      "studentId": "507f1f77bcf86cd799439020",
      "writtenMarks": 40,
      "mcqMarks": 35,
      "remarks": "Average performance"
    }
  ],
  "isDraft": false
}
```

**Required Fields:**
- `marks` - Array of mark objects
  - `studentId` - Student ID (required)
  - `marksObtained` - Total marks (required, OR use writtenMarks + mcqMarks)
  - `writtenMarks` - Written exam marks (optional)
  - `mcqMarks` - MCQ marks (optional)
  - `remarks` - Remarks (optional)

**Optional Fields:**
- `isDraft` - Save as draft (default: false)

**Note:** If both `marksObtained` and `writtenMarks`/`mcqMarks` are provided, `marksObtained` takes precedence. Otherwise, total is calculated as `writtenMarks + mcqMarks`.

**Success Response (201):**
```json
{
  "success": true,
  "message": "Marks uploaded successfully. 25 result(s) saved.",
  "data": {
    "examId": "507f1f77bcf86cd799439018",
    "examName": "Monthly Test",
    "resultsUploaded": 25,
    "errors": null,
    "note": "Marks uploaded successfully."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Marks uploaded successfully. 20 result(s) saved.",
  "data": {
    "examId": "507f1f77bcf86cd799439018",
    "resultsUploaded": 20,
    "errors": [
      {
        "studentId": "507f1f77bcf86cd799439020",
        "error": "Student not found in this batch"
      }
    ]
  }
}
```

**Note:** Teachers can only upload marks for exams of their assigned batches. Marks can be saved as draft and finalized by admin.

---

## Recorded Classes & Study Materials

### Create Recorded Class / Study Material
**Method:** `POST`  
**URL:** `/api/teacher/recorded-classes`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (form-data):**

**Required Fields:**
- `batchId` - Batch ID (must be assigned to teacher)
- `courseId` - Course ID
- `title` - Class/material title

**Optional Fields:**
- `description` - Description
- `duration` - Duration in seconds (for videos)
- `expiryDate` - Expiry date (YYYY-MM-DD)

**File Uploads:**
- `video` (file) - Video file (optional if PDF provided)
- `pdf` (file) - PDF/Notes file (optional if video provided)
- `thumbnail` (file) - Thumbnail image (optional)

**Note:** Either video OR PDF must be provided.

**Success Response (201):**
```json
{
  "success": true,
  "message": "Recorded class/study material uploaded successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "branchId": "507f1f77bcf86cd799439011",
    "batchId": "507f1f77bcf86cd799439012",
    "courseId": "507f1f77bcf86cd799439011",
    "title": "Introduction to Programming",
    "description": "Basic programming concepts",
    "videoUrl": "/uploads/recorded-classes/video-123.mp4",
    "thumbnailUrl": "/uploads/recorded-classes/thumbnail-123.jpg",
    "duration": 3600,
    "expiryDate": "2024-12-31T23:59:59.000Z",
    "accessControl": {
      "allowDownload": false
    },
    "uploadedBy": "507f1f77bcf86cd799439016",
    "isActive": true,
    "note": "Students can view/stream but cannot download. Download is disabled."
  }
}
```

### Get Recorded Classes
**Method:** `GET`  
**URL:** `/api/teacher/recorded-classes`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `batchId` (optional) - Filter by batch ID
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "title": "Introduction to Programming",
        "description": "Basic programming concepts",
        "videoUrl": "/uploads/recorded-classes/video-123.mp4",
        "thumbnailUrl": "/uploads/recorded-classes/thumbnail-123.jpg",
        "duration": 3600,
        "expiryDate": "2024-12-31T23:59:59.000Z",
        "batch": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Morning Batch",
          "timeSlot": "AM"
        },
        "course": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "DCA"
        },
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

---

## Notices

### Create Batch Notice
**Method:** `POST`  
**URL:** `/api/teacher/notices`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "title": "Class Cancellation Notice",
  "content": "Tomorrow's class is cancelled due to holiday.",
  "noticeType": "CLASS",
  "batchId": "507f1f77bcf86cd799439012",
  "priority": "HIGH",
  "startDate": "2024-01-20",
  "endDate": "2024-01-21"
}
```

**Required Fields:**
- `title` - Notice title
- `content` - Notice content
- `batchId` - Batch ID (must be assigned to teacher)

**Optional Fields:**
- `noticeType` - CLASS / EXAM / HOLIDAY / GENERAL (default: CLASS)
- `priority` - LOW / MEDIUM / HIGH / URGENT (default: MEDIUM)
- `startDate` - Start date (YYYY-MM-DD, default: today)
- `endDate` - End date (YYYY-MM-DD)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Notice created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "branchId": "507f1f77bcf86cd799439011",
    "title": "Class Cancellation Notice",
    "content": "Tomorrow's class is cancelled due to holiday.",
    "noticeType": "CLASS",
    "targetAudience": "BATCH",
    "targetBatchIds": ["507f1f77bcf86cd799439012"],
    "priority": "HIGH",
    "startDate": "2024-01-20T00:00:00.000Z",
    "endDate": "2024-01-21T00:00:00.000Z",
    "isActive": true,
    "createdBy": "TEACHER"
  }
}
```

### Get Notices
**Method:** `GET`  
**URL:** `/api/teacher/notices`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `batchId` (optional) - Filter by batch ID
- `noticeType` (optional) - CLASS / EXAM / HOLIDAY / GENERAL / PAYMENT
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "notices": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "title": "Class Cancellation Notice",
        "content": "Tomorrow's class is cancelled due to holiday.",
        "noticeType": "CLASS",
        "priority": "HIGH",
        "targetBatchIds": [
          {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Morning Batch",
            "timeSlot": "AM"
          }
        ],
        "startDate": "2024-01-20T00:00:00.000Z",
        "createdAt": "2024-01-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

## Notifications

### Get Notifications & Alerts
**Method:** `GET`  
**URL:** `/api/teacher/notifications`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "type": "CLASS_REMINDER",
        "message": "You have 1 class(es) today",
        "batches": [
          {
            "name": "Morning Batch",
            "timeSlot": "AM"
          }
        ],
        "priority": "MEDIUM",
        "timestamp": "2024-01-20T09:00:00.000Z"
      },
      {
        "type": "EXAM_DUTY_ALERT",
        "message": "2 exam(s) scheduled in next 7 days",
        "exams": [
          {
            "id": "507f1f77bcf86cd799439018",
            "name": "Monthly Test",
            "type": "Monthly",
            "date": "2024-01-25T10:00:00.000Z",
            "batch": "Morning Batch"
          }
        ],
        "priority": "HIGH",
        "timestamp": "2024-01-20T09:00:00.000Z"
      },
      {
        "type": "MARKS_PENDING",
        "message": "Marks pending for 5 student(s) in past exams",
        "pendingMarks": [
          {
            "examId": "507f1f77bcf86cd799439019",
            "examName": "Mid Term",
            "pending": 5
          }
        ],
        "priority": "HIGH",
        "timestamp": "2024-01-20T09:00:00.000Z"
      },
      {
        "type": "CONTENT_REMINDER",
        "message": "Consider uploading study materials for your batches",
        "priority": "LOW",
        "timestamp": "2024-01-20T09:00:00.000Z"
      }
    ],
    "summary": {
      "total": 4,
      "highPriority": 2,
      "mediumPriority": 1,
      "lowPriority": 1
    }
  }
}
```

---

## Performance View

### Get Performance (Self - Read Only)
**Method:** `GET`  
**URL:** `/api/teacher/performance`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "teacherId": "DHK001-TCH-001",
    "currentMonth": {
      "classesTaken": 20
    },
    "attendanceTrend": [
      {
        "month": "January 2024",
        "year": 2024,
        "monthNumber": 1,
        "totalClasses": 20,
        "presentCount": 18,
        "attendancePercentage": 90
      },
      {
        "month": "December 2023",
        "year": 2023,
        "monthNumber": 12,
        "totalClasses": 22,
        "presentCount": 20,
        "attendancePercentage": 91
      }
    ],
    "batchPerformance": [
      {
        "batchId": "507f1f77bcf86cd799439012",
        "batchName": "Morning Batch",
        "timeSlot": "AM",
        "totalExams": 3,
        "totalResults": 75,
        "passCount": 60,
        "failCount": 15,
        "passPercentage": 80,
        "averageMarks": 72
      }
    ],
    "note": "This is a read-only performance view. Contact administrator for salary information."
  }
}
```

**Note:** Performance view is read-only. Teachers cannot view salary information.

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: studentId, batchId"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Batch not assigned to you"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Student not found or does not belong to this batch"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error while processing request",
  "error": "Error details (only in development mode)"
}
```

---

## Notes

1. **Batch Isolation:** All queries are automatically scoped to the teacher's assigned batches. Teachers can only access data for batches assigned to them.

2. **Attendance Marking:** Teachers can mark attendance for students in their assigned batches only. Methods supported: QR, Manual (if allowed by admin), Face recognition (placeholder).

3. **Marks Upload:** Teachers can upload marks for exams of their assigned batches. Marks can be saved as draft and finalized by admin.

4. **Content Upload:** Teachers can upload recorded classes and study materials (video or PDF) for their assigned batches. Download is disabled for students.

5. **Notices:** Teachers can create batch-specific notices for their assigned batches only.

6. **Read-Only Access:** Batch details, course information, and performance data are read-only. Teachers cannot modify batch settings or view salary information.

7. **No Access To:**
   - Fees / Payments
   - Student registration
   - Staff salary
   - Admin or Staff APIs
   - Other teachers' batches

---

## Integration Notes

- All endpoints use the same MongoDB database as Admin, Staff, Student, and SuperAdmin panels
- JWT tokens are shared across panels (same secret)
- Batch isolation is enforced at middleware level
- Audit logs are created for all teacher actions (attendance, marks upload, content upload)
- All file URLs (videos, PDFs, thumbnails) are accessible via `/uploads` endpoint

---

## Security Features

- ✅ JWT authentication
- ✅ Branch & batch isolation middleware
- ✅ Role-based access control (TEACHER only)
- ✅ Password hashing (bcrypt)
- ✅ Input validation
- ✅ Batch assignment verification
- ✅ Read-only enforcement for sensitive data
