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
    "totalDueAmount": 0
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

### Delete Branch (Hard)
**Method:** `POST`  
**URL:** `/super-admin/branches/:id/delete`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "message": "Branch deleted permanently"
}
```

## Branch Admin Management (Super Admin)

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
    "isActive": true
  }
}
```

### Get All Branch Admins
**Method:** `GET`  
**URL:** `/super-admin/branch-admins`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`  
**Success Response (200):**
```json
{
  "success": true,
  "data": []
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
    "role": "ADMIN"
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
    "isActive": false
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
    "isActive": true
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
**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
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
**Success Response (200):**
```json
{
  "success": true,
  "data": []
}
```

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

