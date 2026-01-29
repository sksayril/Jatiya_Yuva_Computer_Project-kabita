# Admin Panel API Documentation

**Base URL:** `/api/admin`  
**Authentication:** All protected endpoints require JWT token in Authorization header  
**Branch Isolation:** All endpoints automatically filter data by admin's branch

## Authorization Header (Protected APIs)
```
Authorization: Bearer <JWT_TOKEN>
```

**JWT Token Payload:**
```json
{
  "userId": "admin_user_id",
  "role": "ADMIN",
  "branchId": "branch_id"
}
```

---

## Authentication

### Admin Login
**Method:** `POST`  
**URL:** `/api/admin/login`  
**Headers:** `Content-Type: application/json`  
**Body (raw JSON):**
```json
{
  "email": "admin@branch.com",
  "password": "password123"
}
```
**OR**
```json
{
  "adminId": "admin@branch.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "jwt_token": "<JWT_TOKEN>",
  "role": "ADMIN",
  "branchId": "<BRANCH_ID>",
  "user": {
    "id": "<USER_ID>",
    "name": "Admin Name",
    "email": "admin@branch.com"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `401` - Invalid credentials
- `403` - Account disabled or access denied

---

### Admin Logout
**Method:** `POST`  
**URL:** `/api/admin/logout`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Dashboard

### Get Dashboard Summary
**Method:** `GET`  
**URL:** `/api/admin/dashboard/summary`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "totalStaff": 10,
    "todayStudentAttendancePercentage": 85,
    "todayStaffAttendancePercentage": 100,
    "currentMonthFeeCollection": 50000,
    "totalDueFees": 25000,
    "alerts": [
      {
        "type": "HIGH_DUE",
        "message": "5 student(s) have high due amounts",
        "count": 5
      },
      {
        "type": "PENDING_APPROVAL",
        "message": "3 student(s) pending approval",
        "count": 3
      }
    ]
  }
}
```

---

## Student Management

### Manual Student Registration
**Method:** `POST`  
**URL:** `/api/admin/students/manual`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: multipart/form-data` (for file uploads) or `application/json`

**Body (form-data or JSON):**
```json
{
  "admission": {
    "admission_date": "2026-01-13",
    "course": {
      "code": "DCA",
      "type": "Certificate"
    }
  },
  "student": {
    "name": "Moumita Nandi",
    "date_of_birth": "1998-12-09",
    "gender": "Female",
    "religion": "Hindu",
    "caste": "General"
  },
  "family_details": {
    "guardian_name": "Biswanath Nandi",
    "mother_name": "Gita Nandi"
  },
  "contact_details": {
    "mobile": "7431995431",
    "whatsapp": "7431995431",
    "guardian_contact": "7431995431",
    "email": "ads@gmail.com"
  },
  "address": {
    "village": "Thakurpara",
    "post_office": "Kalna",
    "district": "Purba Bardhaman",
    "state": "West Bengal",
    "pincode": "713409",
    "country": "India"
  },
  "education": {
    "last_qualification": "HS"
  },
  "office_use": {
    "form_number": "FORM-00123",
    "receipt_number": "RCPT-4567",
    "batch_time": "AM",
    "date": "2026-01-13"
  },
  "studentPhoto": "<file>",
  "studentSignature": "<file>",
  "officeSignature": "<file>",
  "formScanImage": "<file>",
  "studentId": "AUTO",
  "branchId": "AUTO",
  "status": "ACTIVE"
}
```

**Note:** This API now uses a nested object structure. All previous flat fields have been removed. The data is organized into logical groups: `admission`, `student`, `family_details`, `contact_details`, `address`, `education`, and `office_use`.

**Field Descriptions:**
- `admission.admission_date`: Date of admission (YYYY-MM-DD format)
- `admission.course.code`: Course code/name (e.g., "DCA")
- `admission.course.type`: Course type (e.g., "Certificate", "Diploma")
- `student.name`: Full name of the student (required)
- `student.date_of_birth`: Date of birth (YYYY-MM-DD format)
- `student.gender`: Gender (Male/Female/Other)
- `student.religion`: Religion
- `student.caste`: Caste/Category
- `family_details.guardian_name`: Name of guardian
- `family_details.mother_name`: Name of mother
- `contact_details.mobile`: Mobile number (required)
- `contact_details.whatsapp`: WhatsApp number
- `contact_details.guardian_contact`: Guardian's contact number
- `contact_details.email`: Email address
- `address.village`: Village name
- `address.post_office`: Post office name
- `address.district`: District name
- `address.state`: State name
- `address.pincode`: PIN code
- `address.country`: Country name
- `education.last_qualification`: Last educational qualification
- `office_use.form_number`: Form number
- `office_use.receipt_number`: Receipt number
- `office_use.batch_time`: Batch time (AM/PM/EVENING)
- `office_use.date`: Office entry date (YYYY-MM-DD format)

**File Upload Fields (optional):**
- `studentPhoto` (file) - Student photo (jpg/png/webp)
- `studentSignature` (file) - Student signature (jpg/png/webp/pdf)
- `officeSignature` (file) - Office signature (jpg/png/webp/pdf)
- `formScanImage` (file) - Scanned form image (jpg/png/webp/pdf)

**Field Notes:**
- `studentId`: Use "AUTO" to auto-generate, or provide custom ID
- `branchId`: Use "AUTO" to use admin's branch, or provide branch ID
- `courseName`: Course name (will try to find existing course, or store as name)
- `courseId`: Optional - provide course ID instead of courseName
- `batchTime`: "AM", "PM", or "EVENING" - will try to find matching batch
- `batchId`: Optional - provide batch ID instead of batchTime
- `status`: "ACTIVE", "PENDING", "INACTIVE", or "DROPPED" (default: "ACTIVE")

**Success Response (201):**
```json
{
  "success": true,
  "message": "Student registered successfully",
  "data": {
    "studentId": "DHK001-2024-001",
    "studentName": "Moumita Nandi",
    "loginCredentials": {
      "email": "dhk001-2024-001@dhk001.edu",
      "password": "STU001"
    }
  }
}
```

**Error Responses:**
- `400` - Missing required fields (studentName, mobileNumber)
- `404` - Branch/Course/Batch not found

---

### Approve Pending Student
**Method:** `POST`  
**URL:** `/api/admin/students/:id/approve`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student approved successfully",
  "data": {
    "_id": "<STUDENT_ID>",
    "studentId": "DHK001-2024-001",
    "status": "ACTIVE",
    ...
  }
}
```

**Error Responses:**
- `404` - Student not found
- `400` - Student is not in pending status

---

### Drop Student
**Method:** `POST`  
**URL:** `/api/admin/students/:id/drop`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student dropped successfully",
  "data": {
    "_id": "<STUDENT_ID>",
    "status": "DROPPED",
    ...
  }
}
```

**Error Responses:**
- `404` - Student not found

---

### Reactivate Dropped Student
**Method:** `POST`  
**URL:** `/api/admin/students/:id/reactivate`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "batchId": "<BATCH_ID>"
}
```

**Note:** `batchId` is optional if the student had a previous batch that is still active. If the previous batch is inactive or the student had no batch, `batchId` is required.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student reactivated successfully",
  "data": {
    "_id": "<STUDENT_ID>",
    "studentId": "DHK001-2024-001",
    "studentName": "John Doe",
    "status": "ACTIVE",
    "batchId": "<BATCH_ID>",
    "totalFees": 5000,
    "paidAmount": 2000,
    "dueAmount": 3000,
    "loginCredentials": {
      "email": "dhk001-2024-001@dhk001.edu",
      "password": "STU001"
    }
  }
}
```

**Error Responses:**
- `404` - Student not found
- `400` - Student is not in DROPPED status
- `400` - Invalid or inactive branch
- `400` - Batch not found or inactive
- `400` - Student's previous batch is inactive (provide new batchId)
- `400` - batchId is required to reactivate student

**Features:**
- ✅ Validates branch (branch must be active and not deleted)
- ✅ Updates student status from DROPPED to ACTIVE
- ✅ Resumes fees & attendance (recalculates due amount)
- ✅ Assigns batch (new batch or restores to previous active batch)
- ✅ Enables login (generates credentials if missing)
- ✅ Updates batch student count
- ✅ Logs action in audit log

---

### Change Student Batch
**Method:** `POST`  
**URL:** `/api/admin/students/:id/change-batch`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "newBatchId": "<NEW_BATCH_ID>"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student batch changed successfully",
  "data": {
    "_id": "<STUDENT_ID>",
    "batchId": "<NEW_BATCH_ID>",
    ...
  }
}
```

---

### Join Student to Batch
**Method:** `POST`  
**URL:** `/api/admin/students/:studentId/join-batch`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "batchId": "<BATCH_ID>"
}
```

**Validations:**
1. Student must exist in the same branch
2. Student must not already be assigned to a batch
3. Batch must exist and be active
4. Batch must belong to the same branch
5. Batch must not be full (currentStudents < maxStudents)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student joined batch successfully",
  "data": {
    "studentId": "DHK006-2026-001",
    "studentName": "Jane Smith",
    "batchName": "Evening Batch",
    "timeSlot": "5:00 PM - 7:00 PM",
    "monthlyFee": 5000,
    "dueAmount": 5000,
    "joinDate": "2025-01-09T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid batchId format or student already in batch or batch is full
- `404` - Student or batch not found

---

### Get All Students
**Method:** `GET`  
**URL:** `/api/admin/students`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `status` (optional) - Filter by status: PENDING, ACTIVE, INACTIVE, DROPPED
- `batchId` (optional) - Filter by batch
- `courseId` (optional) - Filter by course

**Example:** `/api/admin/students?status=ACTIVE&batchId=<BATCH_ID>`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<STUDENT_ID>",
      "studentId": "DHK001-2024-001",
      "name": "John Doe",
      "mobile": "1234567890",
      "status": "ACTIVE",
      "courseId": {
        "_id": "<COURSE_ID>",
        "name": "DCA",
        "courseCategory": "Basic"
      },
      "batchId": {
        "_id": "<BATCH_ID>",
        "name": "Morning Batch",
        "timeSlot": "9:00 AM - 11:00 AM"
      },
      "totalFees": 5000,
      "paidAmount": 3000,
      "dueAmount": 2000,
      ...
    }
  ]
}
```

---

### Get Student by ID
**Method:** `GET`  
**URL:** `/api/admin/students/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<STUDENT_ID>",
    "studentId": "DHK001-2024-001",
    "name": "John Doe",
    "guardianName": "Jane Doe",
    "mobile": "1234567890",
    "address": "123 Main Street",
    "courseId": { ... },
    "batchId": { ... },
    "status": "ACTIVE",
    "totalFees": 5000,
    "paidAmount": 3000,
    "dueAmount": 2000,
    "qrCode": "data:image/png;base64,...",
    "registrationDate": "2024-01-15T00:00:00.000Z",
    ...
  }
}
```

---

## Attendance

### Mark Student Attendance
**Method:** `POST`  
**URL:** `/api/admin/attendance/student`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "studentId": "<STUDENT_ID>",
  "batchId": "<BATCH_ID>",
  "date": "2024-01-15",
  "timeSlot": "9:00 AM - 11:00 AM",
  "method": "QR",
  "qrData": "{\"studentId\":\"DHK001-2024-001\",\"branchId\":\"<BRANCH_ID>\"}"
}
```

**Method Options:**
- `QR` - QR code scanning
- `FACE` - Face recognition (placeholder)
- `MANUAL` - Manual entry

**Success Response (201):**
```json
{
  "success": true,
  "message": "Student attendance marked successfully",
  "data": {
    "_id": "<ATTENDANCE_ID>",
    "studentId": "<STUDENT_ID>",
    "batchId": "<BATCH_ID>",
    "date": "2024-01-15T00:00:00.000Z",
    "status": "Present",
    "method": "QR",
    ...
  }
}
```

**Error Responses:**
- `400` - Missing required fields, student not in batch, batch limit reached
- `404` - Student/Batch not found
- `409` - Attendance already marked for this date

---

### Mark Staff Attendance
**Method:** `POST`  
**URL:** `/api/admin/attendance/staff`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "staffId": "<STAFF_ID>",
  "date": "2024-01-15",
  "timeSlot": "9:00 AM - 5:00 PM",
  "method": "QR",
  "qrData": "{\"staffId\":\"DHK001-STF-001\",\"branchId\":\"<BRANCH_ID>\"}"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Staff attendance marked successfully",
  "data": {
    "_id": "<ATTENDANCE_ID>",
    "staffId": "<STAFF_ID>",
    "date": "2024-01-15T00:00:00.000Z",
    "checkIn": "2024-01-15T09:00:00.000Z",
    "status": "Present",
    "method": "QR",
    ...
  }
}
```

**Method Options:**
- `QR` - QR code scanning
- `FACE` - Face recognition (placeholder)
- `MANUAL` - Manual entry


**Note:** Calling this endpoint again on the same date will record check-out time.

---

### Get Student Attendance
**Method:** `GET`  
**URL:** `/api/admin/attendance/student`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `studentId` (optional) - Filter by student
- `batchId` (optional) - Filter by batch
- `startDate` (optional) - Start date (ISO format)
- `endDate` (optional) - End date (ISO format)

**Example:** `/api/admin/attendance/student?studentId=<STUDENT_ID>&startDate=2024-01-01&endDate=2024-01-31`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<ATTENDANCE_ID>",
      "studentId": {
        "_id": "<STUDENT_ID>",
        "studentId": "DHK001-2024-001",
        "name": "John Doe"
      },
      "batchId": {
        "_id": "<BATCH_ID>",
        "name": "Morning Batch",
        "timeSlot": "9:00 AM - 11:00 AM"
      },
      "date": "2024-01-15T00:00:00.000Z",
      "status": "Present",
      "method": "QR",
      ...
    }
  ]
}
```

---

### Get Staff Attendance
**Method:** `GET`  
**URL:** `/api/admin/attendance/staff`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `staffId` (optional) - Filter by staff
- `startDate` (optional) - Start date (ISO format)
- `endDate` (optional) - End date (ISO format)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<ATTENDANCE_ID>",
      "staffId": {
        "_id": "<STAFF_ID>",
        "staffId": "DHK001-STF-001",
        "name": "Staff Name",
        "role": "STAFF"
      },
      "date": "2024-01-15T00:00:00.000Z",
      "checkIn": "2024-01-15T09:00:00.000Z",
      "checkOut": "2024-01-15T17:00:00.000Z",
      "status": "Present",
      ...
    }
  ]
}
```

---

### Get Staff Attendance by ID
**Method:** `GET`  
**URL:** `/api/admin/attendance/staff/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<ATTENDANCE_ID>",
    "staffId": {
      "staffId": "DHK001-STF-001",
      "name": "Staff Name",
      "role": "STAFF",
      "mobile": "1234567890"
    },
    "date": "2024-01-15T00:00:00.000Z",
    "checkIn": "2024-01-15T09:00:00.000Z",
    "checkOut": "2024-01-15T17:00:00.000Z",
    "status": "Present",
    "method": "QR",
    "markedBy": {
      "email": "admin@branch.com",
      "role": "ADMIN"
    }
  }
}
```

---

### Update Staff Attendance
**Method:** `POST`  
**URL:** `/api/admin/attendance/staff/:id/update`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "status": "Late",
  "method": "MANUAL",
  "checkIn": "2024-01-15T09:30:00.000Z",
  "checkOut": "2024-01-15T18:00:00.000Z"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Staff attendance updated successfully",
  "data": {
    "_id": "<ATTENDANCE_ID>",
    "status": "Late",
    "method": "MANUAL",
    ...
  }
}
```

---

### Delete Staff Attendance
**Method:** `POST`  
**URL:** `/api/admin/attendance/staff/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Staff attendance deleted successfully"
}
```

---

### Get Student Attendance by ID
**Method:** `GET`  
**URL:** `/api/admin/attendance/student/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<ATTENDANCE_ID>",
    "studentId": {
      "_id": "<STUDENT_ID>",
      "studentId": "DHK006-2026-001",
      "name": "John Doe",
      "mobile": "1234567890"
    },
    "batchId": {
      "_id": "<BATCH_ID>",
      "name": "Morning Batch",
      "timeSlot": "6:00 AM - 8:00 AM"
    },
    "date": "2026-01-29T00:00:00.000Z",
    "timeSlot": "6:00 AM - 8:00 AM",
    "status": "Present",
    "method": "MANUAL",
    "markedBy": {
      "_id": "<USER_ID>",
      "email": "admin@branch.com",
      "role": "ADMIN"
    },
    "createdAt": "2026-01-29T10:30:00.000Z",
    "updatedAt": "2026-01-29T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid attendance ID format
- `404` - Student attendance not found

---

### Update Student Attendance
**Method:** `POST`  
**URL:** `/api/admin/attendance/student/:id/update`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "status": "Absent",
  "timeSlot": "6:00 AM - 8:00 AM",
  "method": "MANUAL"
}
```

**Valid Status Values:** `Present`, `Absent`, `Late`  
**Valid Method Values:** `QR`, `FACE`, `MANUAL`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student attendance updated successfully",
  "data": {
    "_id": "<ATTENDANCE_ID>",
    "studentId": {
      "_id": "<STUDENT_ID>",
      "studentId": "DHK006-2026-001",
      "name": "John Doe",
      "mobile": "1234567890"
    },
    "batchId": {
      "_id": "<BATCH_ID>",
      "name": "Morning Batch",
      "timeSlot": "6:00 AM - 8:00 AM"
    },
    "date": "2026-01-29T00:00:00.000Z",
    "status": "Absent",
    "method": "MANUAL",
    "updatedAt": "2026-01-29T10:35:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid status/method or invalid ID format
- `404` - Student attendance not found

---

### Delete Student Attendance
**Method:** `POST`  
**URL:** `/api/admin/attendance/student/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student attendance deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid attendance ID format
- `404` - Student attendance not found

---

---

## Payments

### Create Payment
**Method:** `POST`  
**URL:** `/api/admin/payments`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "studentId": "<STUDENT_ID>",
  "amount": 2000,
  "paymentMode": "CASH",
  "discount": 100,
  "description": "Monthly fee payment",
  "month": "January",
  "year": 2024
}
```

**Payment Modes:**
- `CASH` - Cash payment
- `UPI` - UPI payment
- `ONLINE` - Online payment

**Success Response (201):**
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "_id": "<PAYMENT_ID>",
    "studentId": "<STUDENT_ID>",
    "amount": 2000,
    "paymentMode": "CASH",
    "discount": 100,
    "receiptNumber": "DHK001-202401-0001",
    "month": "January",
    "year": 2024,
    "receiptPdfUrl": "",
    "createdAt": "2024-01-15T10:00:00.000Z",
    ...
  }
}
```

**Note:** Payment automatically updates student's `paidAmount` and `dueAmount`.

---

### Get Payments
**Method:** `GET`  
**URL:** `/api/admin/payments`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `studentId` (optional) - Filter by student
- `startDate` (optional) - Start date (ISO format)
- `endDate` (optional) - End date (ISO format)
- `paymentMode` (optional) - Filter by payment mode: CASH, UPI, ONLINE

**Example:** `/api/admin/payments?studentId=<STUDENT_ID>&startDate=2024-01-01`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<PAYMENT_ID>",
      "studentId": {
        "_id": "<STUDENT_ID>",
        "studentId": "DHK001-2024-001",
        "name": "John Doe",
        "mobile": "1234567890"
      },
      "amount": 2000,
      "paymentMode": "CASH",
      "discount": 100,
      "receiptNumber": "DHK001-202401-0001",
      "collectedBy": {
        "_id": "<USER_ID>",
        "name": "Admin Name",
        "email": "admin@branch.com"
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      ...
    }
  ]
}
```

---

### Get Payment by ID
**Method:** `GET`  
**URL:** `/api/admin/payments/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<PAYMENT_ID>",
    "studentId": {
      "_id": "<STUDENT_ID>",
      "studentId": "DHK001-2024-001",
      "name": "John Doe",
      "mobile": "1234567890",
      "email": "john@example.com"
    },
    "amount": 2000,
    "paymentMode": "CASH",
    "discount": 100,
    "receiptNumber": "DHK001-202401-0001",
    "month": "January",
    "year": 2024,
    "description": "Monthly fee payment",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Payment not found

---

### Update Payment
**Method:** `POST`  
**URL:** `/api/admin/payments/:id/update`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Description:** Updates a payment record. Updates student's paid amount and due amount accordingly if amount or discount changes. All fields are optional.

**Body (raw JSON, all fields optional):**
```json
{
  "amount": 2500,
  "paymentMode": "UPI",
  "discount": 150,
  "description": "Updated payment for January"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment updated successfully",
  "data": {
    "_id": "<PAYMENT_ID>",
    "studentId": {
      "_id": "<STUDENT_ID>",
      "studentId": "DHK001-2024-001",
      "name": "John Doe",
      "mobile": "1234567890",
      "email": "john@example.com"
    },
    "amount": 2500,
    "paymentMode": "UPI",
    "discount": 150,
    "receiptNumber": "DHK001-202401-0001",
    "month": "January",
    "year": 2024,
    "description": "Updated payment for January",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Payment not found
- `404` - Student not found

**Notes:**
- All fields are optional—only provided fields will be updated
- If amount or discount changes, student's `paidAmount` and `dueAmount` are automatically recalculated
- All actions are logged in audit log

---

### Delete Payment
**Method:** `POST`  
**URL:** `/api/admin/payments/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Description:** Deletes a payment record. Automatically reverses the payment by updating student's paid amount and due amount.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment deleted successfully"
}
```

**Error Responses:**
- `404` - Payment not found
- `404` - Student not found

**Notes:**
- Deleting a payment reverses its effect on student's financials
- Student's `paidAmount` is decreased and `dueAmount` is increased
- This action cannot be undone
- All actions are logged in audit log

---

## Courses

### Create Course
**Method:** `POST`  
**URL:** `/api/admin/courses`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (form-data):**
- `name` (text) - Course name
- `description` (text) - Course description
- `duration` (text) - Course duration
- `courseCategory` (text) - Basic | Advanced | Diploma
- `courseFees` (text) - Total course fees
- `admissionFees` (text) - Admission fees
- `monthlyFees` (text) - Monthly fees
- `image` (file, optional) - Course image (jpg/png/webp)
- `pdf` (file, optional) - Course PDF

**Success Response (201):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "<COURSE_ID>",
    "name": "DCA",
    "description": "Diploma in Computer Applications",
    "duration": "6 months",
    "courseCategory": "Basic",
    "courseFees": 5000,
    "admissionFees": 500,
    "monthlyFees": 1000,
    "imageUrl": "https://s3.../image.jpg",
    "pdfUrl": "https://s3.../document.pdf",
    "isActive": true,
    ...
  }
}
```

---

### Get Courses
**Method:** `GET`  
**URL:** `/api/admin/courses`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `courseCategory` (optional) - Filter by category: Basic, Advanced, Diploma
- `isActive` (optional) - Filter by active status: true, false

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<COURSE_ID>",
      "name": "DCA",
      "courseCategory": "Basic",
      "courseFees": 5000,
      "isActive": true,
      ...
    }
  ]
}
```

---

## Batches

### Create Batch
**Method:** `POST`  
**URL:** `/api/admin/batches`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "name": "Morning Batch",
  "timeSlot": "9:00 AM - 11:00 AM",
  "monthlyFee": 1000,
  "isKidsBatch": false,
  "discountPercentage": 0,
  "batchType": "OFFLINE",
  "teacherId": "<TEACHER_ID>",
  "courseId": "<COURSE_ID>",
  "maxStudents": 30
}
```

**Batch Type Options:**
- `OFFLINE` - Classroom-based learning
- `ONLINE` - Online/virtual learning
- `HYBRID` - Mix of offline and online classes

**Success Response (201):**
```json
{
  "success": true,
  "message": "Batch created successfully",
  "data": {
    "_id": "<BATCH_ID>",
    "name": "Morning Batch",
    "timeSlot": "9:00 AM - 11:00 AM",
    "monthlyFee": 1000,
    "isKidsBatch": false,
    "discountPercentage": 0,
    "batchType": "OFFLINE",
    "courseId": {
      "_id": "<COURSE_ID>",
      "name": "DCA",
      "courseCategory": "Basic"
    },
    "teacherId": {
      "_id": "<TEACHER_ID>",
      "name": "Teacher Name",
      "email": "teacher@branch.com"
    },
    "maxStudents": 30,
    "currentStudents": 0,
    "isActive": true,
    "branchId": "<BRANCH_ID>",
    "createdAt": "2026-01-27T09:28:12.485Z",
    "updatedAt": "2026-01-27T09:28:12.485Z"
  }
}
```

**Note:** For kids batches, `discountPercentage` is locked (read-only) once set.

---

### Get Batches
**Method:** `GET`  
**URL:** `/api/admin/batches`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `courseId` (optional) - Filter by course
- `isActive` (optional) - Filter by active status
- `isKidsBatch` (optional) - Filter kids batches: true, false

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<BATCH_ID>",
      "name": "Morning Batch",
      "timeSlot": "9:00 AM - 11:00 AM",
      "monthlyFee": 1000,
      "courseId": {
        "_id": "<COURSE_ID>",
        "name": "DCA",
        "courseCategory": "Basic"
      },
      "teacherId": {
        "_id": "<TEACHER_ID>",
        "name": "Teacher Name",
        "email": "teacher@branch.com"
      },
      "currentStudents": 25,
      "maxStudents": 30,
      ...
    }
  ]
}
```

---

### Get Batch by ID
**Method:** `GET`  
**URL:** `/api/admin/batches/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<BATCH_ID>",
    "name": "Morning Batch",
    "timeSlot": "9:00 AM - 11:00 AM",
    "monthlyFee": 1000,
    "isKidsBatch": false,
    "discountPercentage": 0,
    "courseId": {
      "_id": "<COURSE_ID>",
      "name": "DCA",
      "courseCategory": "Basic"
    },
    "teacherId": {
      "_id": "<TEACHER_ID>",
      "name": "Teacher Name",
      "email": "teacher@branch.com"
    },
    "currentStudents": 25,
    "maxStudents": 30,
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Batch not found

---

### Update Batch
**Method:** `POST`  
**URL:** `/api/admin/batches/:id/update`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "name": "Updated Batch Name",
  "timeSlot": "10:00 AM - 12:00 PM",
  "monthlyFee": 1200,
  "teacherId": "<NEW_TEACHER_ID>",
  "maxStudents": 35,
  "isActive": true
}
```

**Note:** `discountPercentage` cannot be changed for kids batches.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Batch updated successfully",
  "data": {
    "_id": "<BATCH_ID>",
    "name": "Updated Batch Name",
    "timeSlot": "10:00 AM - 12:00 PM",
    "monthlyFee": 1200,
    "isKidsBatch": false,
    "discountPercentage": 0,
    "batchType": "OFFLINE",
    "courseId": {
      "_id": "<COURSE_ID>",
      "name": "DCA",
      "courseCategory": "Basic"
    },
    "teacherId": {
      "_id": "<NEW_TEACHER_ID>",
      "name": "Updated Teacher Name",
      "email": "teacher@branch.com"
    },
    "maxStudents": 35,
    "currentStudents": 25,
    "isActive": true,
    "branchId": "<BRANCH_ID>",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-27T09:30:00.000Z"
  }
}
```

---

### Delete Batch
**Method:** `POST`  
**URL:** `/api/admin/batches/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Batch deleted successfully"
}
```

**Error Responses:**
- `404` - Batch not found
- `400` - Cannot delete batch with active students

**Notes:**
- Batch must have no active students to be deleted
- This action cannot be undone
- All actions are logged in audit log

---

### Assign Teacher to Batch
**Method:** `POST`  
**URL:** `/api/admin/batches/:id/assign-teacher`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Description:** Assigns a teacher to a batch. This endpoint is accessible to both ADMIN and STAFF roles. If a teacher is already assigned to the batch, the old assignment is replaced with the new one.

**Body (raw JSON):**
```json
{
  "teacherId": "<TEACHER_ID>",
  "course": "<COURSE_ID>"
}
```

**Notes on fields:**
- `teacherId` (required) - Teacher ID to assign to the batch
- `course` (optional) - Course ID used only to validate that the batch belongs to the expected course; provide when you want the server to verify course-match

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher assigned to batch successfully",
  "data": {
    "_id": "<BATCH_ID>",
    "name": "Morning Batch",
    "timeSlot": "9:00 AM - 11:00 AM",
    "monthlyFee": 1000,
    "isKidsBatch": false,
    "discountPercentage": 0,
    "batchType": "OFFLINE",
    "courseId": {
      "_id": "<COURSE_ID>",
      "name": "DCA",
      "courseCategory": "Basic"
    },
    "teacherId": {
      "_id": "<TEACHER_ID>",
      "name": "Teacher Name",
      "email": "teacher@branch.com"
    },
    "maxStudents": 30,
    "currentStudents": 25,
    "isActive": true,
    "branchId": "<BRANCH_ID>",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-27T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields: teacherId
- `400` - Course ID provided but does not match batch course
- `404` - Batch not found
- `404` - Teacher not found

**Notes:**
- If a teacher is already assigned to the batch, the old teacher is automatically unassigned
- The old teacher's `assignedBatches` array is updated to remove this batch
- The new teacher's `assignedBatches` array is updated to include this batch
- Both ADMIN and STAFF roles can use this endpoint
- All actions are logged in audit log

## Staff

### Create Staff
**Method:** `POST`  
**URL:** `/api/admin/staff`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "name": "Staff Name",
  "email": "staff@branch.com",
  "mobile": "1234567890",
  "salaryType": "MONTHLY_FIXED",
  "salaryRate": 15000
}
```

**Required Fields:**
- `name` - Staff name
- `email` - Email address (must be unique)
- `mobile` - Mobile number
- `salaryType` - Must be `MONTHLY_FIXED` (only allowed value)
- `salaryRate` - Monthly salary amount (number)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Staff created successfully",
  "data": {
    "_id": "<STAFF_ID>",
    "staffId": "DHK001-STF-001",
    "name": "Staff Name",
    "email": "staff@branch.com",
    "mobile": "1234567890",
    "role": "STAFF",
    "salaryType": "MONTHLY_FIXED",
    "salaryRate": 15000,
    "currentMonthClasses": 0,
    "currentMonthSalary": 0,
    "loginCredentials": {
      "email": "staff@branch.com",
      "password": "STF001"
    },
    "isActive": true,
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `400` - Invalid salaryType (must be MONTHLY_FIXED)
- `409` - Email already registered (in Staff or Teacher model)
- `404` - Branch not found

**Notes:**
- This endpoint creates STAFF members only. To create teachers, use `/api/admin/teachers`
- Staff ID is automatically generated in format: `BRANCH_CODE-STF-SEQUENCE` (e.g., `DHK001-STF-001`)
- Login credentials are automatically generated (password format: `STF{SEQUENCE}`)
- Email is checked against both Staff and Teacher models to ensure uniqueness

---

### Get Staff
**Method:** `GET`  
**URL:** `/api/admin/staff`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `role` (optional) - Filter by role: STAFF, TEACHER
- `isActive` (optional) - Filter by active status: true, false

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<STAFF_ID>",
      "staffId": "DHK001-STF-001",
      "name": "Staff Name",
      "email": "staff@branch.com",
      "mobile": "1234567890",
      "role": "STAFF",
      "salaryType": "MONTHLY_FIXED",
      "salaryRate": 15000,
      "isActive": true,
      "loginCredentials": {
        "email": "staff@branch.com",
        "password": "STF001"
      },
      "createdAt": "2026-01-24T10:00:00.000Z",
      "updatedAt": "2026-01-24T10:00:00.000Z"
    }
  ]
}
```

---

### Get Staff by ID
**Method:** `GET`  
**URL:** `/api/admin/staff/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<STAFF_ID>",
    "staffId": "DHK001-STF-001",
    "name": "Staff Name",
    "email": "staff@branch.com",
    "mobile": "1234567890",
    "role": "STAFF",
    "salaryType": "MONTHLY_FIXED",
    "salaryRate": 15000,
    "isActive": true,
    "loginCredentials": {
      "email": "staff@branch.com",
      "password": "STF001"
    },
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Staff not found

---

### Update Staff
**Method:** `POST`  
**URL:** `/api/admin/staff/:id/update`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON, all fields optional):**
```json
{
  "name": "Updated Staff Name",
  "email": "updated.staff@branch.com",
  "mobile": "9876543210",
  "salaryType": "MONTHLY_FIXED",
  "salaryRate": 18000,
  "isActive": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Staff updated successfully",
  "data": {
    "_id": "<STAFF_ID>",
    "staffId": "DHK001-STF-001",
    "name": "Updated Staff Name",
    "email": "updated.staff@branch.com",
    "mobile": "9876543210",
    "role": "STAFF",
    "salaryType": "MONTHLY_FIXED",
    "salaryRate": 18000,
    "isActive": true,
    "loginCredentials": {
      "email": "updated.staff@branch.com",
      "password": "STF001"
    },
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-27T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Staff not found
- `400` - Invalid salaryType (must be MONTHLY_FIXED)
- `409` - Email already registered

**Notes:**
- All fields are optional - only provided fields will be updated
- Email is checked against both Staff and Teacher models to ensure uniqueness
- Email update also updates login credentials email

---

### Delete Staff
**Method:** `POST`  
**URL:** `/api/admin/staff/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Staff deleted successfully"
}
```

**Error Responses:**
- `404` - Staff not found

**Notes:**
- Staff is permanently deleted from the database
- This action cannot be undone
- All actions are logged in audit log

---

### Create Teacher (Dedicated Endpoint)
**Method:** `POST`  
**URL:** `/api/admin/teachers`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Description:** Creates a new teacher with automatic role assignment. This endpoint is specifically designed for teacher creation with teacher-specific validations. Batches can be assigned later if not provided during creation.

**Body (raw JSON):**
```json
{
  "name": "Teacher Name",
  "email": "teacher@branch.com",
  "mobile": "1234567890",
  "assignedBatches": ["<BATCH_ID_1>", "<BATCH_ID_2>"],
  "salaryType": "PER_CLASS",
  "salaryRate": 300
}
```

**Required Fields:**
- `name` - Teacher's full name
- `email` - Teacher's email address (must be unique)
- `mobile` - Teacher's mobile number
- `salaryType` - PER_CLASS | MONTHLY_FIXED | HOURLY
- `salaryRate` - Salary rate (number)

**Optional Fields:**
- `assignedBatches` - Array of batch IDs (can be assigned later if not provided)

**Salary Type Options:**
- `PER_CLASS` - Payment per class taken
- `MONTHLY_FIXED` - Fixed monthly salary
- `HOURLY` - Hourly rate

**Success Response (201):**
```json
{
  "success": true,
  "message": "Teacher created successfully",
  "data": {
    "_id": "<TEACHER_ID>",
    "teacherId": "DHK001-TCH-001",
    "name": "Teacher Name",
    "email": "teacher@branch.com",
    "mobile": "1234567890",
    "assignedBatches": ["<BATCH_ID_1>", "<BATCH_ID_2>"],
    "salaryType": "PER_CLASS",
    "salaryRate": 300,
    "loginCredentials": {
      "email": "teacher@branch.com",
      "password": "TCH001"
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `400` - assignedBatches must be an array with at least one batch ID if provided
- `400` - Invalid salaryType
- `400` - One or more batches not found, inactive, or belong to different branch
- `409` - Email already registered
- `404` - Branch not found

**Notes:**
- Teacher ID is auto-generated in format: `BRANCH_CODE-TCH-SEQUENCE` (e.g., `DHK001-TCH-001`)
- Login credentials are auto-generated (password format: `TCH{SEQUENCE}`)
- `assignedBatches` is optional - batches can be assigned during creation or later
- If batches are provided, they are automatically updated with the teacher's ID
- All batches must be active and belong to the same branch (if provided)
- Teachers are stored in a separate `Teacher` model (not in Staff model)

---

### Get All Teachers
**Method:** `GET`  
**URL:** `/api/admin/teachers`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters (optional):**
- `isActive` - Filter by active status: `true`, `false`

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "<TEACHER_ID>",
      "teacherId": "DHK001-TCH-001",
      "name": "Teacher Name",
      "email": "teacher@branch.com",
      "mobile": "1234567890",
      "assignedBatches": [
        {
          "_id": "<BATCH_ID>",
          "name": "Morning Batch",
          "timeSlot": "9:00 AM - 11:00 AM",
          "courseId": "<COURSE_ID>"
        }
      ],
      "salaryType": "PER_CLASS",
      "salaryRate": 300,
      "currentMonthClasses": 20,
      "currentMonthSalary": 6000,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Get Teacher by ID
**Method:** `GET`  
**URL:** `/api/admin/teachers/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<TEACHER_ID>",
    "teacherId": "DHK001-TCH-001",
    "name": "Teacher Name",
    "email": "teacher@branch.com",
    "mobile": "1234567890",
    "assignedBatches": [
      {
        "_id": "<BATCH_ID>",
        "name": "Morning Batch",
        "timeSlot": "9:00 AM - 11:00 AM",
        "courseId": "<COURSE_ID>"
      }
    ],
    "salaryType": "PER_CLASS",
    "salaryRate": 300,
    "currentMonthClasses": 20,
    "currentMonthSalary": 6000,
    "isActive": true,
    "branchId": {
      "_id": "<BRANCH_ID>",
      "name": "Dhaka Main",
      "code": "DHK001"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Teacher not found

---

### Update Teacher
**Method:** `POST`  
**URL:** `/api/admin/teachers/:id/update`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON, all fields optional):**
```json
{
  "name": "Updated Teacher Name",
  "email": "updated.teacher@branch.com",
  "mobile": "9876543210",
  "assignedBatches": ["<BATCH_ID_1>", "<BATCH_ID_2>"],
  "salaryType": "MONTHLY_FIXED",
  "salaryRate": 15000,
  "isActive": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher updated successfully",
  "data": {
    "_id": "<TEACHER_ID>",
    "teacherId": "DHK001-TCH-001",
    "name": "Updated Teacher Name",
    "email": "updated.teacher@branch.com",
    "mobile": "9876543210",
    "assignedBatches": ["<BATCH_ID_1>", "<BATCH_ID_2>"],
    "salaryType": "MONTHLY_FIXED",
    "salaryRate": 15000,
    "isActive": true,
    ...
  }
}
```

**Error Responses:**
- `404` - Teacher not found
- `400` - Invalid salaryType
- `400` - One or more batches not found, inactive, or belong to different branch
- `409` - Email already registered

**Notes:**
- All fields are optional - only provided fields will be updated
- When updating `assignedBatches`, batches are automatically updated with teacher assignment
- Old batch assignments are removed and new ones are added
- Email update also updates login credentials email

---

### Delete Teacher
**Method:** `POST`  
**URL:** `/api/admin/teachers/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher deleted successfully"
}
```

**Error Responses:**
- `404` - Teacher not found

**Notes:**
- Teacher is permanently deleted from the database
- Teacher assignment is automatically removed from all assigned batches
- This action cannot be undone
- All actions are logged in audit log

---

## Exams

### Create Exam
**Method:** `POST`  
**URL:** `/api/admin/exams`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "name": "Monthly Test - January",
  "examType": "MONTHLY",
  "courseId": "<COURSE_ID>",
  "batchId": "<BATCH_ID>",
  "examDate": "2024-01-30",
  "maxMarks": 100,
  "passingMarks": 40
}
```

**Exam Type Options:**
- `MONTHLY` - Monthly exam
- `6M` - 6-month exam
- `1Y` - 1-year exam

**Success Response (201):**
```json
{
  "success": true,
  "message": "Exam created successfully",
  "data": {
    "_id": "<EXAM_ID>",
    "name": "Monthly Test - January",
    "examType": "MONTHLY",
    "courseId": "<COURSE_ID>",
    "batchId": "<BATCH_ID>",
    "examDate": "2024-01-30T00:00:00.000Z",
    "maxMarks": 100,
    "passingMarks": 40,
    "isActive": true,
    ...
  }
}
```

---

### Get Exams
**Method:** `GET`  
**URL:** `/api/admin/exams`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `examType` (optional) - Filter by type: MONTHLY, 6M, 1Y
- `courseId` (optional) - Filter by course
- `isActive` (optional) - Filter by active status

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<EXAM_ID>",
      "name": "Monthly Test - January",
      "examType": "MONTHLY",
      "courseId": {
        "_id": "<COURSE_ID>",
        "name": "DCA",
        "courseCategory": "Basic"
      },
      "examDate": "2024-01-30T00:00:00.000Z",
      "maxMarks": 100,
      "passingMarks": 40,
      ...
    }
  ]
}
```

---

### Get Exam by ID
**Method:** `GET`  
**URL:** `/api/admin/exams/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<EXAM_ID>",
    "name": "Monthly Test - January",
    "examType": "MONTHLY",
    "courseId": {
      "_id": "<COURSE_ID>",
      "name": "DCA",
      "courseCategory": "Basic"
    },
    "batchId": {
      "_id": "<BATCH_ID>",
      "name": "Morning Batch",
      "timeSlot": "9:00 AM - 11:00 AM"
    },
    "examDate": "2024-01-30T00:00:00.000Z",
    "maxMarks": 100,
    "passingMarks": 40,
    "isActive": true
  }
}
```

---

### Update Exam
**Method:** `POST`  
**URL:** `/api/admin/exams/:id/update`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON, all fields optional):**
```json
{
  "name": "Revised Monthly Test",
  "maxMarks": 50,
  "passingMarks": 15,
  "isActive": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Exam updated successfully",
  "data": {
    "_id": "<EXAM_ID>",
    "name": "Revised Monthly Test",
    ...
  }
}
```

---

### Delete Exam
**Method:** `POST`  
**URL:** `/api/admin/exams/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Exam deleted successfully"
}
```

---

## Results

### Create/Update Result
**Method:** `POST`  
**URL:** `/api/admin/results`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "examId": "<EXAM_ID>",
  "studentId": "<STUDENT_ID>",
  "marksObtained": 75,
  "maxMarks": 100,
  "remarks": "Good performance"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Result recorded successfully",
  "data": {
    "_id": "<RESULT_ID>",
    "examId": "<EXAM_ID>",
    "studentId": "<STUDENT_ID>",
    "marksObtained": 75,
    "maxMarks": 100,
    "percentage": 75,
    "status": "PASS",
    "remarks": "Good performance",
    ...
  }
}
```

**Note:** Result automatically calculates percentage and determines PASS/FAIL status.

---

### Get Results
**Method:** `GET`  
**URL:** `/api/admin/results`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `examId` (optional) - Filter by exam
- `studentId` (optional) - Filter by student
- `status` (optional) - Filter by status: PASS, FAIL

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<RESULT_ID>",
      "examId": {
        "_id": "<EXAM_ID>",
        "name": "Monthly Test - January",
        "examType": "MONTHLY",
        "examDate": "2024-01-30T00:00:00.000Z"
      },
      "studentId": {
        "_id": "<STUDENT_ID>",
        "studentId": "DHK001-2024-001",
        "name": "John Doe"
      },
      "marksObtained": 75,
      "maxMarks": 100,
      "percentage": 75,
      "status": "PASS",
      ...
    }
  ]
}
```

---

### Get Result by ID
**Method:** `GET`  
**URL:** `/api/admin/results/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<RESULT_ID>",
    "examId": {
      "_id": "<EXAM_ID>",
      "name": "Monthly Test - January",
      "examType": "MONTHLY",
      "passingMarks": 40,
      "maxMarks": 100
    },
    "studentId": {
      "studentId": "DHK001-2024-001",
      "name": "John Doe",
      "mobile": "1234567890"
    },
    "marksObtained": 75,
    "maxMarks": 100,
    "percentage": 75,
    "status": "PASS",
    "remarks": "Excellent"
  }
}
```

---

### Update Result
**Method:** `POST`  
**URL:** `/api/admin/results/:id/update`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON, all fields optional):**
```json
{
  "marksObtained": 85,
  "maxMarks": 100,
  "remarks": "Updated marks after re-evaluation"
}
```

**Note:** If `marksObtained` or `maxMarks` are updated, `percentage` and `status` (PASS/FAIL) are automatically recalculated.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Result updated successfully",
  "data": {
    "_id": "<RESULT_ID>",
    "marksObtained": 85,
    "percentage": 85,
    "status": "PASS",
    ...
  }
}
```

---

### Delete Result
**Method:** `POST`  
**URL:** `/api/admin/results/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Result deleted successfully"
}
```

---

## Certificates

### Generate Certificate
**Method:** `POST`  
**URL:** `/api/admin/certificates`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "studentId": "<STUDENT_ID>",
  "courseId": "<COURSE_ID>"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Certificate generated successfully",
  "data": {
    "_id": "<CERTIFICATE_ID>",
    "studentId": "<STUDENT_ID>",
    "courseId": "<COURSE_ID>",
    "certificateId": "CERT-2024-000001",
    "issueDate": "2024-01-15T00:00:00.000Z",
    "verified": true,
    ...
  }
}
```

**Error Responses:**
- `400` - Student must pass all required exams
- `409` - Certificate already generated

**Note:** Student must have PASS status in all required exams for the course.

---

### Get Certificates
**Method:** `GET`  
**URL:** `/api/admin/certificates`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `studentId` (optional) - Filter by student
- `courseId` (optional) - Filter by course

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<CERTIFICATE_ID>",
      "certificateId": "CERT-2024-000001",
      "studentId": {
        "_id": "<STUDENT_ID>",
        "studentId": "DHK001-2024-001",
        "name": "John Doe"
      },
      "courseId": {
        "_id": "<COURSE_ID>",
        "name": "DCA",
        "courseCategory": "Basic"
      },
      "issueDate": "2024-01-15T00:00:00.000Z",
      "verified": true,
      ...
    }
  ]
}
```

---

## Inquiries

### Create Inquiry
**Method:** `POST`  
**URL:** `/api/admin/inquiries`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "name": "Prospect Name",
  "mobile": "1234567890",
  "email": "prospect@email.com",
  "address": "123 Main Street",
  "courseInterest": "DCA",
  "source": "Website",
  "notes": "Interested in morning batch"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Inquiry created successfully",
  "data": {
    "_id": "<INQUIRY_ID>",
    "name": "Prospect Name",
    "mobile": "1234567890",
    "status": "NEW",
    "courseInterest": "DCA",
    "source": "Website",
    "handledBy": "<USER_ID>",
    ...
  }
}
```

---

### Get Inquiries
**Method:** `GET`  
**URL:** `/api/admin/inquiries`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `status` (optional) - Filter by status: NEW, CONTACTED, FOLLOW_UP, CONVERTED, LOST
- `source` (optional) - Filter by source

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<INQUIRY_ID>",
      "name": "Prospect Name",
      "mobile": "1234567890",
      "email": "prospect@email.com",
      "status": "NEW",
      "courseInterest": "DCA",
      "source": "Website",
      "convertedToStudentId": null,
      "handledBy": {
        "_id": "<USER_ID>",
        "name": "Admin Name",
        "email": "admin@branch.com"
      },
      ...
    }
  ]
}
```

---

### Convert Inquiry to Student
**Method:** `PATCH`  
**URL:** `/api/admin/inquiries/:id/convert`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "studentId": "<STUDENT_ID>"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Inquiry converted to student successfully",
  "data": {
    "_id": "<INQUIRY_ID>",
    "status": "CONVERTED",
    "convertedToStudentId": "<STUDENT_ID>",
    ...
  }
}
```

---

## Recorded Classes

### Create Recorded Class
**Method:** `POST`  
**URL:** `/api/admin/recorded-classes`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (form-data):**
- `batchId` (text) - Batch ID
- `courseId` (text) - Course ID
- `title` (text) - Class title
- `description` (text, optional) - Class description
- `duration` (text, optional) - Video duration in seconds
- `expiryDate` (text, optional) - Expiry date (ISO format)
- `allowedStudents` (text, optional) - Comma-separated student IDs
- `allowDownload` (text, optional) - true/false
- `video` (file) - Video file (mp4/avi/mov/mkv)
- `thumbnail` (file, optional) - Thumbnail image

**Success Response (201):**
```json
{
  "success": true,
  "message": "Recorded class created successfully",
  "data": {
    "_id": "<RECORDED_CLASS_ID>",
    "batchId": "<BATCH_ID>",
    "courseId": "<COURSE_ID>",
    "title": "Introduction to Programming",
    "description": "Basic programming concepts",
    "videoUrl": "https://s3.../video.mp4",
    "thumbnailUrl": "https://s3.../thumbnail.jpg",
    "duration": 3600,
    "expiryDate": "2024-12-31T00:00:00.000Z",
    "accessControl": {
      "allowedStudents": ["<STUDENT_ID_1>", "<STUDENT_ID_2>"],
      "allowDownload": false
    },
    "isActive": true,
    ...
  }
}
```

---

### Get Recorded Classes
**Method:** `GET`  
**URL:** `/api/admin/recorded-classes`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `batchId` (optional) - Filter by batch
- `courseId` (optional) - Filter by course
- `isActive` (optional) - Filter by active status

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<RECORDED_CLASS_ID>",
      "title": "Introduction to Programming",
      "batchId": {
        "_id": "<BATCH_ID>",
        "name": "Morning Batch",
        "timeSlot": "9:00 AM - 11:00 AM"
      },
      "courseId": {
        "_id": "<COURSE_ID>",
        "name": "DCA",
        "courseCategory": "Basic"
      },
      "videoUrl": "https://s3.../video.mp4",
      "duration": 3600,
      "expiryDate": "2024-12-31T00:00:00.000Z",
      "accessControl": {
        "allowedStudents": [
          {
            "_id": "<STUDENT_ID>",
            "studentId": "DHK001-2024-001",
            "name": "John Doe"
          }
        ],
        "allowDownload": false
      },
      ...
    }
  ]
}
```

---

## Reports

### Get Attendance Report
**Method:** `GET`  
**URL:** `/api/admin/reports/attendance`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `type` (required) - Report type: `student` or `staff`
- `startDate` (optional) - Start date (ISO format), defaults to first day of current month
- `endDate` (optional) - End date (ISO format), defaults to last day of current month
- `batchId` (optional) - Filter by batch (for student reports)
- `studentId` (optional) - Filter by student (for student reports)
- `staffId` (optional) - Filter by staff (for staff reports, use `studentId` param)

**Example:** `/api/admin/reports/attendance?type=student&startDate=2024-01-01&endDate=2024-01-31&batchId=<BATCH_ID>`

**Success Response (200) - Student:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRecords": 450,
      "presentCount": 380,
      "absentCount": 60,
      "lateCount": 10,
      "attendancePercentage": 84
    },
    "records": [...]
  },
  "export": {
    "format": "pdf",
    "url": ""
  }
}
```

**Success Response (200) - Staff:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRecords": 200,
      "presentCount": 195,
      "attendancePercentage": 98
    },
    "records": [...]
  },
  "export": {
    "format": "pdf",
    "url": ""
  }
}
```

---

### Get Fees Report
**Method:** `GET`  
**URL:** `/api/admin/reports/fees`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `startDate` (optional) - Start date (ISO format)
- `endDate` (optional) - End date (ISO format)
- `studentId` (optional) - Filter by student
- `paymentMode` (optional) - Filter by payment mode: CASH, UPI, ONLINE

**Example:** `/api/admin/reports/fees?startDate=2024-01-01&endDate=2024-01-31`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCollection": 150000,
      "totalDiscount": 5000,
      "netCollection": 145000,
      "totalPayments": 120,
      "paymentModeBreakdown": {
        "cash": 80,
        "upi": 30,
        "online": 10
      }
    },
    "records": [...]
  },
  "export": {
    "format": "excel",
    "url": ""
  }
}
```

---

### Get Salary Report
**Method:** `GET`  
**URL:** `/api/admin/reports/salary`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `month` (optional) - Month number (1-12), defaults to current month
- `year` (optional) - Year, defaults to current year
- `staffId` (optional) - Filter by staff

**Example:** `/api/admin/reports/salary?month=1&year=2024`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "month": 1,
    "year": 2024,
    "summary": {
      "totalStaff": 10,
      "totalSalary": 50000
    },
    "records": [
      {
        "staffId": "DHK001-TCH-001",
        "name": "Teacher Name",
        "role": "TEACHER",
        "salaryType": "PER_CLASS",
        "salaryRate": 300,
        "currentMonthClasses": 20,
        "calculatedSalary": 6000
      },
      ...
    ]
  },
  "export": {
    "format": "pdf",
    "url": ""
  }
}
```

---

## Health Check

### Server Health
**Method:** `GET`  
**URL:** `/api/admin/health`  
**No Authentication Required**

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin Panel Server is running",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: name, mobile, courseId, batchId"
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
  "message": "Access denied. Admin role required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Student not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Attendance already marked for this date"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error while creating student",
  "error": "Detailed error message (only in development)"
}
```

---

## Notes

1. **Branch Isolation:** All endpoints automatically filter data by the admin's branch. Admins can only access data from their assigned branch.

2. **JWT Token:** Token must be included in the Authorization header for all protected endpoints. Token expires after 7 days (configurable).

3. **File Uploads:** File uploads support both AWS S3 and local storage. If S3 is not configured, files are stored locally.

4. **Placeholders:**
   - OCR functionality is placeholder - integrate actual OCR service
   - PDF generation is placeholder - integrate PDF library
   - Face recognition is placeholder - integrate face recognition service

5. **QR Codes:** QR codes are generated for students, staff, and certificates. QR data contains JSON with relevant IDs.

6. **Auto Calculations:**
   - Student fees are auto-calculated based on registration date
   - Staff salary is auto-calculated based on attendance (for PER_CLASS type)
   - Result percentage and pass/fail status are auto-calculated

7. **Kids Batch Discount:** Discount percentage for kids batches is locked (read-only) once set.

8. **Certificate Generation:** Requires student to have PASS status in all required exams for the course.

---

## API Version

**Version:** 1.0.0  
**Last Updated:** 2024-01-15
