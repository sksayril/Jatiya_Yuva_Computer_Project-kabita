# Public API Documentation

Complete API documentation for public endpoints (no authentication required).

**Base URL:** `http://localhost:3000/api`

**Authentication:** None required - these are public endpoints

---

## Table of Contents

1. [Courses](#courses)
2. [Certificate Verification](#certificate-verification)

---

## Courses

### Get All Approved Courses
**Method:** `GET`  
**URL:** `/api/public/courses`  
**Description:** Returns all courses that are approved and active. No authentication required.

**Query Parameters:**
- `category` (optional) - Filter by category: `Basic`, `Advanced`, or `Diploma`
- `search` (optional) - Search in course name or description
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)
- `sortBy` (optional) - Sort field: `name`, `courseCategory`, `courseFees`, `createdAt`, `duration` (default: `createdAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "DCA (Diploma in Computer Applications)",
        "description": "Comprehensive computer applications course covering MS Office, Internet, and basic programming.",
        "duration": "6 months",
        "courseCategory": "Diploma",
        "courseFees": 6000,
        "admissionFees": 500,
        "monthlyFees": 1000,
        "imageUrl": "/uploads/courses/dca.jpg",
        "pdfUrl": "/uploads/courses/dca.pdf",
        "isActive": true,
        "approvalStatus": "APPROVED",
        "approvedAt": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-10T08:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Web Development",
        "description": "Learn modern web development with HTML, CSS, JavaScript, and React.",
        "duration": "4 months",
        "courseCategory": "Advanced",
        "courseFees": 8000,
        "admissionFees": 500,
        "monthlyFees": 2000,
        "imageUrl": "/uploads/courses/web-dev.jpg",
        "pdfUrl": "/uploads/courses/web-dev.pdf",
        "isActive": true,
        "approvalStatus": "APPROVED",
        "approvedAt": "2024-01-20T09:15:00.000Z",
        "createdAt": "2024-01-18T10:00:00.000Z",
        "updatedAt": "2024-01-20T09:15:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "category": null,
      "search": null,
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

**Response Fields:**
- `courses` - Array of approved and active courses
  - `_id` - Course ID
  - `name` - Course name
  - `description` - Course description
  - `duration` - Course duration
  - `courseCategory` - Category (Basic, Advanced, Diploma)
  - `courseFees` - Total course fees
  - `admissionFees` - Admission fees
  - `monthlyFees` - Monthly fees
  - `imageUrl` - Course image URL
  - `pdfUrl` - Course PDF/syllabus URL
  - `isActive` - Active status (always true for approved courses)
  - `approvalStatus` - Approval status (always "APPROVED")
  - `approvedAt` - Approval timestamp
  - `createdAt` - Creation timestamp
  - `updatedAt` - Last update timestamp
- `pagination` - Pagination information
- `filters` - Applied filters and sorting

**Example Requests:**
```
GET /api/public/courses
GET /api/public/courses?category=Diploma
GET /api/public/courses?search=web&page=1&limit=10
GET /api/public/courses?sortBy=courseFees&sortOrder=asc
GET /api/public/courses?category=Advanced&search=development&page=1&limit=20
```

**Error Responses:**
- `500` - Server error

---

### Get Approved Course by ID
**Method:** `GET`  
**URL:** `/api/public/courses/:id`  
**Description:** Returns a single approved course by its ID. No authentication required.

**URL Parameters:**
- `id` - Course ID (MongoDB ObjectId)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "course": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "DCA (Diploma in Computer Applications)",
      "description": "Comprehensive computer applications course covering MS Office, Internet, and basic programming.",
      "duration": "6 months",
      "courseCategory": "Diploma",
      "courseFees": 6000,
      "admissionFees": 500,
      "monthlyFees": 1000,
      "imageUrl": "/uploads/courses/dca.jpg",
      "pdfUrl": "/uploads/courses/dca.pdf",
      "isActive": true,
      "approvalStatus": "APPROVED",
      "approvedAt": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `404` - Course not found or not available
- `400` - Invalid course ID format
- `500` - Server error

---

### Get Course Categories
**Method:** `GET`  
**URL:** `/api/public/courses/categories`  
**Description:** Returns all available course categories with count of approved courses in each category. No authentication required.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "Advanced",
        "count": 15
      },
      {
        "category": "Basic",
        "count": 20
      },
      {
        "category": "Diploma",
        "count": 10
      }
    ]
  }
}
```

**Response Fields:**
- `categories` - Array of categories with course counts
  - `category` - Category name (Basic, Advanced, Diploma)
  - `count` - Number of approved courses in this category

**Error Responses:**
- `500` - Server error

---

## Certificate Verification

### Verify Certificate
**Method:** `GET`  
**URL:** `/api/certificates/verify/:certificateId`  
**Description:** Verify a certificate by its certificate ID. No authentication required.

**URL Parameters:**
- `certificateId` - Certificate ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "certificate": {
      "_id": "507f1f77bcf86cd799439011",
      "certificateId": "CERT-2024-001",
      "studentName": "John Doe",
      "courseName": "DCA",
      "issueDate": "2024-01-15T00:00:00.000Z",
      "isValid": true
    }
  }
}
```

**Error Responses:**
- `404` - Certificate not found
- `500` - Server error

---

## Notes

1. **No Authentication Required**: All endpoints in this documentation are public and do not require authentication tokens.

2. **CORS Enabled**: All endpoints support CORS and can be accessed from any origin.

3. **Rate Limiting**: Consider implementing rate limiting for production use.

4. **Data Privacy**: Only approved and active courses are returned. Pending or rejected courses are not accessible through public APIs.

5. **Pagination**: The courses list endpoint supports pagination to handle large datasets efficiently.

6. **Filtering**: You can filter courses by category and search by name or description.

7. **Sorting**: Courses can be sorted by various fields (name, category, fees, creation date, duration).

---

## Base URL Examples

**Development:**
```
http://localhost:3000/api/public/courses
```

**Production:**
```
https://yourdomain.com/api/public/courses
```

---

**For detailed API documentation of authenticated endpoints, see:**
- Super Admin API: `SuperAdmin/docs/SuperAdmin_Api.md`
- Admin Panel API: `Admin/docs/Admin_API.md`
- Student Panel API: `Student/docs/Student_API.md`
- Teacher Panel API: `Teacher/docs/Teacher_API.md`
- Staff Panel API: `Staff/docs/Staff_API.md`
