# Admin Panel API Documentation

**Base URL:** `/api/admin`  
**Authentication:** All protected endpoints require JWT token in Authorization header  
**Branch Isolation:** All endpoints automatically filter data by admin's branch. Admins can only access, create, update, or delete resources (students, teachers, staff, batches, etc.) that belong to their own branch. Cross-branch access is strictly prohibited.

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
  "branch": {
    "_id": "<BRANCH_ID>",
    "name": "Dhaka Main",
    "code": "DHK001",
    "addresses": [
      {
        "areaname": "Salt Lake Sector 2",
        "city": "Kolkata",
        "pincode": "700091",
        "location": {
          "latitude": 22.5867,
          "longitude": 88.4173
        }
      }
    ],
    "contactNumber": "01234567890",
    "status": "ACTIVE"
  },
  "user": {
    "id": "<USER_ID>",
    "name": "Admin Name",
    "email": "admin@branch.com"
  }
}
```

**Response Fields:**
- `jwt_token` - JWT authentication token (use in Authorization header for protected endpoints)
- `role` - User role: `ADMIN`
- `branchId` - Branch unique identifier (string)
- `branch` - Complete branch details object:
  - `_id` - Branch unique identifier
  - `name` - Branch name
  - `code` - Branch code (unique identifier)
  - `addresses` - Array of branch addresses, each containing:
    - `areaname` - Area/locality name
    - `city` - City name
    - `pincode` - Postal/ZIP code
    - `location` - GPS coordinates:
      - `latitude` - Latitude coordinate
      - `longitude` - Longitude coordinate
  - `contactNumber` - Branch contact phone number
  - `status` - Branch status: `ACTIVE` | `LOCKED`
- `user` - Admin user information:
  - `id` - User unique identifier
  - `name` - Admin full name
  - `email` - Admin email address

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

### Get Comprehensive Dashboard Data
**Method:** `GET`  
**URL:** `/api/admin/dashboard`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Description:** Returns comprehensive dashboard data including statistics, charts data, recent activities, and performance metrics. All data is filtered by the authenticated admin's branch.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalStudents": 150,
      "activeStudents": 145,
      "pendingStudents": 3,
      "droppedStudents": 2,
      "totalStaff": 10,
      "activeStaff": 9,
      "totalTeachers": 8,
      "activeTeachers": 7,
      "totalBatches": 12,
      "activeBatches": 11,
      "totalCourses": 15,
      "totalExams": 25,
      "totalResults": 200,
      "totalInquiries": 50,
      "newInquiries": 5,
      "totalCertificates": 30,
      "totalRecordedClasses": 45
    },
    "today": {
      "studentAttendance": {
        "percentage": 85,
        "present": 120,
        "total": 141
      },
      "staffAttendance": {
        "percentage": 100,
        "present": 9,
        "total": 9
      },
      "feeCollection": 15000,
      "newStudents": 2,
      "newInquiries": 1
    },
    "currentMonth": {
      "feeCollection": 500000,
      "paymentCount": 120,
      "totalDueFees": 250000
    },
    "charts": {
      "attendance": [
        {
          "date": "Mon, Jan 15",
          "studentAttendance": 85,
          "staffAttendance": 100,
          "studentPresent": 120,
          "studentTotal": 141,
          "staffPresent": 9,
          "staffTotal": 9
        },
        {
          "date": "Tue, Jan 16",
          "studentAttendance": 88,
          "staffAttendance": 100,
          "studentPresent": 125,
          "studentTotal": 142,
          "staffPresent": 9,
          "staffTotal": 9
        }
      ],
      "feeCollection": [
        {
          "month": "Aug 2024",
          "amount": 450000,
          "count": 110
        },
        {
          "month": "Sep 2024",
          "amount": 480000,
          "count": 115
        },
        {
          "month": "Oct 2024",
          "amount": 500000,
          "count": 120
        }
      ],
      "studentStatus": [
        {
          "status": "ACTIVE",
          "count": 145
        },
        {
          "status": "PENDING",
          "count": 3
        },
        {
          "status": "DROPPED",
          "count": 2
        }
      ],
      "courseEnrollment": [
        {
          "courseName": "DCA",
          "count": 45
        },
        {
          "courseName": "Web Development",
          "count": 30
        },
        {
          "courseName": "Python Programming",
          "count": 25
        }
      ],
      "batchUtilization": [
        {
          "batchName": "Morning Batch",
          "current": 25,
          "max": 30,
          "utilization": 83
        },
        {
          "batchName": "Evening Batch",
          "current": 20,
          "max": 30,
          "utilization": 67
        }
      ],
      "paymentMode": [
        {
          "mode": "CASH",
          "count": 80,
          "total": 300000
        },
        {
          "mode": "UPI",
          "count": 30,
          "total": 150000
        },
        {
          "mode": "ONLINE",
          "count": 10,
          "total": 50000
        }
      ]
    },
    "recentActivities": {
      "students": [
        {
          "_id": "<STUDENT_ID>",
          "studentId": "DHK001-2024-001",
          "studentName": "John Doe",
          "status": "ACTIVE",
          "createdAt": "2024-01-15T10:00:00.000Z"
        }
      ],
      "payments": [
        {
          "_id": "<PAYMENT_ID>",
          "studentId": {
            "_id": "<STUDENT_ID>",
            "studentId": "DHK001-2024-001",
            "studentName": "John Doe"
          },
          "amount": 2000,
          "paymentMode": "CASH",
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    },
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
      },
      {
        "type": "NEW_INQUIRIES",
        "message": "5 new inquiry/inquiries",
        "count": 5
      }
    ],
    "performance": {
      "avgBatchUtilization": 75,
      "overallBatchUtilization": 78,
      "totalBatchCapacity": 360,
      "totalBatchCurrent": 280
    }
  }
}
```

**Response Fields:**

**Overview Statistics:**
- `totalStudents` - Total number of students (all statuses)
- `activeStudents` - Number of active students
- `pendingStudents` - Number of pending students
- `droppedStudents` - Number of dropped students
- `totalStaff` - Total number of staff members
- `activeStaff` - Number of active staff members
- `totalTeachers` - Total number of teachers
- `activeTeachers` - Number of active teachers
- `totalBatches` - Total number of batches
- `activeBatches` - Number of active batches
- `totalCourses` - Total number of approved courses
- `totalExams` - Total number of exams
- `totalResults` - Total number of results
- `totalInquiries` - Total number of inquiries
- `newInquiries` - Number of new inquiries
- `totalCertificates` - Total number of certificates
- `totalRecordedClasses` - Total number of active recorded classes

**Today's Statistics:**
- `studentAttendance` - Today's student attendance data (percentage, present count, total count)
- `staffAttendance` - Today's staff attendance data (percentage, present count, total count)
- `feeCollection` - Today's fee collection amount
- `newStudents` - Number of students registered today
- `newInquiries` - Number of inquiries created today

**Current Month Statistics:**
- `feeCollection` - Total fee collection for current month
- `paymentCount` - Number of payments in current month
- `totalDueFees` - Total due fees across all active students

**Charts Data:**
- `attendance` - Last 7 days attendance data for students and staff (for line/bar charts)
- `feeCollection` - Last 6 months fee collection data (for line/bar charts)
- `studentStatus` - Student status distribution (for pie/donut charts)
- `courseEnrollment` - Top 10 courses by enrollment (for bar charts)
- `batchUtilization` - Top 10 batches by utilization percentage (for bar charts)
- `paymentMode` - Payment mode breakdown for current month (for pie/donut charts)

**Recent Activities:**
- `students` - Last 5 registered students
- `payments` - Last 5 payments

**Alerts:**
- Array of alert objects with type, message, and count

**Performance Metrics:**
- `avgBatchUtilization` - Average batch utilization percentage
- `overallBatchUtilization` - Overall batch utilization percentage
- `totalBatchCapacity` - Total capacity across all active batches
- `totalBatchCurrent` - Current student count across all active batches

**Error Responses:**
- `500` - Server error while fetching dashboard data

**Notes:**
- All data is automatically filtered by the authenticated admin's branch
- Chart data is optimized for common charting libraries (Chart.js, Recharts, etc.)
- Attendance chart shows last 7 days
- Fee collection chart shows last 6 months
- All dates are in ISO format
- Branch isolation is strictly enforced

---

### Get Dashboard Summary (Legacy)
**Method:** `GET`  
**URL:** `/api/admin/dashboard/summary`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Description:** Returns a simplified dashboard summary. For comprehensive dashboard data with charts, use `/api/admin/dashboard`.

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
- `Content-Type: multipart/form-data` (required for file uploads)

**Description:** Creates a new student with manual data entry. Supports file uploads for student photo, signatures, and form scan. All files are uploaded to AWS S3.

**Body (multipart/form-data):**

**Required Text Fields:**
- `admission` (JSON string) - Admission details
- `student` (JSON string) - Student personal information
- `contact_details` (JSON string) - Contact information (mobile is required)

**Optional Text Fields:**
- `family_details` (JSON string) - Family information
- `address` (JSON string) - Address information
- `education` (JSON string) - Education details
- `office_use` (JSON string) - Office use information
- `studentId` (text) - Student ID (use "AUTO" for auto-generation)
- `branchId` (text) - Branch ID (use "AUTO" to use admin's branch)
- `status` (text) - Student status: "ACTIVE", "PENDING", "INACTIVE", "DROPPED" (default: "ACTIVE")
- `batchId` (text) - Batch ID (optional, can use batch_time instead)
- `courseId` (text) - Course ID (optional, can use course.code instead)

**File Upload Fields (all optional):**
- `studentPhoto` (file) - Student photo/image (jpg/png/webp) - **Uploaded to AWS S3**
- `studentSignature` (file) - Student signature (jpg/png/webp/pdf) - **Uploaded to AWS S3**
- `officeSignature` (file) - Office signature (jpg/png/webp/pdf) - **Uploaded to AWS S3**
- `formScanImage` (file) - Scanned form image (jpg/png/webp/pdf) - **Uploaded to AWS S3**

**Example (multipart/form-data):**
```
admission: {"admission_date":"2026-01-13","course":{"code":"DCA","type":"Certificate"}}
student: {"name":"Moumita Nandi","date_of_birth":"1998-12-09","gender":"Female","religion":"Hindu","caste":"General"}
family_details: {"guardian_name":"Biswanath Nandi","mother_name":"Gita Nandi"}
contact_details: {"mobile":"7431995431","whatsapp":"7431995431","guardian_contact":"7431995431","email":"ads@gmail.com"}
address: {"village":"Thakurpara","post_office":"Kalna","district":"Purba Bardhaman","state":"West Bengal","pincode":"713409","country":"India"}
education: {"last_qualification":"HS"}
office_use: {"form_number":"FORM-00123","receipt_number":"RCPT-4567","batch_time":"AM","date":"2026-01-13"}
studentId: AUTO
branchId: AUTO
status: ACTIVE
studentPhoto: <file>
studentSignature: <file>
officeSignature: <file>
formScanImage: <file>
```

**Note:** When using form-data, nested objects (like `admission`, `student`, etc.) must be sent as JSON strings. The API will parse them automatically.

**File Storage:**
- All student files are automatically uploaded to AWS S3 bucket
- Files are stored in `students/{fieldname}/` folders in S3 (e.g., `students/studentPhoto/`, `students/studentSignature/`)
- Files are publicly accessible via S3 URLs
- Response includes S3 URLs in respective fields

**S3 URL Format:**
```
https://{bucket-name}.s3.{region}.amazonaws.com/students/{fieldname}/{filename}
```

**Field Descriptions:**

**Admission Object (`admission` as JSON string):**
- `admission_date`: Date of admission (YYYY-MM-DD format)
- `course.code`: Course code/name (e.g., "DCA")
- `course.type`: Course type (e.g., "Certificate", "Diploma")

**Student Object (`student` as JSON string):**
- `name`: Full name of the student (required)
- `date_of_birth`: Date of birth (YYYY-MM-DD format)
- `gender`: Gender (Male/Female/Other)
- `religion`: Religion
- `caste`: Caste/Category

**Family Details Object (`family_details` as JSON string):**
- `guardian_name`: Name of guardian
- `mother_name`: Name of mother

**Contact Details Object (`contact_details` as JSON string):**
- `mobile`: Mobile number (required)
- `whatsapp`: WhatsApp number
- `guardian_contact`: Guardian's contact number
- `email`: Email address

**Address Object (`address` as JSON string):**
- `village`: Village name
- `post_office`: Post office name
- `district`: District name
- `state`: State name
- `pincode`: PIN code
- `country`: Country name

**Education Object (`education` as JSON string):**
- `last_qualification`: Last educational qualification

**Office Use Object (`office_use` as JSON string):**
- `form_number`: Form number
- `receipt_number`: Receipt number
- `batch_time`: Batch time (AM/PM/EVENING)
- `date`: Office entry date (YYYY-MM-DD format)

**Nested Object Structure:**
The API uses a nested object structure organized into logical groups:
- `admission` - Admission details (date, course)
- `student` - Student personal information
- `family_details` - Family/guardian information
- `contact_details` - Contact information
- `address` - Address information
- `education` - Education details
- `office_use` - Office use information

**Important:** When using `multipart/form-data`, nested objects must be sent as JSON strings. For example:
- `admission` should be: `{"admission_date":"2026-01-13","course":{"code":"DCA","type":"Certificate"}}`
- `student` should be: `{"name":"Moumita Nandi","date_of_birth":"1998-12-09",...}`

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
      "password": "DHK240011234",
      "loginCredentials": {
        "email": "dhk001-2024-001@dhk001.edu",
        "password": "DHK240011234"
      }
    }
  }
```

**Password Generation:**
- Password is automatically generated based on the student ID
- Each student gets a unique password that is different from all other students
- Password format: Based on student ID parts (branch code + year + sequence + hash)
- Example: For student ID "YUVA-0002-2026-001", password might be "YUV260011234"
- Example: For student ID "DHK001-2024-001", password might be "DHK240011234"
- The system ensures no two students have the same password

**Error Responses:**
- `400` - Missing required fields (student.name, contact_details.mobile)
- `400` - Invalid JSON format for nested objects
- `400` - Invalid image file type (only jpg, jpeg, png, webp, pdf allowed for signatures)
- `400` - File too large (maximum size: 50MB)
- `404` - Branch/Course/Batch not found
- `409` - Student ID already exists (if custom ID provided)
- `413` - Request entity too large (maximum: 50MB total)

**Notes:**
- **File Uploads:** All file fields are optional. If provided, files are uploaded to AWS S3 and URLs are stored in the student record
- **Nested Objects:** When using form-data, nested objects must be JSON strings. The API automatically parses them
- **Student ID:** Use "AUTO" to auto-generate student ID, or provide a custom ID (must be unique)
- **Branch ID:** Use "AUTO" to automatically use the authenticated admin's branch
- **Batch Assignment:** Can provide `batchId` directly, or use `office_use.batch_time` (AM/PM/EVENING) to find matching batch
- **Course Assignment:** Can provide `courseId` directly, or use `admission.course.code` to find matching course
- **Branch Isolation:** Students are automatically assigned to the authenticated admin's branch

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

**Description:** Retrieves all students from the authenticated admin's branch. Branch isolation is strictly enforced - admins can only see students from their own branch.

**Branch Isolation:**
- Only returns students from the authenticated admin's branch
- Admins from different branches cannot see each other's students
- The `branchId` is automatically set from the admin's JWT token
- Cross-branch access is prevented

**Query Parameters:**
- `status` (optional) - Filter by status: PENDING, ACTIVE, INACTIVE, DROPPED
- `batchId` (optional) - Filter by batch (must belong to admin's branch)
- `courseId` (optional) - Filter by course

**Example:** `/api/admin/students?status=ACTIVE&batchId=<BATCH_ID>`

**Note:** All query parameters are filtered within the admin's branch scope. For example, if you filter by `batchId`, the system will only return students from that batch if it belongs to your branch.

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
      "password": "STU001",
      "loginCredentials": {
        "email": "dhk001-2024-001@dhk001.edu",
        "password": "STU001"
      },
      "branchId": "<BRANCH_ID>",
      ...
    }
  ]
}
```

**Response Fields:**
- All student fields are returned
- `password` - Student login password (for Admin visibility)
- `loginCredentials` - Login credentials object containing email and password
- Only students from the authenticated admin's branch are included

**Response Fields:**
- All student fields are returned
- Only students from the authenticated admin's branch are included
- Students from other branches are automatically excluded

**Error Responses:**
- `500` - Server error while fetching students

**Notes:**
- **Branch Isolation:** This endpoint automatically filters students by the authenticated admin's branch. Admins can only see students from their own branch.
- All query parameters (status, batchId, courseId) are applied within the branch scope
- If you filter by `batchId` or `courseId`, the system ensures they belong to your branch before returning results
- Students from other branches are never returned, even if you somehow know their IDs

---

### Get Student by ID
**Method:** `GET`  
**URL:** `/api/admin/students/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Description:** Retrieves a specific student by ID. Branch isolation is strictly enforced - admins can only access students from their own branch.

**Branch Isolation:**
- Only returns student if it belongs to the authenticated admin's branch
- Returns 404 if student belongs to a different branch
- The `branchId` is automatically checked from the admin's JWT token

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
    "password": "STU001",
    "loginCredentials": {
      "email": "dhk001-2024-001@dhk001.edu",
      "password": "STU001"
    },
    "qrCode": "data:image/png;base64,...",
    "registrationDate": "2024-01-15T00:00:00.000Z",
    ...
  }
}
```

**Response Fields:**
- All student fields are returned
- `password` - Student login password (for Admin visibility)
- `loginCredentials` - Login credentials object containing email and password
- Only students from the authenticated admin's branch are returned

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
  "date": "2024-01-15",
  "timeSlot": "9:00 AM - 11:00 AM",
  "method": "QR",
  "qrData": "{\"studentId\":\"DHK001-2024-001\",\"branchId\":\"<BRANCH_ID>\"}",
  "inTime": "2024-01-15T09:00:00.000Z",
  "outTime": "2024-01-15T11:00:00.000Z"
}
```

**Required Fields:**
- `studentId` - Student ID
- `date` - Attendance date (YYYY-MM-DD format or ISO date string)

**Optional Fields:**
- `timeSlot` - Time slot (e.g., "9:00 AM - 11:00 AM")
- `method` - Attendance method: `QR`, `FACE`, `MANUAL` (default: `MANUAL`)
- `qrData` - QR code data (required if method is QR)
- `inTime` - Student in-time (ISO date string). If not provided, uses current time
- `outTime` - Student out-time (ISO date string). Optional, can be set later

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
    "timeSlot": "9:00 AM - 11:00 AM",
    "inTime": "2024-01-15T09:00:00.000Z",
    "outTime": "2024-01-15T11:00:00.000Z",
    "status": "Present",
    "method": "QR",
    "markedBy": "<USER_ID>",
    "createdAt": "2024-01-15T09:05:00.000Z",
    "updatedAt": "2024-01-15T09:05:00.000Z"
  }
}
```

**Note:** 
- `date` is saved and required - it represents the attendance date
- `inTime` is automatically set to current time if not provided
- `outTime` is optional and can be set later when student leaves
- Date is normalized to start of day (00:00:00) for consistency

**Error Responses:**
- `400` - Missing required fields
- `404` - Student not found
- `409` - Attendance already marked for this date

---

### Mark Student In-Time
**Method:** `POST`  
**URL:** `/api/admin/attendance/student/in-time`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "studentId": "<STUDENT_ID>",
  "date": "2024-01-15",
  "timeSlot": "9:00 AM - 11:00 AM",
  "method": "QR",
  "qrData": "{\"studentId\":\"DHK001-2024-001\",\"branchId\":\"<BRANCH_ID>\"}",
  "inTime": "2024-01-15T09:00:00.000Z"
}
```

**Required Fields:**
- `studentId` - Student ID
- `date` - Attendance date (YYYY-MM-DD format or ISO date string)

**Optional Fields:**
- `timeSlot` - Time slot (e.g., "9:00 AM - 11:00 AM")
- `method` - Attendance method: `QR`, `FACE`, `MANUAL` (default: `MANUAL`)
- `qrData` - QR code data (required if method is QR)
- `inTime` - Student in-time (ISO date string). If not provided, uses current time

**Success Response (201):**
```json
{
  "success": true,
  "message": "Student in-time marked successfully",
  "data": {
    "_id": "<ATTENDANCE_ID>",
    "studentId": "<STUDENT_ID>",
    "batchId": "<BATCH_ID>",
    "date": "2024-01-15T00:00:00.000Z",
    "timeSlot": "9:00 AM - 11:00 AM",
    "inTime": "2024-01-15T09:00:00.000Z",
    "outTime": null,
    "status": "Present",
    "method": "QR",
    "markedBy": "<USER_ID>",
    "createdAt": "2024-01-15T09:05:00.000Z",
    "updatedAt": "2024-01-15T09:05:00.000Z"
  }
}
```

**Note:** 
- This API is specifically for marking only the in-time attendance
- If attendance already exists for the date, it will update the in-time
- `outTime` will be null until out-time is marked separately
- `inTime` is automatically set to current time if not provided

**Error Responses:**
- `400` - Missing required fields
- `404` - Student not found

---

### Mark Student Out-Time
**Method:** `POST`  
**URL:** `/api/admin/attendance/student/out-time`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "studentId": "<STUDENT_ID>",
  "date": "2024-01-15",
  "outTime": "2024-01-15T11:00:00.000Z",
  "method": "QR",
  "qrData": "{\"studentId\":\"DHK001-2024-001\",\"branchId\":\"<BRANCH_ID>\"}"
}
```

**Required Fields:**
- `studentId` - Student ID
- `date` - Attendance date (YYYY-MM-DD format or ISO date string)

**Optional Fields:**
- `outTime` - Student out-time (ISO date string). If not provided, uses current time
- `method` - Attendance method: `QR`, `FACE`, `MANUAL` (default: `MANUAL`)
- `qrData` - QR code data (required if method is QR)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Student out-time marked successfully",
  "data": {
    "_id": "<ATTENDANCE_ID>",
    "studentId": "<STUDENT_ID>",
    "batchId": "<BATCH_ID>",
    "date": "2024-01-15T00:00:00.000Z",
    "timeSlot": "9:00 AM - 11:00 AM",
    "inTime": "2024-01-15T09:00:00.000Z",
    "outTime": "2024-01-15T11:00:00.000Z",
    "status": "Present",
    "method": "QR",
    "markedBy": "<USER_ID>",
    "createdAt": "2024-01-15T09:05:00.000Z",
    "updatedAt": "2024-01-15T11:05:00.000Z"
  }
}
```

**Note:** 
- This API is specifically for marking only the out-time attendance
- Requires that in-time attendance already exists for the date
- If attendance doesn't exist, returns error
- `outTime` is automatically set to current time if not provided
- Can be called multiple times to update the out-time

**Error Responses:**
- `400` - Missing required fields, in-time not marked for this date
- `404` - Student not found or attendance record not found for the date

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
  "qrData": "{\"staffId\":\"DHK001-STF-001\",\"branchId\":\"<BRANCH_ID>\"}",
  "checkIn": "2024-01-15T09:00:00.000Z",
  "checkOut": "2024-01-15T17:00:00.000Z"
}
```

**Required Fields:**
- `staffId` - Staff ID
- `date` - Attendance date (YYYY-MM-DD format or ISO date string)

**Optional Fields:**
- `timeSlot` - Time slot (e.g., "9:00 AM - 5:00 PM")
- `method` - Attendance method: `QR`, `MANUAL` (default: `MANUAL`)
- `qrData` - QR code data (required if method is QR)
- `checkIn` - Staff check-in time (ISO date string). If not provided, uses current time
- `checkOut` - Staff check-out time (ISO date string). Optional, can be set later

**Success Response (201):**
```json
{
  "success": true,
  "message": "Staff attendance marked successfully",
  "data": {
    "_id": "<ATTENDANCE_ID>",
    "staffId": "<STAFF_ID>",
    "date": "2024-01-15T00:00:00.000Z",
    "timeSlot": "9:00 AM - 5:00 PM",
    "checkIn": "2024-01-15T09:00:00.000Z",
    "checkOut": "2024-01-15T17:00:00.000Z",
    "status": "Present",
    "method": "QR",
    "markedBy": "<USER_ID>",
    "createdAt": "2024-01-15T09:05:00.000Z",
    "updatedAt": "2024-01-15T09:05:00.000Z"
  }
}
```

**Method Options:**
- `QR` - QR code scanning
- `MANUAL` - Manual entry

**Note:** 
- `date` is saved and required - it represents the attendance date
- `checkIn` is automatically set to current time if not provided
- `checkOut` is optional and can be set later when staff leaves
- Calling this endpoint again on the same date will record check-out time if checkOut is not already set
- Date is normalized to start of day (00:00:00) for consistency

---

 
### Get Student Attendance
**Method:** `GET`  
**URL:** `/api/admin/attendance/student`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `studentId` (optional) - Filter by specific student ID. Returns attendance records for the specified student only
- `batchId` (optional) - Filter by batch ID. Returns attendance records for students in the specified batch
- `date` (optional) - Filter by specific date (YYYY-MM-DD format or ISO date string). Returns attendance records for the specified date only
- `startDate` (optional) - Start date for date range filter (YYYY-MM-DD format or ISO date string)
- `endDate` (optional) - End date for date range filter (YYYY-MM-DD format or ISO date string). Must be used with `startDate`
- `page` (optional) - Page number for pagination (default: 1)
- `limit` (optional) - Number of records per page (default: 50)

**Query Parameter Combinations:**
- Get all attendance: `/api/admin/attendance/student`
- Get attendance by student ID: `/api/admin/attendance/student?studentId=<STUDENT_ID>`
- Get attendance by specific date: `/api/admin/attendance/student?date=2024-01-15`
- Get attendance by date range: `/api/admin/attendance/student?startDate=2024-01-01&endDate=2024-01-31`
- Get attendance by student ID and date: `/api/admin/attendance/student?studentId=<STUDENT_ID>&date=2024-01-15`
- Get attendance by student ID and date range: `/api/admin/attendance/student?studentId=<STUDENT_ID>&startDate=2024-01-01&endDate=2024-01-31`
- Get attendance by batch and date: `/api/admin/attendance/student?batchId=<BATCH_ID>&date=2024-01-15`

**Example Requests:**
- Get all attendance for a specific student: `/api/admin/attendance/student?studentId=DHK001-2024-001`
- Get attendance for a specific date: `/api/admin/attendance/student?date=2024-01-15`
- Get attendance for a student on a specific date: `/api/admin/attendance/student?studentId=DHK001-2024-001&date=2024-01-15`
- Get attendance for a date range: `/api/admin/attendance/student?startDate=2024-01-01&endDate=2024-01-31`
- Get attendance for a student in a date range: `/api/admin/attendance/student?studentId=DHK001-2024-001&startDate=2024-01-01&endDate=2024-01-31`

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
      "timeSlot": "9:00 AM - 11:00 AM",
      "inTime": "2024-01-15T09:00:00.000Z",
      "outTime": "2024-01-15T11:00:00.000Z",
      "status": "Present",
      "method": "QR",
      "markedBy": "<USER_ID>",
      "createdAt": "2024-01-15T09:05:00.000Z",
      "updatedAt": "2024-01-15T09:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

**Response Fields:**
- `date` - Attendance date (saved and required)
- `inTime` - Student in-time (when student arrived). Can be null if only out-time is marked
- `outTime` - Student out-time (when student left). Can be null if only in-time is marked
- `timeSlot` - Batch time slot
- `status` - Attendance status: `Present`, `Absent`, `Late`
- `method` - How attendance was marked: `QR`, `FACE`, `MANUAL`
- `pagination` - Pagination information (if pagination is enabled)

**Note:**
- All query parameters are optional and can be combined
- When filtering by `date`, returns attendance records for that specific date only
- When filtering by `studentId`, returns all attendance records for that student (can be combined with date filters)
- When using `startDate` and `endDate`, both must be provided for date range filtering
- Results are sorted by date in descending order (most recent first)

---

### Get Staff Attendance
**Method:** `GET`  
**URL:** `/api/admin/attendance/staff`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Query Parameters:**
- `staffId` (optional) - Filter by specific staff ID. Returns attendance records for the specified staff only
- `date` (optional) - Filter by specific date (YYYY-MM-DD format or ISO date string). Returns attendance records for the specified date only
- `startDate` (optional) - Start date for date range filter (YYYY-MM-DD format or ISO date string)
- `endDate` (optional) - End date for date range filter (YYYY-MM-DD format or ISO date string). Must be used with `startDate`
- `page` (optional) - Page number for pagination (default: 1)
- `limit` (optional) - Number of records per page (default: 50)

**Query Parameter Combinations:**
- Get all attendance: `/api/admin/attendance/staff`
- Get attendance by staff ID: `/api/admin/attendance/staff?staffId=<STAFF_ID>`
- Get attendance by specific date: `/api/admin/attendance/staff?date=2024-01-15`
- Get attendance by date range: `/api/admin/attendance/staff?startDate=2024-01-01&endDate=2024-01-31`
- Get attendance by staff ID and date: `/api/admin/attendance/staff?staffId=<STAFF_ID>&date=2024-01-15`
- Get attendance by staff ID and date range: `/api/admin/attendance/staff?staffId=<STAFF_ID>&startDate=2024-01-01&endDate=2024-01-31`

**Example Requests:**
- Get all attendance for a specific staff: `/api/admin/attendance/staff?staffId=DHK001-STF-001`
- Get attendance for a specific date: `/api/admin/attendance/staff?date=2024-01-15`
- Get attendance for a staff on a specific date: `/api/admin/attendance/staff?staffId=DHK001-STF-001&date=2024-01-15`
- Get attendance for a date range: `/api/admin/attendance/staff?startDate=2024-01-01&endDate=2024-01-31`
- Get attendance for a staff in a date range: `/api/admin/attendance/staff?staffId=DHK001-STF-001&startDate=2024-01-01&endDate=2024-01-31`

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
      "timeSlot": "9:00 AM - 5:00 PM",
      "checkIn": "2024-01-15T09:00:00.000Z",
      "checkOut": "2024-01-15T17:00:00.000Z",
      "status": "Present",
      "method": "QR",
      "markedBy": "<USER_ID>",
      "createdAt": "2024-01-15T09:05:00.000Z",
      "updatedAt": "2024-01-15T17:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

**Response Fields:**
- `date` - Attendance date (saved and required)
- `checkIn` - Staff check-in time (when staff arrived). Can be null if only check-out is marked
- `checkOut` - Staff check-out time (when staff left). Can be null if only check-in is marked
- `timeSlot` - Time slot for the day
- `status` - Attendance status: `Present`, `Absent`, `Late`
- `method` - How attendance was marked: `QR`, `MANUAL`
- `pagination` - Pagination information (if pagination is enabled)

**Note:**
- All query parameters are optional and can be combined
- When filtering by `date`, returns attendance records for that specific date only
- When filtering by `staffId`, returns all attendance records for that staff (can be combined with date filters)
- When using `startDate` and `endDate`, both must be provided for date range filtering
- Results are sorted by date in descending order (most recent first)

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
    "timeSlot": "9:00 AM - 5:00 PM",
    "checkIn": "2024-01-15T09:00:00.000Z",
    "checkOut": "2024-01-15T17:00:00.000Z",
    "status": "Present",
    "method": "QR",
    "markedBy": {
      "_id": "<USER_ID>",
      "email": "admin@branch.com",
      "role": "ADMIN"
    },
    "createdAt": "2024-01-15T09:05:00.000Z",
    "updatedAt": "2024-01-15T17:30:00.000Z"
  }
}
```

**Response Fields:**
- `date` - Attendance date (saved and required)
- `checkIn` - Staff check-in time
- `checkOut` - Staff check-out time (can be null if not checked out)

---

### Update Staff Attendance
**Method:** `POST`  
**URL:** `/api/admin/attendance/staff/:id/update`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON, all fields optional):**
```json
{
  "status": "Late",
  "method": "MANUAL",
  "checkIn": "2024-01-15T09:30:00.000Z",
  "checkOut": "2024-01-15T18:00:00.000Z",
  "date": "2024-01-15"
}
```

**Optional Fields:**
- `status` - Attendance status: `Present`, `Absent`, `Late`
- `method` - Attendance method: `QR`, `MANUAL`
- `checkIn` - Check-in time (ISO date string)
- `checkOut` - Check-out time (ISO date string)
- `date` - Attendance date (YYYY-MM-DD format or ISO date string)

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
    "inTime": "2026-01-29T06:00:00.000Z",
    "outTime": "2026-01-29T08:00:00.000Z",
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

**Response Fields:**
- `date` - Attendance date (saved and required)
- `inTime` - Student in-time
- `outTime` - Student out-time (can be null)
- `timeSlot` - Batch time slot
- `status` - Attendance status
- `method` - Attendance method

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

**Body (raw JSON, all fields optional):**
```json
{
  "status": "Absent",
  "timeSlot": "6:00 AM - 8:00 AM",
  "method": "MANUAL",
  "inTime": "2026-01-29T06:00:00.000Z",
  "outTime": "2026-01-29T08:00:00.000Z",
  "date": "2026-01-29"
}
```

**Optional Fields:**
- `status` - Attendance status: `Present`, `Absent`, `Late`
- `timeSlot` - Time slot (e.g., "6:00 AM - 8:00 AM")
- `method` - Attendance method: `QR`, `FACE`, `MANUAL`
- `inTime` - Student in-time (ISO date string)
- `outTime` - Student out-time (ISO date string)
- `date` - Attendance date (YYYY-MM-DD format or ISO date string)

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
    "timeSlot": "6:00 AM - 8:00 AM",
    "inTime": "2026-01-29T06:00:00.000Z",
    "outTime": "2026-01-29T08:00:00.000Z",
    "status": "Absent",
    "method": "MANUAL",
    "updatedAt": "2026-01-29T10:35:00.000Z"
  }
}
```

**Response Fields:**
- `date` - Attendance date (saved and required)
- `inTime` - Student in-time (updated if provided)
- `outTime` - Student out-time (updated if provided)
- `timeSlot` - Time slot (updated if provided)
- `status` - Attendance status (updated if provided)
- `method` - Attendance method (updated if provided)

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

**Description:** Retrieves all courses sorted by creation date (newest first). Supports filtering by course category and active status. Returns both SuperAdmin-created courses (approved) and Admin-created courses (pending/approved/rejected).

**Query Parameters:**
- `courseCategory` (optional) - Filter by category: `Basic`, `Advanced`, `Diploma`
- `isActive` (optional) - Filter by active status: `true`, `false`

**Examples:**
- Get all courses: `GET /api/admin/courses`
- Get only Basic courses: `GET /api/admin/courses?courseCategory=Basic`
- Get only active courses: `GET /api/admin/courses?isActive=true`
- Get active Basic courses: `GET /api/admin/courses?courseCategory=Basic&isActive=true`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<COURSE_ID>",
      "name": "DCA",
      "description": "Diploma in Computer Applications - Complete computer course covering basics to advanced topics",
      "duration": "6 months",
      "courseCategory": "Basic",
      "courseFees": 3500,
      "admissionFees": 500,
      "monthlyFees": 1000,
      "imageUrl": "https://notes-market-bucket.s3.eu-north-1.amazonaws.com/courses/image-1234567890-123456789.jpg",
      "pdfUrl": "https://notes-market-bucket.s3.eu-north-1.amazonaws.com/courses/pdf-1234567890-123456789.pdf",
      "isActive": true,
      "createdBy": "SUPER_ADMIN",
      "approvalStatus": "APPROVED",
      "approvedBy": "<SUPER_ADMIN_ID>",
      "approvedAt": "2024-01-15T10:30:00.000Z",
      "rejectionReason": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "<COURSE_ID>",
      "name": "Web Development",
      "description": "Advanced web development course covering modern frameworks and technologies",
      "duration": "8 months",
      "courseCategory": "Advanced",
      "courseFees": 5000,
      "admissionFees": 1000,
      "monthlyFees": 1500,
      "imageUrl": "https://notes-market-bucket.s3.eu-north-1.amazonaws.com/courses/image-9876543210-987654321.jpg",
      "pdfUrl": "https://notes-market-bucket.s3.eu-north-1.amazonaws.com/courses/pdf-9876543210-987654321.pdf",
      "isActive": false,
      "createdBy": "ADMIN",
      "approvalStatus": "PENDING",
      "approvedBy": null,
      "approvedAt": null,
      "rejectionReason": null,
      "createdAt": "2024-01-20T12:00:00.000Z",
      "updatedAt": "2024-01-20T12:00:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `_id` - Course unique identifier
- `name` - Course name
- `description` - Course description
- `duration` - Course duration (e.g., "6 months", "8 months")
- `courseCategory` - Course category: `Basic` | `Advanced` | `Diploma`
- `courseFees` - Total course fees (number)
- `admissionFees` - Admission fees (number)
- `monthlyFees` - Monthly fees (number)
- `imageUrl` - Full S3 URL or local path to course image
- `pdfUrl` - Full S3 URL or local path to course PDF document
- `isActive` - Whether the course is active (boolean)
- `createdBy` - Creator role: `SUPER_ADMIN` | `ADMIN`
- `approvalStatus` - Approval status: `PENDING` | `APPROVED` | `REJECTED`
  - `PENDING` - Course created by Admin, waiting for SuperAdmin approval
  - `APPROVED` - Course approved by SuperAdmin (or created by SuperAdmin)
  - `REJECTED` - Course rejected by SuperAdmin
- `approvedBy` - ID of SuperAdmin who approved (ObjectId, null if pending/rejected)
- `approvedAt` - Approval timestamp (Date, null if pending/rejected)
- `rejectionReason` - Reason for rejection (string, null if approved/pending)
- `createdAt` - Course creation timestamp
- `updatedAt` - Last update timestamp

**Notes:**
- Courses are sorted by creation date (newest first)
- Admin-created courses have `approvalStatus: PENDING` and `isActive: false` until approved by SuperAdmin
- SuperAdmin-created courses have `approvalStatus: APPROVED` and `isActive: true` by default
- Only approved courses (`approvalStatus: APPROVED`) should be used for student registration
- Branch isolation is enforced - admins can see all courses (both SuperAdmin and Admin-created)

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
  "courseId": "<COURSE_ID>",
  "weekdays": ["Monday", "Wednesday", "Friday"],
  "isKidsBatch": false,
  "discountPercentage": 0,
  "batchType": "OFFLINE",
  "teacherId": "<TEACHER_ID>",
  "maxStudents": 30
}
```

**Note:** `teacherId` is optional and can be omitted. Teachers can be assigned to batches later using the "Assign Teacher to Batch" endpoint.

**Required Fields:**
- `name` - Batch name
- `timeSlot` - Time slot (e.g., "9:00 AM - 11:00 AM")
- `courseId` - Course ID
- `weekdays` - Array of weekdays (e.g., `["Monday", "Wednesday", "Friday"]`). Valid values: `Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`

**Optional Fields:**
- `monthlyFee` - Monthly fee for this batch (if not provided, uses course's `monthlyFees`)
- `isKidsBatch` - Whether this is a kids batch (default: false)
- `discountPercentage` - Discount percentage (default: 0, auto-set to 10% for kids batches)
- `batchType` - Batch type: `OFFLINE` | `ONLINE` | `HYBRID` (default: `OFFLINE`)
- `teacherId` - Teacher ID (optional - can be omitted and assigned later using "Assign Teacher to Batch" endpoint)
- `maxStudents` - Maximum number of students (default: 30)

**Batch Type Options:**
- `OFFLINE` - Classroom-based learning
- `ONLINE` - Online/virtual learning
- `HYBRID` - Mix of offline and online classes

**Weekdays:**
- `weekdays` is required - must be a non-empty array of valid weekday names
- Valid weekday values: `Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`
- Weekday names are case-insensitive (e.g., "monday", "Monday", "MONDAY" are all valid)
- Weekdays are automatically sorted in chronological order (Sunday to Saturday)
- **Duplicate Prevention:** A batch with the same `timeSlot` and `weekdays` cannot be created in the same branch. The system will return a 409 error if a duplicate is detected.

**Monthly Fee:**
- `monthlyFee` is optional - if not provided, the batch will use the course's `monthlyFees` from the associated course
- If `monthlyFee` is provided, it will override the course's monthly fees for this specific batch

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
      "courseCategory": "Basic",
      "monthlyFees": 1000
    },
    "teacherId": null,
    "maxStudents": 30,
    "currentStudents": 0,
    "isActive": true,
    "branchId": "<BRANCH_ID>",
    "createdAt": "2026-01-27T09:28:12.485Z",
    "updatedAt": "2026-01-27T09:28:12.485Z"
  }
}
```

**Note:** If `teacherId` is not provided, the response will show `"teacherId": null`. Teachers can be assigned later using the "Assign Teacher to Batch" endpoint.

**Notes:**
- `weekdays` is required - must be a non-empty array of valid weekday names (Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday)
- **Duplicate Prevention:** The system prevents creating batches with the same `timeSlot` and `weekdays` combination in the same branch. If a duplicate is detected, a 409 error is returned with details of the existing batch
- `monthlyFee` is optional - if not provided, the batch will automatically use the course's `monthlyFees`
- `teacherId` is optional - if not provided, the batch will be created without a teacher and `teacherId` will be `null`. Teachers can be assigned later using the "Assign Teacher to Batch" endpoint
- For kids batches, `discountPercentage` is locked (read-only) once set
- Batch is automatically assigned to the authenticated admin's branch
- If `teacherId` is provided, the teacher must belong to the same branch as the admin

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
      "weekdays": ["Monday", "Wednesday", "Friday"],
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
    "weekdays": ["Monday", "Wednesday", "Friday"],
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

**Body (raw JSON, all fields optional):**
```json
{
  "name": "Updated Batch Name",
  "timeSlot": "10:00 AM - 12:00 PM",
  "weekdays": ["Tuesday", "Thursday"],
  "monthlyFee": 1200,
  "teacherId": "<NEW_TEACHER_ID>",
  "maxStudents": 35,
  "isActive": true
}
```

**Note:** 
- `discountPercentage` cannot be changed for kids batches
- When updating `timeSlot` or `weekdays`, the system will check for duplicates. A batch with the same time slot and weekdays cannot exist in the same branch
- `weekdays` must be a non-empty array of valid weekday names if provided

**Success Response (200):**
```json
{
  "success": true,
  "message": "Batch updated successfully",
  "data": {
    "_id": "<BATCH_ID>",
    "name": "Updated Batch Name",
    "timeSlot": "10:00 AM - 12:00 PM",
    "weekdays": ["Tuesday", "Thursday"],
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
  "teacherId": "<TEACHER_ID>"
}
```

**Required Fields:**
- `teacherId` - Teacher ID to assign to the batch (must belong to the same branch)

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
- `404` - Batch not found
- `404` - Teacher not found (or teacher does not belong to the same branch)

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
- `Content-Type: multipart/form-data` (for file upload) or `application/json`

**Description:** Creates a new staff member. Staff profile picture can be uploaded to AWS S3.

**Body (form-data or JSON):**
- `name` (text, required) - Staff name
- `email` (text, required) - Staff email address (must be unique within branch)
- `mobile` (text, required) - Staff mobile number
- `password` (text, required) - Staff login password
- `salaryType` (text, required) - Must be `MONTHLY_FIXED` (only allowed value)
- `salaryRate` (text, required) - Monthly salary amount (number)
- `staffImage` (file, optional) - Staff profile picture/image (jpg/png/webp) - **Uploaded to AWS S3**

**Example (form-data):**
```
name: Staff Name
email: staff@branch.com
mobile: 1234567890
password: staff123
salaryType: MONTHLY_FIXED
salaryRate: 15000
staffImage: <file>
```

**Example (JSON - without image):**
```json
{
  "name": "Staff Name",
  "email": "staff@branch.com",
  "mobile": "1234567890",
  "password": "staff123",
  "salaryType": "MONTHLY_FIXED",
  "salaryRate": 15000
}
```

**File Storage:**
- Staff images are automatically uploaded to AWS S3 bucket
- Files are stored in `staff/` folder in S3
- Files are publicly accessible via S3 URLs
- Response includes S3 URL in `imageUrl` field

**S3 URL Format:**
```
https://{bucket-name}.s3.{region}.amazonaws.com/staff/{filename}
```

**Required Fields:**
- `name` - Staff name
- `email` - Email address (must be unique within the branch)
- `mobile` - Mobile number
- `password` - Staff login password (required)
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
    "imageUrl": "https://notes-market-bucket.s3.eu-north-1.amazonaws.com/staff/image-1234567890-123456789.jpg",
    "password": "staff123",
    "isActive": true,
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `400` - Password is required
- `400` - Invalid salaryType (must be MONTHLY_FIXED)
- `400` - Invalid image file type (only jpg, jpeg, png, webp allowed)
- `400` - File too large (maximum size: 5MB)
- `409` - Email already registered in this branch
- `404` - Branch not found

**Notes:**
- This endpoint creates STAFF members only. To create teachers, use `/api/admin/teachers`
- Staff ID is automatically generated in format: `BRANCH_CODE-STF-SEQUENCE` (e.g., `DHK001-STF-001`)
- `password` is required - provide a custom password for the staff member
- The original password is stored and returned in the response for Admin visibility
- `staffImage` is optional - if provided, it will be uploaded to AWS S3 and the URL will be stored in `imageUrl`
- If S3 is not configured, images are stored locally
- Email is checked against both Staff and Teacher models within the same branch to ensure uniqueness
- Branch isolation is enforced - staff can only be created in the authenticated admin's branch

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
      "imageUrl": "https://notes-market-bucket.s3.eu-north-1.amazonaws.com/staff/image-1234567890-123456789.jpg",
      "password": "staff123",
      "isActive": true,
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
      "imageUrl": "https://notes-market-bucket.s3.eu-north-1.amazonaws.com/staff/image-1234567890-123456789.jpg",
      "password": "staff123",
      "isActive": true,
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
    "imageUrl": "https://notes-market-bucket.s3.eu-north-1.amazonaws.com/staff/image-1234567890-123456789.jpg",
    "password": "staff123",
    "isActive": true,
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-27T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Staff not found
- `400` - Invalid salaryType (must be MONTHLY_FIXED)
- `409` - Email already registered in this branch

**Notes:**
- All fields are optional - only provided fields will be updated
- Email is checked against both Staff and Teacher models within the same branch to ensure uniqueness
- Email update also updates login credentials email
- Response includes the `password` field which contains the original password for Admin visibility

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
- `Content-Type: multipart/form-data` (for file upload) or `application/json`

**Description:** Creates a new teacher with automatic role assignment. This endpoint is specifically designed for teacher creation with teacher-specific validations. Batches can be assigned later if not provided during creation. Teacher image can be uploaded to AWS S3.

**Branch Isolation:** 
- Teachers are automatically assigned to the authenticated admin's branch
- Admins can only create teachers in their own branch
- Admins cannot access or modify teachers from other branches
- Email uniqueness is checked within the branch scope (same email can exist in different branches)

**Body (form-data or JSON):**
- `name` (text, required) - Teacher's full name
- `email` (text, required) - Teacher's email address (must be unique)
- `mobile` (text, required) - Teacher's mobile number
- `password` (text, required) - Teacher's login password
- `salaryType` (text, required) - PER_CLASS | MONTHLY_FIXED | HOURLY
- `salaryRate` (text, required) - Salary rate (number)
- `assignedBatches` (text, optional) - JSON array string of batch IDs (e.g., `["<BATCH_ID_1>", "<BATCH_ID_2>"]`) or can be omitted
- `teacherImage` (file, optional) - Teacher photo/image (jpg/png/webp) - **Uploaded to AWS S3**

**Example (form-data):**
```
name: Teacher Name
email: teacher@branch.com
mobile: 1234567890
password: teacher123
salaryType: PER_CLASS
salaryRate: 300
assignedBatches: ["<BATCH_ID_1>", "<BATCH_ID_2>"]
teacherImage: <file>
```

**Example (JSON - without image):**
```json
{
  "name": "Teacher Name",
  "email": "teacher@branch.com",
  "mobile": "1234567890",
  "password": "teacher123",
  "salaryType": "PER_CLASS",
  "salaryRate": 300
}
```

**File Storage:**
- Teacher images are automatically uploaded to AWS S3 bucket
- Files are stored in `teachers/` folder in S3
- Files are publicly accessible via S3 URLs
- Response includes S3 URL in `imageUrl` field

**S3 URL Format:**
```
https://{bucket-name}.s3.{region}.amazonaws.com/teachers/{filename}
```

**Required Fields:**
- `name` - Teacher's full name
- `email` - Teacher's email address (must be unique)
- `mobile` - Teacher's mobile number
- `password` - Teacher's login password (required)
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
    "assignedBatches": [],
    "salaryType": "PER_CLASS",
    "salaryRate": 300,
    "imageUrl": "https://notes-market-bucket.s3.eu-north-1.amazonaws.com/teachers/image-1234567890-123456789.jpg",
    "password": "teacher123",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response Fields:**
- `_id` - Teacher unique identifier
- `teacherId` - Auto-generated teacher ID (format: `BRANCH_CODE-TCH-SEQUENCE`)
- `name` - Teacher's full name
- `email` - Teacher's email address
- `mobile` - Teacher's mobile number
- `assignedBatches` - Array of assigned batch IDs (empty array if none assigned)
- `salaryType` - Salary type: `PER_CLASS` | `MONTHLY_FIXED` | `HOURLY`
- `salaryRate` - Salary rate (number)
- `imageUrl` - Full S3 URL to teacher image (empty string if no image uploaded)
- `password` - Original password (for Admin visibility)
- `isActive` - Whether teacher is active (boolean)
- `createdAt` - Creation timestamp

**Error Responses:**
- `400` - Missing required fields (name, timeSlot, courseId, weekdays)
- `400` - weekdays must be a non-empty array
- `400` - Invalid weekdays. Valid days: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
- `409` - A batch with the same time slot and weekdays already exists in this branch
- `400` - assignedBatches must be an array if provided
- `400` - Invalid salaryType
- `400` - One or more batches not found, inactive, or belong to different branch
- `400` - Invalid image file type (only jpg, jpeg, png, webp allowed)
- `400` - File too large (maximum size: 5MB)
- `403` - Access denied. Branch mismatch (if trying to create teacher in different branch)
- `409` - Email already registered in this branch
- `404` - Branch not found

**Notes:**
- **Branch Isolation:** Teachers are automatically assigned to the authenticated admin's branch. The `branchId` is set from the admin's JWT token and cannot be overridden. Admins can only create, view, update, or delete teachers from their own branch.
- Teacher ID is auto-generated in format: `BRANCH_CODE-TCH-SEQUENCE` (e.g., `DHK001-TCH-001`)
- `password` is required - provide a custom password for the teacher
- The original password is stored and returned in the response for Admin visibility
- `assignedBatches` is optional - can be omitted or provided as an empty array. Batches can be assigned during creation or later
- `teacherImage` is optional - if provided, it will be uploaded to AWS S3 and the URL will be stored in `imageUrl`
- If S3 is not configured, images are stored locally
- If batches are provided, they are automatically updated with the teacher's ID
- All batches must be active and belong to the same branch (if provided)
- Email uniqueness is checked within the branch scope - the same email can exist in different branches
- Teachers are stored in a separate `Teacher` model (not in Staff model)

---

### Get All Teachers
**Method:** `GET`  
**URL:** `/api/admin/teachers`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Description:** Retrieves all teachers from the authenticated admin's branch. Branch isolation is enforced - admins can only see teachers from their own branch.

**Query Parameters (optional):**
- `isActive` - Filter by active status: `true`, `false`

**Branch Isolation:**
- Only returns teachers from the authenticated admin's branch
- Admins from different branches cannot see each other's teachers

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
      "imageUrl": "https://notes-market-bucket.s3.eu-north-1.amazonaws.com/teachers/image-1234567890-123456789.jpg",
      "password": "teacher123",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Response Fields:**
- All teacher fields including the `password` field which contains the original password for Admin visibility

---

### Get Teacher by ID
**Method:** `GET`  
**URL:** `/api/admin/teachers/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Description:** Retrieves a specific teacher by ID. Branch isolation is enforced - admins can only access teachers from their own branch.

**Branch Isolation:**
- Only returns teacher if it belongs to the authenticated admin's branch
- Returns 404 if teacher belongs to a different branch

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
    "imageUrl": "https://notes-market-bucket.s3.eu-north-1.amazonaws.com/teachers/image-1234567890-123456789.jpg",
    "password": "teacher123",
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

**Response Fields:**
- All teacher fields including the `password` field which contains the original password for Admin visibility

**Error Responses:**
- `404` - Teacher not found

---

### Update Teacher
**Method:** `POST`  
**URL:** `/api/admin/teachers/:id/update`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Description:** Updates a teacher's information. Branch isolation is enforced - admins can only update teachers from their own branch.

**Branch Isolation:**
- Only allows updating teachers that belong to the authenticated admin's branch
- Returns 404 if teacher belongs to a different branch
- Email uniqueness is checked within the branch scope

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
- `404` - Teacher not found (or teacher belongs to a different branch)
- `400` - Invalid salaryType
- `400` - One or more batches not found, inactive, or belong to different branch
- `409` - Email already registered in this branch

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

**Description:** Permanently deletes a teacher. Branch isolation is enforced - admins can only delete teachers from their own branch.

**Branch Isolation:**
- Only allows deleting teachers that belong to the authenticated admin's branch
- Returns 404 if teacher belongs to a different branch

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher deleted successfully"
}
```

**Error Responses:**
- `404` - Teacher not found (or teacher belongs to a different branch)

**Notes:**
- **Branch Isolation:** Teachers can only be deleted by admins from the same branch
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
  "teacherId": "<TEACHER_ID>",
  "examDate": "2024-01-30",
  "maxMarks": 100,
  "passingMarks": 40
}
```

**Required Fields:**
- `name` - Exam name
- `examType` - Exam type (MONTHLY, 6M, 1Y)
- `courseId` - Course ID
- `examDate` - Exam date (YYYY-MM-DD)
- `maxMarks` - Maximum marks
- `passingMarks` - Passing marks

**Optional Fields:**
- `batchId` - Batch ID (if exam is batch-specific)
- `teacherId` - Teacher ID (optional - to assign teacher to exam during creation. Can also be assigned later using the Assign Teacher to Exam API)

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
    "teacherId": "<TEACHER_ID>",
    "examDate": "2024-01-30T00:00:00.000Z",
    "maxMarks": 100,
    "passingMarks": 40,
    "isActive": true,
    ...
  }
}
```

**Note:** If `teacherId` is provided, the system will verify that the teacher exists, is active, and belongs to the same branch. If the exam has a `batchId`, the system will also verify that the teacher is assigned to that batch.

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
      "batchId": {
        "_id": "<BATCH_ID>",
        "name": "Morning Batch",
        "timeSlot": "AM"
      },
      "teacherId": {
        "_id": "<TEACHER_ID>",
        "teacherId": "DHK001-TCH-001",
        "name": "John Teacher",
        "email": "teacher@example.com"
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
      "timeSlot": "AM"
    },
    "teacherId": {
      "_id": "<TEACHER_ID>",
      "teacherId": "DHK001-TCH-001",
      "name": "John Teacher",
      "email": "teacher@example.com"
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
  "examType": "MONTHLY",
  "courseId": "<COURSE_ID>",
  "batchId": "<BATCH_ID>",
  "teacherId": "<TEACHER_ID>",
  "examDate": "2024-01-30",
  "maxMarks": 50,
  "passingMarks": 15,
  "isActive": false
}
```

**Note:** All fields are optional. Only provide fields you want to update. If `teacherId` is provided, the system will verify that the teacher exists, is active, and belongs to the same branch.

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

### Assign Teacher to Exam
**Method:** `POST`  
**URL:** `/api/admin/exams/:id/assign-teacher`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "teacherId": "<TEACHER_ID>"
}
```

**Required Fields:**
- `teacherId` - Teacher ID to assign to the exam

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher assigned to exam successfully",
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
      "timeSlot": "AM"
    },
    "teacherId": {
      "_id": "<TEACHER_ID>",
      "teacherId": "DHK001-TCH-001",
      "name": "John Teacher",
      "email": "teacher@example.com"
    },
    "examDate": "2024-01-30T00:00:00.000Z",
    "maxMarks": 100,
    "passingMarks": 40,
    "isActive": true
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Teacher is not assigned to the exam's batch",
  "note": "The exam is for a batch that has a different teacher assigned. Please assign the correct teacher or update the batch assignment."
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Teacher not found or does not belong to this branch"
}
```

**Note:** 
- The system will verify that the teacher exists, is active, and belongs to the same branch.
- If the exam has a `batchId` and that batch has a teacher assigned, the system will verify that the teacher being assigned matches the batch's assigned teacher.
- This endpoint can also be used to update the teacher assignment for an exam.

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

### Get Inquiry by ID
**Method:** `GET`  
**URL:** `/api/admin/inquiries/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<INQUIRY_ID>",
    "name": "Prospect Name",
    "mobile": "1234567890",
    "status": "NEW",
    "handledBy": {
      "name": "Admin Name",
      "email": "admin@branch.com"
    }
  }
}
```

---

### Update Inquiry
**Method:** `POST`  
**URL:** `/api/admin/inquiries/:id/update`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON, all optional):**
```json
{
  "name": "Updated Name",
  "status": "CONTACTED",
  "notes": "Spoke to the student, interested"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Inquiry updated successfully",
  "data": { ... }
}
```

---

### Delete Inquiry
**Method:** `POST`  
**URL:** `/api/admin/inquiries/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Inquiry deleted successfully"
}
```

---

### Convert Inquiry to Student
**Method:** `POST`  
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

### Get Recorded Class by ID
**Method:** `GET`  
**URL:** `/api/admin/recorded-classes/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Path Parameters:**
- `id` (required) - Recorded class ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<RECORDED_CLASS_ID>",
    "title": "Introduction to Programming",
    "description": "Basic programming concepts",
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
    "thumbnailUrl": "https://s3.../thumbnail.jpg",
    "duration": 3600,
    "expiryDate": "2024-12-31T00:00:00.000Z",
    "accessControl": {
      "allowedStudents": [
        {
          "_id": "<STUDENT_ID>",
          "studentId": "DHK001-2024-001",
          "studentName": "John Doe",
          "name": "John Doe"
        }
      ],
      "allowDownload": false
    },
    "uploadedBy": {
      "_id": "<USER_ID>",
      "name": "Admin Name",
      "email": "admin@branch.com"
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid recorded class ID format
- `404` - Recorded class not found

---

### Update Recorded Class
**Method:** `POST`  
**URL:** `/api/admin/recorded-classes/:id/update`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (form-data or JSON):**

**Path Parameters:**
- `id` (required) - Recorded class ID

**Body Fields (all optional):**
- `batchId` (text) - Batch ID
- `courseId` (text) - Course ID
- `title` (text) - Class title
- `description` (text) - Class description
- `duration` (text) - Video duration in seconds
- `expiryDate` (text) - Expiry date (ISO format)
- `allowedStudents` (text) - Comma-separated student IDs or JSON array string
- `allowDownload` (text) - true/false
- `isActive` (text) - true/false
- `video` (file, optional) - New video file (mp4/avi/mov/mkv/webm)
- `thumbnail` (file, optional) - New thumbnail image (jpg/jpeg/png/webp)

**Note:** 
- All fields are optional - only provided fields will be updated
- File uploads (video/thumbnail) are optional - only upload if you want to replace existing files
- `allowedStudents` can be provided as:
  - Comma-separated string: `"DHK001-2024-001, DHK001-2024-002"`
  - JSON array string: `'["DHK001-2024-001", "DHK001-2024-002"]'`
  - Array of ObjectIds: `["<OBJECT_ID_1>", "<OBJECT_ID_2>"]`

**Example (JSON):**
```json
{
  "title": "Updated Class Title",
  "description": "Updated description",
  "duration": 4200,
  "expiryDate": "2024-12-31T00:00:00.000Z",
  "allowedStudents": "DHK001-2024-001, DHK001-2024-002",
  "allowDownload": true,
  "isActive": true
}
```

**Example (form-data with file upload):**
- `title`: "Updated Class Title"
- `description`: "Updated description"
- `video`: <file> (optional - only if replacing video)
- `thumbnail`: <file> (optional - only if replacing thumbnail)
- `allowedStudents`: "DHK001-2024-001, DHK001-2024-002"
- `allowDownload`: "true"

**Success Response (200):**
```json
{
  "success": true,
  "message": "Recorded class updated successfully",
  "data": {
    "_id": "<RECORDED_CLASS_ID>",
    "title": "Updated Class Title",
    "description": "Updated description",
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
    "videoUrl": "https://s3.../new-video.mp4",
    "thumbnailUrl": "https://s3.../new-thumbnail.jpg",
    "duration": 4200,
    "expiryDate": "2024-12-31T00:00:00.000Z",
    "accessControl": {
      "allowedStudents": [
        {
          "_id": "<STUDENT_ID_1>",
          "studentId": "DHK001-2024-001",
          "studentName": "John Doe"
        },
        {
          "_id": "<STUDENT_ID_2>",
          "studentId": "DHK001-2024-002",
          "studentName": "Jane Smith"
        }
      ],
      "allowDownload": true
    },
    "isActive": true,
    "uploadedBy": {
      "_id": "<USER_ID>",
      "name": "Admin Name",
      "email": "admin@branch.com"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T14:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid recorded class ID format
- `400` - Invalid batchId or courseId format
- `400` - Invalid allowedStudents format
- `404` - Recorded class not found
- `404` - Batch not found (if batchId provided)
- `404` - Course not found (if courseId provided)

**Notes:**
- Partial updates are supported - only provided fields will be updated
- If `batchId` or `courseId` is provided, they are validated to ensure they belong to the admin's branch
- If `allowedStudents` contains student IDs (strings), they are automatically converted to ObjectIds
- If some student IDs in `allowedStudents` are not found, a warning is logged but the update proceeds with found students
- File uploads are optional - existing files are only replaced if new files are provided
- All actions are logged in audit log

---

### Delete Recorded Class
**Method:** `POST`  
**URL:** `/api/admin/recorded-classes/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Path Parameters:**
- `id` (required) - Recorded class ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Recorded class deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid recorded class ID format
- `404` - Recorded class not found

**Notes:**
- Recorded class is permanently deleted from the database
- This action cannot be undone
- All actions are logged in audit log
- Branch isolation is enforced - only recorded classes from the admin's branch can be deleted

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

1. **Branch Isolation:** 
   - **CRITICAL:** All endpoints automatically filter data by the admin's branch
   - Admins can only access, create, update, or delete resources (students, teachers, staff, batches, courses, etc.) that belong to their own branch
   - When creating teachers, the `branchId` is automatically set from the authenticated admin's JWT token and cannot be overridden
   - Admins from different branches cannot see or access each other's teachers, students, or other resources
   - Email uniqueness is checked within the branch scope (same email can exist in different branches)
   - Cross-branch access attempts will return 404 (resource not found) or 403 (access denied)

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
