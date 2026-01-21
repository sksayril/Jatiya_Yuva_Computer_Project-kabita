# Staff Panel API Documentation

Complete API documentation for the Staff Panel of National Youth Computer Center.

**Base URL:** `http://localhost:3000/api/staff`

**Authentication:** All endpoints (except login) require JWT token in header: `Authorization: Bearer <token>`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [Self Attendance](#self-attendance)
4. [Student Attendance](#student-attendance)
5. [Student Registration](#student-registration)
6. [Absent Students & Follow-ups](#absent-students--follow-ups)
7. [Payment Collection](#payment-collection)
8. [Inquiry Management](#inquiry-management)
9. [Salary View](#salary-view)
10. [Reports](#reports)

---

## Authentication

### Staff Login
**Method:** `POST`  
**URL:** `/api/staff/login`  
**Body (raw JSON):**
```json
{
  "staffId": "DHK001-STF-001",
  "password": "password123"
}
```
**OR**
```json
{
  "email": "staff@example.com",
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
    "role": "STAFF",
    "branchId": "507f1f77bcf86cd799439011",
    "staffId": "DHK001-STF-001",
    "name": "John Doe",
    "email": "staff@example.com"
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

---

## Dashboard

### Get Dashboard Summary
**Method:** `GET`  
**URL:** `/api/staff/dashboard/summary`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "selfAttendance": {
      "status": "Present",
      "checkIn": "2024-01-20T09:00:00.000Z",
      "checkOut": "2024-01-20T18:00:00.000Z"
    },
    "todayAbsentStudentsCount": 5,
    "studentsRegisteredByStaff": 25,
    "pendingFollowUps": 3,
    "notifications": [
      {
        "type": "HIGH_DUE",
        "message": "2 student(s) have high due amounts",
        "count": 2
      },
      {
        "type": "CONSECUTIVE_ABSENT",
        "message": "1 student(s) absent for 3+ consecutive days",
        "count": 1
      }
    ]
  }
}
```

---

## Self Attendance

### Mark Self Attendance (QR Scan)
**Method:** `POST`  
**URL:** `/api/staff/attendance/self`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "qrData": "{\"staffId\":\"DHK001-STF-001\"}"
}
```

**Success Response (201 - Check-in):**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "attendanceId": "507f1f77bcf86cd799439011",
    "checkIn": "2024-01-20T09:00:00.000Z",
    "status": "Checked In"
  }
}
```

**Success Response (200 - Check-out):**
```json
{
  "success": true,
  "message": "Check-out successful",
  "data": {
    "attendanceId": "507f1f77bcf86cd799439011",
    "checkIn": "2024-01-20T09:00:00.000Z",
    "checkOut": "2024-01-20T18:00:00.000Z",
    "status": "Checked Out"
  }
}
```

**Note:** First scan = Check-in, Second scan = Check-out. Duplicate scans are prevented.

---

## Student Attendance

### Mark Student Attendance
**Method:** `POST`  
**URL:** `/api/staff/attendance/student`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "batchId": "507f1f77bcf86cd799439012",
  "timeSlot": "AM",
  "method": "MANUAL"
}
```

**OR with QR:**
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "batchId": "507f1f77bcf86cd799439012",
  "method": "QR",
  "qrData": "{\"studentId\":\"DHK001-2024-001\"}"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Student attendance marked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "branchId": "507f1f77bcf86cd799439010",
    "studentId": "507f1f77bcf86cd799439011",
    "batchId": "507f1f77bcf86cd799439012",
    "date": "2024-01-20T09:00:00.000Z",
    "timeSlot": "AM",
    "status": "Present",
    "method": "MANUAL"
  }
}
```

**Error Response (400 - Duplicate):**
```json
{
  "success": false,
  "message": "Attendance already marked for this student today"
}
```

---

## Student Registration

### Manual Student Registration
**Method:** `POST`  
**URL:** `/api/staff/students/manual`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (form-data):**

**Required Fields:**
- `studentName` (text) - Student full name
- `mobileNumber` (text) - Mobile number

**Optional Fields:**
- `admissionDate` (text) - Date in YYYY-MM-DD format
- `courseName` (text) - Course name
- `courseId` (text) - Course ID (alternative to courseName)
- `courseType` (text) - Certificate/Diploma
- `guardianName` (text)
- `motherName` (text)
- `dateOfBirth` (text) - YYYY-MM-DD
- `whatsappNumber` (text)
- `guardianMobile` (text)
- `email` (text)
- `gender` (text) - Male/Female/Other
- `religion` (text)
- `category` (text)
- `address` (text)
- `pincode` (text)
- `lastQualification` (text)
- `batchTime` (text) - AM/PM/EVENING
- `batchId` (text) - Batch ID (alternative to batchTime)
- `formNumber` (text)
- `receiptNumber` (text)
- `officeEntryDate` (text) - YYYY-MM-DD

**File Uploads (optional):**
- `studentPhoto` (file) - Image file
- `studentSignature` (file) - Image file
- `officeSignature` (file) - Image file
- `formScanImage` (file) - Image/PDF file

**Success Response (201):**
```json
{
  "success": true,
  "message": "Student registered successfully. Pending admin approval.",
  "data": {
    "studentId": "DHK001-2024-001",
    "studentName": "John Doe",
    "status": "PENDING",
    "note": "Student registration is pending. Admin approval required to activate."
  }
}
```

**Note:** Staff-registered students have `PENDING` status and require admin approval.

### Scan Form (OCR Placeholder)
**Method:** `POST`  
**URL:** `/api/staff/students/scan-form`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (form-data):**
- `formImage` (file) - Form image file

**Success Response (200):**
```json
{
  "success": true,
  "message": "Form scanned successfully (OCR placeholder)",
  "data": {
    "formImageUrl": "/uploads/forms/form-1234567890.jpg",
    "extractedData": {
      "studentName": "",
      "guardianName": "",
      "mobileNumber": "",
      "address": "",
      "courseName": "",
      "date": "2024-01-20"
    },
    "note": "OCR integration required. Currently returning placeholder data."
  }
}
```

---

## Absent Students & Follow-ups

### Get Absent Students
**Method:** `GET`  
**URL:** `/api/staff/absent-students`  
**OR:** `/api/staff/follow-ups/absent-students`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `date` (optional) - Date in YYYY-MM-DD format (default: today)
- `consecutiveDays` (optional) - Filter by consecutive absent days (default: 0 = all absent)

**Example:** `/api/staff/absent-students?date=2024-01-20&consecutiveDays=3`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-20",
    "totalAbsent": 5,
    "students": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "studentId": "DHK001-2024-001",
        "studentName": "John Doe",
        "mobileNumber": "9876543210",
        "batchId": "507f1f77bcf86cd799439012",
        "courseName": "DCA",
        "consecutiveAbsentDays": 3,
        "dropRisk": false
      }
    ]
  }
}
```

### Create Follow-up
**Method:** `POST`  
**URL:** `/api/staff/follow-ups`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "absentDate": "2024-01-20",
  "callStatus": "Connected",
  "reason": "Sick",
  "reasonDetails": "Fever and cold",
  "expectedReturnDate": "2024-01-22",
  "remarks": "Student will return after recovery",
  "nextFollowUpDate": "2024-01-23"
}
```

**Required Fields:**
- `studentId` - Student ID
- `absentDate` - Date in YYYY-MM-DD format
- `callStatus` - Connected / Not Reachable / No Answer / Busy
- `reason` - Sick / Personal / Financial / Not Interested / Other

**Optional Fields:**
- `reasonDetails` - Additional details about reason
- `expectedReturnDate` - Expected return date
- `remarks` - Additional remarks
- `nextFollowUpDate` - Next follow-up date

**Success Response (201):**
```json
{
  "success": true,
  "message": "Follow-up created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "branchId": "507f1f77bcf86cd799439010",
    "studentId": "507f1f77bcf86cd799439011",
    "staffId": "507f1f77bcf86cd799439015",
    "absentDate": "2024-01-20T00:00:00.000Z",
    "callStatus": "Connected",
    "reason": "Sick",
    "reasonDetails": "Fever and cold",
    "expectedReturnDate": "2024-01-22T00:00:00.000Z",
    "remarks": "Student will return after recovery",
    "followUpStatus": "Pending",
    "nextFollowUpDate": "2024-01-23T00:00:00.000Z"
  }
}
```

### Get Follow-ups
**Method:** `GET`  
**URL:** `/api/staff/follow-ups`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `status` (optional) - Pending / Resolved / Dropped
- `studentId` (optional) - Filter by student ID
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "followUps": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "studentId": {
          "_id": "507f1f77bcf86cd799439011",
          "studentId": "DHK001-2024-001",
          "studentName": "John Doe",
          "mobileNumber": "9876543210"
        },
        "absentDate": "2024-01-20T00:00:00.000Z",
        "callStatus": "Connected",
        "reason": "Sick",
        "followUpStatus": "Pending"
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

### Update Follow-up
**Method:** `PATCH`  
**URL:** `/api/staff/follow-ups/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "callStatus": "Connected",
  "reason": "Sick",
  "remarks": "Updated remarks",
  "followUpStatus": "Resolved",
  "nextFollowUpDate": "2024-01-25"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Follow-up updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "followUpStatus": "Resolved",
    "resolvedDate": "2024-01-21T10:00:00.000Z"
  }
}
```

---

## Payment Collection

### Create Payment (Limited - No Discount)
**Method:** `POST`  
**URL:** `/api/staff/payments`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "amount": 1000,
  "paymentMode": "CASH",
  "description": "Monthly fee for January",
  "month": "January",
  "year": 2024
}
```

**Required Fields:**
- `studentId` - Student ID
- `amount` - Payment amount (number)
- `paymentMode` - CASH / UPI / ONLINE

**Optional Fields:**
- `description` - Payment description
- `month` - Month name (default: current month)
- `year` - Year (default: current year)

**Note:** Staff cannot apply discounts. Discount field is automatically set to 0.

**Success Response (201):**
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "branchId": "507f1f77bcf86cd799439010",
    "studentId": "507f1f77bcf86cd799439011",
    "amount": 1000,
    "paymentMode": "CASH",
    "discount": 0,
    "receiptNumber": "DHK001-202401-0001",
    "month": "January",
    "year": 2024,
    "collectedBy": "507f1f77bcf86cd799439015",
    "receiptPdfUrl": "",
    "note": "Receipt will be generated automatically"
  }
}
```

### Get Payments (by Staff)
**Method:** `GET`  
**URL:** `/api/staff/payments`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `studentId` (optional) - Filter by student ID
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "studentId": {
          "_id": "507f1f77bcf86cd799439011",
          "studentId": "DHK001-2024-001",
          "studentName": "John Doe"
        },
        "amount": 1000,
        "paymentMode": "CASH",
        "receiptNumber": "DHK001-202401-0001",
        "createdAt": "2024-01-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "pages": 1
    }
  }
}
```

---

## Inquiry Management

### Create Inquiry
**Method:** `POST`  
**URL:** `/api/staff/inquiries`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "name": "Jane Smith",
  "mobile": "9876543210",
  "email": "jane@example.com",
  "address": "123 Main St",
  "courseInterest": "DCA",
  "source": "Walk-in",
  "notes": "Interested in morning batch"
}
```

**Required Fields:**
- `name` - Inquiry name
- `mobile` - Mobile number

**Optional Fields:**
- `email` - Email address
- `address` - Address
- `courseInterest` - Interested course
- `source` - Inquiry source (Walk-in / Phone / Online / Referral)
- `notes` - Additional notes

**Success Response (201):**
```json
{
  "success": true,
  "message": "Inquiry created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "branchId": "507f1f77bcf86cd799439010",
    "name": "Jane Smith",
    "mobile": "9876543210",
    "status": "NEW",
    "handledBy": "507f1f77bcf86cd799439015"
  }
}
```

### Get Inquiries
**Method:** `GET`  
**URL:** `/api/staff/inquiries`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `status` (optional) - NEW / CONTACTED / CONVERTED / LOST
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "inquiries": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "name": "Jane Smith",
        "mobile": "9876543210",
        "courseInterest": "DCA",
        "status": "NEW",
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

### Update Inquiry Follow-up
**Method:** `PATCH`  
**URL:** `/api/staff/inquiries/:id/follow-up`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "followUpNotes": "Called on 2024-01-21. Student interested, will visit tomorrow.",
  "status": "CONTACTED",
  "nextFollowUpDate": "2024-01-22"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Inquiry follow-up updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "followUpNotes": "Previous notes\nCalled on 2024-01-21. Student interested, will visit tomorrow.",
    "status": "CONTACTED",
    "nextFollowUpDate": "2024-01-22T00:00:00.000Z"
  }
}
```

---

## Salary View

### Get Salary (Read-Only)
**Method:** `GET`  
**URL:** `/api/staff/salary`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "staffId": "DHK001-STF-001",
    "name": "John Doe",
    "salaryType": "PER_CLASS",
    "salaryRate": 300,
    "currentMonth": {
      "attendanceCount": 20,
      "salary": 6000
    },
    "monthWiseBreakdown": [
      {
        "month": "January 2024",
        "year": 2024,
        "monthNumber": 1,
        "attendanceCount": 20,
        "salary": 6000
      },
      {
        "month": "December 2023",
        "year": 2023,
        "monthNumber": 12,
        "attendanceCount": 22,
        "salary": 6600
      }
    ],
    "note": "This is a read-only view. Contact administrator for salary adjustments."
  }
}
```

**Salary Types:**
- `PER_CLASS` - Salary = attendanceCount × salaryRate
- `MONTHLY_FIXED` - Salary = salaryRate (fixed)
- `HOURLY` - Salary = totalHours × salaryRate

---

## Reports

### Get Attendance Report
**Method:** `GET`  
**URL:** `/api/staff/reports/attendance`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)
- `studentId` (optional) - Filter by student ID
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "attendances": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "studentId": {
          "_id": "507f1f77bcf86cd799439011",
          "studentId": "DHK001-2024-001",
          "studentName": "John Doe"
        },
        "batchId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Morning Batch",
          "timeSlot": "AM"
        },
        "date": "2024-01-20T09:00:00.000Z",
        "status": "Present",
        "method": "MANUAL"
      }
    ],
    "summary": {
      "total": 100,
      "present": 85,
      "absent": 10,
      "late": 5
    },
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  }
}
```

### Get Follow-up Report
**Method:** `GET`  
**URL:** `/api/staff/reports/follow-ups`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)
- `status` (optional) - Pending / Resolved / Dropped
- `reason` (optional) - Sick / Personal / Financial / Not Interested / Other
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "followUps": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "studentId": {
          "_id": "507f1f77bcf86cd799439011",
          "studentId": "DHK001-2024-001",
          "studentName": "John Doe"
        },
        "absentDate": "2024-01-20T00:00:00.000Z",
        "callStatus": "Connected",
        "reason": "Sick",
        "followUpStatus": "Pending"
      }
    ],
    "summary": {
      "total": 25,
      "pending": 10,
      "resolved": 12,
      "dropped": 3,
      "reasonBreakdown": {
        "Sick": 8,
        "Personal": 5,
        "Financial": 7,
        "Not Interested": 3,
        "Other": 2
      }
    },
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "pages": 1
    }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: studentId, amount, paymentMode"
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
  "message": "Access denied. Staff role required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Student not found or does not belong to your branch"
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

1. **Branch Isolation:** All queries are automatically scoped to the staff's branch. Staff cannot access data from other branches.

2. **Student Registration:** Staff-registered students have `PENDING` status and require admin approval to activate.

3. **Payment Limitations:** Staff cannot apply discounts or modify fee rules. All payments are logged under the staff's ID.

4. **Follow-ups:** Follow-ups are permanently stored and linked to both staff and student. Admin can view all follow-up reports.

5. **Salary View:** Salary information is read-only. Staff can view their attendance-based salary calculation but cannot modify it.

6. **Reports:** Staff can only view reports for data they have created (their own attendance marks, follow-ups, payments, etc.).

---

## Integration Notes

- All endpoints use the same MongoDB database as Admin and SuperAdmin panels
- JWT tokens are shared across panels (same secret)
- Branch isolation is enforced at middleware level
- Audit logs are created for all staff actions
