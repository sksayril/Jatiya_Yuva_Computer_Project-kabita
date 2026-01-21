# Student Panel API Documentation

Complete API documentation for the Student Panel of National Youth Computer Center.

**Base URL:** `http://localhost:3000/api/student`

**Authentication:** All endpoints (except login) require JWT token in header: `Authorization: Bearer <token>`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [Profile & ID Card](#profile--id-card)
4. [Attendance](#attendance)
5. [Fees](#fees)
6. [Payments](#payments)
7. [Alerts](#alerts)
8. [Course & Batch](#course--batch)
9. [Classes](#classes)
10. [Exams](#exams)
11. [Results](#results)
12. [Certificates](#certificates)
13. [Notices](#notices)
14. [Absence History](#absence-history)

---

## Authentication

### Student Login
**Method:** `POST`  
**URL:** `/api/student/login`  
**Body (raw JSON):**
```json
{
  "studentId": "DHK001-2024-001",
  "password": "password123"
}
```
**OR**
```json
{
  "mobile": "9876543210",
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
    "role": "STUDENT",
    "branchId": "507f1f77bcf86cd799439011",
    "studentId": "DHK001-2024-001",
    "name": "John Doe",
    "email": "john@example.com",
    "mobileNumber": "9876543210"
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

## Dashboard

### Get Dashboard Summary
**Method:** `GET`  
**URL:** `/api/student/dashboard/summary`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "todayClassStatus": {
      "status": "Present",
      "timeSlot": "AM",
      "marked": true
    },
    "attendancePercentage": 85,
    "monthlyFeeStatus": {
      "status": "Paid",
      "monthlyFee": 1000,
      "monthlyPaid": 1000,
      "dueAmount": 0,
      "nextDueDate": "2024-02-15T00:00:00.000Z"
    },
    "notifications": [
      {
        "type": "UPCOMING_EXAM",
        "message": "2 upcoming exam(s)",
        "exams": [
          {
            "name": "Monthly Test",
            "type": "Monthly",
            "date": "2024-01-25T10:00:00.000Z"
          }
        ],
        "priority": "MEDIUM"
      },
      {
        "type": "CLASS_REMINDER",
        "message": "Today's class: AM",
        "batchTime": "AM",
        "priority": "LOW"
      }
    ]
  }
}
```

---

## Profile & ID Card

### Get Student Profile
**Method:** `GET`  
**URL:** `/api/student/profile`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "DHK001-2024-001",
    "studentName": "John Doe",
    "guardianName": "Jane Doe",
    "motherName": "Mary Doe",
    "dateOfBirth": "2000-01-15T00:00:00.000Z",
    "gender": "Male",
    "religion": "Hindu",
    "category": "General",
    "mobileNumber": "9876543210",
    "whatsappNumber": "9876543210",
    "guardianMobile": "9876543211",
    "email": "john@example.com",
    "address": "123 Main St, City",
    "pincode": "123456",
    "lastQualification": "HS",
    "course": {
      "id": "507f1f77bcf86cd799439011",
      "name": "DCA",
      "type": "Certificate",
      "duration": "6 months"
    },
    "batch": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Morning Batch",
      "timeSlot": "AM",
      "teacherName": "Mr. Teacher"
    },
    "admissionDate": "2024-01-15T00:00:00.000Z",
    "officeEntryDate": "2024-01-15T00:00:00.000Z",
    "idCard": {
      "qrCode": "data:image/png;base64,iVBORw0KG...",
      "studentPhoto": "/uploads/students/photo.jpg",
      "idCardUrl": "/uploads/students/id-card.jpg"
    },
    "status": "ACTIVE"
  }
}
```

### Get ID Card
**Method:** `GET`  
**URL:** `/api/student/profile/id-card`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "DHK001-2024-001",
    "studentName": "John Doe",
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "studentPhoto": "/uploads/students/photo.jpg",
    "idCardUrl": "/uploads/students/id-card.jpg",
    "note": "ID card can be downloaded or printed using the provided data"
  }
}
```

---

## Attendance

### Get Attendance (View Only)
**Method:** `GET`  
**URL:** `/api/student/attendance`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Example:** `/api/student/attendance?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=30`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "attendances": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "date": "2024-01-20T09:00:00.000Z",
        "status": "Present",
        "timeSlot": "AM",
        "method": "QR",
        "batchId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Morning Batch",
          "timeSlot": "AM"
        }
      }
    ],
    "statistics": {
      "total": 100,
      "present": 85,
      "absent": 10,
      "late": 5,
      "attendancePercentage": 85,
      "examEligible": true,
      "examEligibilityThreshold": 75
    },
    "pagination": {
      "page": 1,
      "limit": 30,
      "total": 100,
      "pages": 4
    }
  }
}
```

**Note:** Attendance is read-only. Students cannot edit their attendance records.

---

## Fees

### Get Fees Status
**Method:** `GET`  
**URL:** `/api/student/fees`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "DHK001-2024-001",
    "studentName": "John Doe",
    "fees": {
      "totalFees": 6000,
      "paidAmount": 3000,
      "dueAmount": 3000,
      "monthlyFees": 1000
    },
    "nextDue": {
      "date": "2024-02-15T00:00:00.000Z",
      "amount": 1000
    },
    "registrationDate": "2024-01-15T00:00:00.000Z",
    "recentPayments": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "amount": 1000,
        "paymentMode": "UPI",
        "receiptNumber": "DHK001-202401-0001",
        "month": "January",
        "year": 2024,
        "createdAt": "2024-01-20T10:00:00.000Z"
      }
    ]
  }
}
```

---

## Payments

### Create Online Payment
**Method:** `POST`  
**URL:** `/api/student/payments`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "amount": 1000,
  "paymentMode": "UPI",
  "transactionId": "TXN123456789",
  "description": "Monthly fee for January",
  "month": "January",
  "year": 2024
}
```

**Required Fields:**
- `amount` - Payment amount (number)
- `paymentMode` - UPI / ONLINE / QR / GATEWAY (online modes only)
- `transactionId` - Transaction ID from payment gateway

**Optional Fields:**
- `description` - Payment description
- `month` - Month name (default: current month)
- `year` - Year (default: current year)

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
    "paymentMode": "UPI",
    "discount": 0,
    "receiptNumber": "DHK001-202401-0001",
    "month": "January",
    "year": 2024,
    "transactionId": "TXN123456789",
    "receiptPdfUrl": "",
    "note": "Receipt will be generated automatically"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Only online payment modes are allowed: UPI, ONLINE, QR, GATEWAY"
}
```

**Note:** Students can only make online payments. Cash/offline payments are not allowed.

### Get Payment History
**Method:** `GET`  
**URL:** `/api/student/payments`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
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
        "amount": 1000,
        "paymentMode": "UPI",
        "receiptNumber": "DHK001-202401-0001",
        "month": "January",
        "year": 2024,
        "transactionId": "TXN123456789",
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

### Download Receipt
**Method:** `GET`  
**URL:** `/api/student/payments/:id/receipt`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Receipt download (placeholder)",
  "data": {
    "receiptNumber": "DHK001-202401-0001",
    "amount": 1000,
    "paymentMode": "UPI",
    "date": "2024-01-20T10:00:00.000Z",
    "receiptPdfUrl": "",
    "note": "PDF generation will be implemented"
  }
}
```

---

## Alerts

### Get Alerts
**Method:** `GET`  
**URL:** `/api/student/alerts`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "type": "DUE_FEES_WARNING",
        "message": "You have ₹1000 due. Please pay to avoid service interruption.",
        "amount": 1000,
        "priority": "HIGH",
        "actionRequired": true
      },
      {
        "type": "LATE_PAYMENT_NOTICE",
        "message": "Payment for January is overdue by 10 days.",
        "daysOverdue": 10,
        "priority": "HIGH",
        "actionRequired": true
      },
      {
        "type": "EXAM_BLOCKED",
        "message": "Exams are blocked due to pending fees. Please clear dues to appear in exams.",
        "priority": "URGENT",
        "actionRequired": true
      },
      {
        "type": "CLASS_REMINDER",
        "message": "Regular attendance is required for course completion.",
        "priority": "LOW",
        "actionRequired": false
      }
    ],
    "totalAlerts": 4,
    "urgentAlerts": 1,
    "highPriorityAlerts": 2
  }
}
```

---

## Course & Batch

### Get Course & Batch Details
**Method:** `GET`  
**URL:** `/api/student/course`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "507f1f77bcf86cd799439011",
      "name": "DCA",
      "type": "Certificate",
      "duration": "6 months",
      "fees": 6000,
      "description": "Diploma in Computer Applications"
    },
    "batch": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Morning Batch",
      "timeSlot": "AM",
      "isActive": true,
      "teacherName": "Mr. Teacher"
    },
    "note": "Course and batch details are read-only. Contact administrator for changes."
  }
}
```

---

## Classes

### Get Live Classes
**Method:** `GET`  
**URL:** `/api/student/classes/live`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Live classes (placeholder)",
  "data": {
    "liveClasses": [],
    "note": "Live class integration will be implemented. Students can access live classes for their assigned batch.",
    "batchId": "507f1f77bcf86cd799439012",
    "courseId": "507f1f77bcf86cd799439011"
  }
}
```

**Note:** Live class integration is placeholder-ready.

### Get Recorded Classes
**Method:** `GET`  
**URL:** `/api/student/classes/recorded`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "title": "Introduction to Programming",
        "description": "Basic programming concepts",
        "videoUrl": "https://example.com/video.mp4",
        "thumbnailUrl": "https://example.com/thumbnail.jpg",
        "duration": 3600,
        "expiryDate": "2024-12-31T23:59:59.000Z",
        "course": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "DCA"
        },
        "batch": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Morning Batch",
          "timeSlot": "AM"
        },
        "createdAt": "2024-01-15T10:00:00.000Z",
        "note": "Download is disabled. Video is for streaming only."
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

**Note:** Students can only access classes for their assigned batch. Download is disabled - videos are for streaming only.

---

## Exams

### Get Exams
**Method:** `GET`  
**URL:** `/api/student/exams`  
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
        "examName": "Monthly Test",
        "examType": "Monthly",
        "examDate": "2024-01-25T10:00:00.000Z",
        "maxMarks": 100,
        "passingMarks": 40,
        "course": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "DCA"
        },
        "batch": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Morning Batch",
          "timeSlot": "AM"
        },
        "result": null,
        "isUpcoming": true,
        "canAppear": true
      },
      {
        "_id": "507f1f77bcf86cd799439019",
        "examName": "Mid Term",
        "examType": "6M",
        "examDate": "2024-01-10T10:00:00.000Z",
        "result": {
          "marksObtained": 75,
          "maxMarks": 100,
          "percentage": 75,
          "status": "PASS",
          "remarks": "Good performance"
        },
        "isUpcoming": false,
        "canAppear": false
      }
    ],
    "summary": {
      "total": 5,
      "upcoming": 2,
      "past": 3,
      "withResults": 3
    }
  }
}
```

---

## Results

### Get Results
**Method:** `GET`  
**URL:** `/api/student/results`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `examId` (optional) - Filter by exam ID
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "examId": {
          "_id": "507f1f77bcf86cd799439019",
          "examName": "Mid Term",
          "examType": "6M",
          "examDate": "2024-01-10T10:00:00.000Z"
        },
        "marksObtained": 75,
        "maxMarks": 100,
        "percentage": 75,
        "status": "PASS",
        "remarks": "Good performance"
      }
    ],
    "summary": {
      "total": 5,
      "pass": 4,
      "fail": 1,
      "overallPercentage": 78,
      "totalMarks": 390,
      "totalMaxMarks": 500
    },
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

## Certificates

### Get Certificates
**Method:** `GET`  
**URL:** `/api/student/certificates`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "certificates": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "certificateId": "CERT-2024-000001",
        "issueDate": "2024-01-20T00:00:00.000Z",
        "verified": true,
        "qrCode": "data:image/png;base64,iVBORw0KG...",
        "certificatePdfUrl": "/uploads/certificates/cert-123.pdf",
        "course": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "DCA",
          "courseCategory": "Certificate"
        }
      }
    ],
    "eligibilityChecks": [
      {
        "courseId": "507f1f77bcf86cd799439011",
        "attendancePercentage": 85,
        "requiredAttendance": 75,
        "attendanceEligible": true,
        "allExamsPassed": true,
        "eligible": true
      }
    ],
    "note": "Certificates are issued only after meeting attendance and exam requirements."
  }
}
```

### Download Certificate
**Method:** `GET`  
**URL:** `/api/student/certificates/:id/download`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "certificateId": "CERT-2024-000001",
    "courseName": "DCA",
    "issueDate": "2024-01-20T00:00:00.000Z",
    "certificatePdfUrl": "/uploads/certificates/cert-123.pdf",
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "verificationLink": "/api/certificates/verify/CERT-2024-000001",
    "note": "Certificate PDF can be downloaded using the provided URL"
  }
}
```

---

## Notices

### Get Notices & Announcements
**Method:** `GET`  
**URL:** `/api/student/notices`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
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
        "title": "Monthly Exam Schedule",
        "content": "Monthly exam will be conducted on 25th January 2024.",
        "noticeType": "EXAM",
        "priority": "HIGH",
        "startDate": "2024-01-15T00:00:00.000Z",
        "endDate": "2024-01-30T00:00:00.000Z",
        "createdAt": "2024-01-15T10:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439023",
        "title": "Holiday Notice",
        "content": "Institute will be closed on 26th January for Republic Day.",
        "noticeType": "HOLIDAY",
        "priority": "MEDIUM",
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

## Absence History

### Get Absence History (View Only)
**Method:** `GET`  
**URL:** `/api/student/absence-history`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "absences": [
      {
        "date": "2024-01-20T00:00:00.000Z",
        "batch": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Morning Batch",
          "timeSlot": "AM"
        },
        "followUp": {
          "callStatus": "Connected",
          "reason": "Sick",
          "reasonDetails": "Fever and cold",
          "expectedReturnDate": "2024-01-22T00:00:00.000Z",
          "remarks": "Student will return after recovery",
          "followUpStatus": "Pending"
        }
      }
    ],
    "summary": {
      "totalAbsentDays": 5,
      "withFollowUp": 3,
      "withoutFollowUp": 2
    },
    "pagination": {
      "page": 1,
      "limit": 30,
      "total": 5,
      "pages": 1
    },
    "note": "Absence history is read-only. Contact staff for any queries."
  }
}
```

**Note:** Absence history is read-only. Students can view their absent dates and follow-up information recorded by staff.

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: amount, paymentMode, transactionId"
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
  "message": "Access denied. Student role required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Student not found"
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

1. **Student Isolation:** All queries are automatically scoped to the authenticated student's own data. Students cannot access other students' information.

2. **Read-Only Access:** Most endpoints are read-only. Students can only:
   - View their own data (attendance, fees, results, etc.)
   - Make online payments
   - Download receipts and certificates

3. **Online Payment Only:** Students can only make payments using online modes (UPI, ONLINE, QR, GATEWAY). Cash/offline payments are not supported.

4. **Exam Eligibility:** Students need minimum 75% attendance to be eligible for exams. This is automatically calculated and shown in attendance statistics.

5. **Certificate Eligibility:** Certificates are issued only after:
   - Minimum 75% attendance
   - All required exams passed

6. **Class Access:** Students can only access recorded classes for their assigned batch. Download is disabled - videos are for streaming only.

7. **Token Expiry:** JWT tokens expire after 30 days (configurable). Students need to login again after token expiry.

---

## Integration Notes

- All endpoints use the same MongoDB database as Admin, Staff, and SuperAdmin panels
- JWT tokens are shared across panels (same secret)
- Student isolation is enforced at middleware level
- Audit logs are created for all student actions (especially payments)
- All file URLs (photos, certificates, receipts) are accessible via `/uploads` endpoint

---

## Security Features

- ✅ JWT authentication
- ✅ Student-level data isolation
- ✅ Role-based access control (STUDENT only)
- ✅ Password hashing (bcrypt)
- ✅ Input validation
- ✅ Read-only enforcement for most endpoints
- ✅ Online payment verification
