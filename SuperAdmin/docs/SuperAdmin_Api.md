# SuperAdmin API Documentation (Postman Style)

Base URL: `/api`

## Authorization Header (Protected APIs)
```
Authorization: Bearer <JWT_TOKEN>
```

## Authentication

### Super Admin Signup
**Method:** `POST`  
**URL:** `/super-admin/signup`  
**Headers:** `Content-Type: application/json`  
**Body (raw JSON):**
```json
{
  "name": "System Owner",
  "email": "admin@company.com",
  "password": "123456"
}
```
**Success Response (201):**
```json
{
  "success": true,
  "message": "Super Admin created successfully"
}
```

### Super Admin Login
**Method:** `POST`  
**URL:** `/super-admin/login`  
**Headers:** `Content-Type: application/json`  
**Body (raw JSON):**
```json
{
  "email": "admin@company.com",
  "password": "123456"
}
```
**Success Response (200):**
```json
{
  "success": true,
  "jwt_token": "<JWT_TOKEN>",
  "role": "SUPER_ADMIN"
}
```

### Super Admin Logout
**Method:** `POST`  
**URL:** `/super-admin/logout`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current Super Admin Profile (Who I Am)
**Method:** `GET`  
**URL:** `/super-admin/me`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Description:** Returns the authenticated super admin's profile information including name, email, role, and account status.  
**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "<SUPER_ADMIN_ID>",
    "name": "System Owner",
    "email": "admin@company.com",
    "role": "SUPER_ADMIN",
    "isActive": true,
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```
**Error Responses:**
- `401` - No token provided or invalid token
- `403` - Account disabled
- `404` - Super Admin not found

## Dashboard (Super Admin)

### Summary
**Method:** `GET`  
**URL:** `/super-admin/dashboard/summary`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalBranches": 0,
    "totalStudents": 0,
    "totalStaff": 0,
    "todayAttendancePercentage": 0,
    "totalMonthlyIncome": 0,
    "totalDueAmount": 0,
    "inactiveBranches": 0,
    "blockedAdmins": 0
  }
}
```

### Graphs
**Method:** `GET`  
**URL:** `/super-admin/dashboard/graphs`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "branchWiseIncome": [],
    "monthlyStudentGrowth": [],
    "dueVsCollectedFees": {
      "totalDue": 0,
      "totalCollected": 0
    }
  }
}
```

## Branch Management (Super Admin)

### Create Branch
**Method:** `POST`  
**URL:** `/super-admin/branches`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
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
  "contactNumber": "01234567890"
}
```
**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "<BRANCH_ID>",
    "name": "Dhaka Main",
    "code": "DHK001",
    "addresses": [],
    "contactNumber": "01234567890",
    "status": "ACTIVE",
    "isDeleted": false,
    "createdAt": "<ISO_DATE>",
    "updatedAt": "<ISO_DATE>"
  }
}
```

### List Branches
**Method:** `GET`  
**URL:** `/super-admin/branches`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "data": []
}
```

### Update Branch
**Method:** `POST`  
**URL:** `/super-admin/branches/:id/update`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "name": "Updated Name",
  "contactNumber": "08888877726",
  "status": "ACTIVE"
}
```
**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<BRANCH_ID>",
    "name": "Updated Name",
    "status": "ACTIVE"
  }
}
```

### Lock Branch
**Method:** `POST`  
**URL:** `/super-admin/branches/:id/lock`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Description:** Locks a branch by setting its status to `LOCKED`. Locked branches are inactive and cannot be used for operations.  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Branch locked successfully",
  "data": {
    "_id": "<BRANCH_ID>",
    "name": "Dhaka Main",
    "code": "DHK001",
    "status": "LOCKED",
    "isDeleted": false
  }
}
```
**Error Response (404):**
```json
{
  "success": false,
  "message": "Branch not found"
}
```

### Unlock Branch
**Method:** `POST`  
**URL:** `/super-admin/branches/:id/unlock`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Description:** Unlocks a branch by setting its status to `ACTIVE`. Unlocked branches become active and can be used for operations.  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Branch unlocked successfully",
  "data": {
    "_id": "<BRANCH_ID>",
    "name": "Dhaka Main",
    "code": "DHK001",
    "status": "ACTIVE",
    "isDeleted": false
  }
}
```
**Error Response (404):**
```json
{
  "success": false,
  "message": "Branch not found"
}
```

### Soft Delete Branch
**Method:** `POST`  
**URL:** `/super-admin/branches/:id/soft-delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Description:** Soft deletes a branch by setting `isDeleted: true`. The branch is not permanently removed and can be restored later. Soft deleted branches are excluded from normal queries.  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Branch soft deleted successfully",
  "data": {
    "_id": "<BRANCH_ID>",
    "name": "Dhaka Main",
    "code": "DHK001",
    "isDeleted": true
  }
}
```
**Error Response (404):**
```json
{
  "success": false,
  "message": "Branch not found or already deleted"
}
```

### Delete Branch (Hard)
**Method:** `POST`  
**URL:** `/super-admin/branches/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Description:** Permanently deletes a branch from the database. This action cannot be undone.  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Branch deleted permanently"
}
```

## Branch Admin Management (Super Admin)

**Note:** Multiple admins are allowed per branch. Each branch can have multiple admin users with different email addresses.

**Important:** All branch admin API responses include the `originalPassword` field, which contains the plain text password for SuperAdmin visibility. This field is only visible to SuperAdmin users through these endpoints.

### Create Branch Admin
**Method:** `POST`  
**URL:** `/super-admin/branch-admins`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "name": "Branch Admin",
  "email": "admin@branch.com",
  "password": "123456",
  "branchId": "<BRANCH_ID>"
}
```
**Description:** Creates a new branch admin. Multiple admins can be created for the same branch. Each admin must have a unique email address. The original password is stored and returned in the response for SuperAdmin visibility.  
**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "<ADMIN_ID>",
    "name": "Branch Admin",
    "email": "admin@branch.com",
    "role": "ADMIN",
    "branchId": "<BRANCH_ID>",
    "isActive": true,
    "originalPassword": "123456"
  }
}
```
**Error Response (409):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### Get All Branch Admins
**Method:** `GET`  
**URL:** `/super-admin/branch-admins`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Query Parameters (optional):**
- `branchId` - Filter admins by branch ID

**Examples:**
- Get all admins: `GET /super-admin/branch-admins`
- Get admins for specific branch: `GET /super-admin/branch-admins?branchId=<BRANCH_ID>`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<ADMIN_ID>",
      "name": "Branch Admin 1",
      "email": "admin1@branch.com",
      "role": "ADMIN",
      "branchId": {
        "_id": "<BRANCH_ID>",
        "name": "Dhaka Main",
        "code": "DHK001"
      },
      "isActive": true,
      "originalPassword": "123456"
    },
    {
      "_id": "<ADMIN_ID>",
      "name": "Branch Admin 2",
      "email": "admin2@branch.com",
      "role": "ADMIN",
      "branchId": {
        "_id": "<BRANCH_ID>",
        "name": "Dhaka Main",
        "code": "DHK001"
      },
      "isActive": true,
      "originalPassword": "123456"
    }
  ]
}
```

### Update Branch Admin
**Method:** `POST`  
**URL:** `/super-admin/branch-admins/:id/update`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "name": "Updated Name",
  "email": "updated@branch.com",
  "branchId": "<BRANCH_ID>",
  "isActive": true
}
```
**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<ADMIN_ID>",
    "name": "Updated Name",
    "email": "updated@branch.com",
    "role": "ADMIN",
    "branchId": "<BRANCH_ID>",
    "isActive": true,
    "originalPassword": "123456"
  }
}
```

### Block Branch Admin
**Method:** `POST`  
**URL:** `/super-admin/branch-admins/:id/block`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<ADMIN_ID>",
    "name": "Branch Admin",
    "email": "admin@branch.com",
    "role": "ADMIN",
    "branchId": "<BRANCH_ID>",
    "isActive": false,
    "originalPassword": "123456"
  }
}
```

### Unblock Branch Admin
**Method:** `POST`  
**URL:** `/super-admin/branch-admins/:id/unblock`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<ADMIN_ID>",
    "name": "Branch Admin",
    "email": "admin@branch.com",
    "role": "ADMIN",
    "branchId": "<BRANCH_ID>",
    "isActive": true,
    "originalPassword": "123456"
  }
}
```

### Delete Branch Admin (Hard)
**Method:** `POST`  
**URL:** `/super-admin/branch-admins/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Branch admin deleted permanently"
}
```

### Reset Branch Admin Password
**Method:** `POST`  
**URL:** `/super-admin/branch-admins/:id/reset-password`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "password": "new_password"
}
```
**Description:** Resets the branch admin password. The new original password is stored and returned in the response for SuperAdmin visibility.  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "_id": "<ADMIN_ID>",
    "name": "Branch Admin",
    "email": "admin@branch.com",
    "role": "ADMIN",
    "branchId": "<BRANCH_ID>",
    "isActive": true,
    "originalPassword": "new_password"
  }
}
```

## Finance (Super Admin)

### Overview
**Method:** `GET`  
**URL:** `/super-admin/finance/overview`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalCollection": 0,
    "branchWiseCollection": [],
    "dueSummary": 0,
    "discountSummary": 0
  }
}
```

### Export
**Method:** `GET`  
**URL:** `/super-admin/finance/export?type=pdf|excel`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Finance export (pdf) generated"
}
```

## Master Settings (Super Admin)

### Courses
**Method:** `POST`  
**URL:** `/super-admin/master/courses`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (form-data):**
- `name` (text) - Course name
- `description` (text) - Course description
- `duration` (text) - Course duration (e.g., "6 months")
- `courseCategory` (text) - Basic | Advanced | Diploma
- `courseFees` (text) - Total course fees
- `admissionFees` (text) - Admission fees
- `monthlyFees` (text) - Monthly fees
- `image` (file) - Course image (jpg/png/webp) - **Uploaded to AWS S3**
- `pdf` (file) - Course PDF document (pdf) - **Uploaded to AWS S3**

**File Storage:**
- All files are automatically uploaded to AWS S3 bucket
- Files are stored in `courses/` folder in S3
- Files are publicly accessible via S3 URLs
- Response includes S3 URLs in `imageUrl` and `pdfUrl` fields

**S3 URL Format:**
```
https://{bucket-name}.s3.{region}.amazonaws.com/courses/{filename}
```

**Required AWS S3 Configuration:**
- `AWS_REGION` - AWS region (e.g., "eu-north-1")
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_S3_BUCKET` - S3 bucket name

**Note:** If S3 configuration is missing, the API will return an error. Files must be stored in AWS S3 bucket.

**Success Response (201):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "name": "DCA",
    "courseCategory": "Basic",
    "courseFees": 3500
  }
}
```

**Note:** The course object stored in database includes:
- `imageUrl`: Full S3 URL to the course image (e.g., `https://notes-market-bucket.s3.eu-north-1.amazonaws.com/courses/image-1234567890-123456789.jpg`)
- `pdfUrl`: Full S3 URL to the course PDF (e.g., `https://notes-market-bucket.s3.eu-north-1.amazonaws.com/courses/pdf-1234567890-123456789.pdf`)

### Get All Courses
**Method:** `GET`  
**URL:** `/super-admin/master/courses`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Description:** Retrieves all courses sorted by creation date (newest first). Returns complete course information including S3 URLs for images and PDFs.  
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
      "isActive": true,
      "createdBy": "ADMIN",
      "approvalStatus": "APPROVED",
      "approvedBy": "<SUPER_ADMIN_ID>",
      "approvedAt": "2024-01-20T14:00:00.000Z",
      "rejectionReason": null,
      "createdAt": "2024-01-20T12:00:00.000Z",
      "updatedAt": "2024-01-20T14:00:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `_id` - Course unique identifier
- `name` - Course name
- `description` - Course description
- `duration` - Course duration (e.g., "6 months")
- `courseCategory` - Course category: `Basic` | `Advanced` | `Diploma`
- `courseFees` - Total course fees (number)
- `admissionFees` - Admission fees (number)
- `monthlyFees` - Monthly fees (number)
- `imageUrl` - Full S3 URL to course image
- `pdfUrl` - Full S3 URL to course PDF document
- `isActive` - Whether the course is active (boolean)
- `createdBy` - Creator role: `SUPER_ADMIN` | `ADMIN`
- `approvalStatus` - Approval status: `PENDING` | `APPROVED` | `REJECTED`
- `approvedBy` - ID of SuperAdmin who approved (ObjectId, null if pending/rejected)
- `approvedAt` - Approval timestamp (Date, null if pending/rejected)
- `rejectionReason` - Reason for rejection (string, null if approved/pending)
- `createdAt` - Course creation timestamp
- `updatedAt` - Last update timestamp

### Update Course
**Method:** `POST`  
**URL:** `/super-admin/master/courses/:id/update`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (form-data, optional fields):**
- `name` (text)
- `description` (text)
- `duration` (text)
- `courseCategory` (Basic | Advanced | Diploma)
- `courseFees` (number)
- `admissionFees` (number)
- `monthlyFees` (number)
- `isActive` (boolean)
- `image` (file: jpg/png/webp)
- `pdf` (file: pdf)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "_id": "<COURSE_ID>",
    "name": "DCA"
  }
}
```

### Delete Course (Hard)
**Method:** `POST`  
**URL:** `/super-admin/master/courses/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

### Approve Course Created by Admin
**Method:** `POST`  
**URL:** `/super-admin/master/courses/:id/approve`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Description:** Approves a course created by an Admin. Sets `approvalStatus` to `APPROVED`, `isActive` to `true`, and records the approver and approval timestamp.  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Course approved successfully",
  "data": {
    "_id": "<COURSE_ID>",
    "name": "Web Development",
    "approvalStatus": "APPROVED",
    "isActive": true,
    "approvedBy": "<SUPER_ADMIN_ID>",
    "approvedAt": "2024-01-15T10:30:00.000Z"
  }
}
```
**Error Responses:**
- `404` - Course not found
- `400` - Course is already approved
- `400` - Cannot approve a rejected course (must create new course)

### Reject Course Created by Admin
**Method:** `POST`  
**URL:** `/super-admin/master/courses/:id/reject`  
**Headers:** 
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "rejectionReason": "Course fees are too high. Please revise and resubmit."
}
```

**Description:** Rejects a course created by an Admin. Sets `approvalStatus` to `REJECTED`, `isActive` to `false`, and records the rejection reason, rejector, and rejection timestamp.  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Course rejected successfully",
  "data": {
    "_id": "<COURSE_ID>",
    "name": "Web Development",
    "approvalStatus": "REJECTED",
    "isActive": false,
    "approvedBy": "<SUPER_ADMIN_ID>",
    "approvedAt": "2024-01-15T10:30:00.000Z",
    "rejectionReason": "Course fees are too high. Please revise and resubmit."
  }
}
```
**Error Responses:**
- `404` - Course not found
- `400` - Rejection reason is required
- `400` - Cannot reject an already approved course
- `400` - Course is already rejected

### Get Pending Courses
**Method:** `GET`  
**URL:** `/super-admin/master/courses/pending`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Description:** Retrieves all courses with `approvalStatus: PENDING` that are waiting for SuperAdmin approval.  
**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "<COURSE_ID>",
      "name": "Web Development",
      "description": "Learn web development",
      "duration": "6 months",
      "courseCategory": "Advanced",
      "courseFees": 5000,
      "admissionFees": 500,
      "monthlyFees": 1000,
      "approvalStatus": "PENDING",
      "isActive": false,
      "createdBy": "ADMIN",
      "createdAt": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

### Fee Rules
**Method:** `POST`  
**URL:** `/super-admin/master/fee-rules`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "rules": []
}
```

### Discount Policy
**Method:** `POST`  
**URL:** `/super-admin/master/discount-policy`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "policy": {}
}
```

### Exam Rules
**Method:** `POST`  
**URL:** `/super-admin/master/exam-rules`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "rules": {}
}
```

### Certificate Template
**Method:** `POST`  
**URL:** `/super-admin/master/certificate-template`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "template": {}
}
```

## Certificate Control

### Admin Template
**Method:** `POST`  
**URL:** `/super-admin/certificates/template`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "template": {}
}
```

### Admin Rules
**Method:** `POST`  
**URL:** `/super-admin/certificates/rules`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "rules": {}
}
```

### Public Verify
**Method:** `GET`  
**URL:** `/certificates/verify/:certificateId`  
**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "certificateId": "<CERT_ID>",
    "verified": false
  }
}
```

## Leads & Marketing (Super Admin)

### Get Leads
**Method:** `GET`  
**URL:** `/super-admin/leads`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "data": []
}
```

### Lead Analytics
**Method:** `GET`  
**URL:** `/super-admin/leads/analytics`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "byStatus": [],
    "bySource": []
  }
}
```

## System Settings (Super Admin)

### Backup
**Method:** `POST`  
**URL:** `/super-admin/system/backup`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "run": true
}
```

### Permissions
**Method:** `POST`  
**URL:** `/super-admin/system/permissions`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "permissions": {}
}
```

### Notifications
**Method:** `POST`  
**URL:** `/super-admin/system/notifications`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Body (raw JSON):**
```json
{
  "channels": []
}
```

## Health Check

### Server Health
**Method:** `GET`  
**URL:** `/health`  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-15T00:00:00.000Z"
}
```

