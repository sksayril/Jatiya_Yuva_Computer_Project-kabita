# Admin Panel Backend - National Youth Computer Center

A complete branch-level admin panel backend system built with Node.js, Express.js, MongoDB, JWT, and bcrypt.

## Features

- ✅ Branch-level access control with strict isolation
- ✅ JWT authentication with branchId in payload
- ✅ Complete student management (registration, approval, batch transfer)
- ✅ Attendance system (QR code, face recognition placeholder, manual)
- ✅ Fees & payment management with auto-due calculation
- ✅ Course & batch management
- ✅ Staff/Teacher management with salary calculation
- ✅ Exam, result, and certificate generation
- ✅ Inquiry management and conversion
- ✅ Recorded class management
- ✅ Comprehensive reporting system
- ✅ Audit logging for all actions

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT (jsonwebtoken)
- bcrypt
- QR Code generation (qrcode)
- AWS S3 for file storage
- Multer for file uploads

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the Admin folder (or root):
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=Jatiya_Yuva_Computer
JWT_SECRET=your_admin_jwt_secret_change_this
ADMIN_PORT=3001
NODE_ENV=development

# AWS S3 (optional, falls back to local storage)
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
```

3. Start the server:
```bash
npm run dev:admin
# or
npm run start:admin
```

## Project Structure

```
Admin/
├── config/
│   └── env.config.js          # Environment configuration
├── models/
│   ├── student.model.js       # Student schema
│   ├── staff.model.js         # Staff/Teacher schema
│   ├── batch.model.js          # Batch schema
│   ├── attendance.model.js    # Attendance schemas
│   ├── payment.model.js       # Payment schema
│   ├── exam.model.js          # Exam schema
│   ├── result.model.js        # Result schema
│   ├── certificate.model.js   # Certificate schema
│   ├── inquiry.model.js       # Inquiry schema
│   ├── recordedClass.model.js # Recorded class schema
│   └── auditLog.model.js      # Audit log schema
├── controllers/
│   ├── auth.controller.js     # Authentication
│   ├── dashboard.controller.js # Dashboard
│   ├── student.controller.js  # Student management
│   ├── attendance.controller.js # Attendance
│   ├── payment.controller.js  # Payments
│   ├── course.controller.js  # Courses
│   ├── batch.controller.js    # Batches
│   ├── staff.controller.js    # Staff/Teachers
│   ├── exam.controller.js     # Exams
│   ├── result.controller.js   # Results
│   ├── certificate.controller.js # Certificates
│   ├── inquiry.controller.js  # Inquiries
│   ├── recordedClass.controller.js # Recorded classes
│   └── report.controller.js   # Reports
├── routes/
│   └── [all route files]      # Route definitions
├── middlewares/
│   ├── auth.middleware.js     # JWT authentication
│   └── branchIsolation.middleware.js # Branch isolation
├── utils/
│   ├── jwt.js                 # JWT utilities
│   ├── qrGenerator.js         # QR code generation
│   ├── idGenerator.js         # ID generation
│   ├── auditLogger.js         # Audit logging
│   └── upload.js              # File upload
└── app.js                     # Main application
```

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout

### Dashboard
- `GET /api/admin/dashboard/summary` - Dashboard summary

### Student Management
- `POST /api/admin/students/manual` - Manual student registration
- `POST /api/admin/students/scan-form` - Scan form image (OCR placeholder)
- `PATCH /api/admin/students/:id/approve` - Approve pending student
- `PATCH /api/admin/students/:id/drop` - Drop student
- `PATCH /api/admin/students/:id/change-batch` - Change student batch
- `GET /api/admin/students` - Get all students
- `GET /api/admin/students/:id` - Get student by ID

### Attendance
- `POST /api/admin/attendance/student` - Mark student attendance
- `POST /api/admin/attendance/staff` - Mark staff attendance
- `GET /api/admin/attendance/student` - Get student attendance
- `GET /api/admin/attendance/staff` - Get staff attendance

### Payments
- `POST /api/admin/payments` - Create payment
- `GET /api/admin/payments` - Get payments

### Courses
- `POST /api/admin/courses` - Create course
- `GET /api/admin/courses` - Get courses

### Batches
- `POST /api/admin/batches` - Create batch
- `GET /api/admin/batches` - Get batches
- `PATCH /api/admin/batches/:id` - Update batch

### Staff/Teachers
- `POST /api/admin/staff` - Create staff/teacher
- `GET /api/admin/staff` - Get staff

### Exams
- `POST /api/admin/exams` - Create exam
- `GET /api/admin/exams` - Get exams

### Results
- `POST /api/admin/results` - Create/update result
- `GET /api/admin/results` - Get results

### Certificates
- `POST /api/admin/certificates` - Generate certificate
- `GET /api/admin/certificates` - Get certificates

### Inquiries
- `POST /api/admin/inquiries` - Create inquiry
- `GET /api/admin/inquiries` - Get inquiries
- `PATCH /api/admin/inquiries/:id/convert` - Convert inquiry to student

### Recorded Classes
- `POST /api/admin/recorded-classes` - Create recorded class
- `GET /api/admin/recorded-classes` - Get recorded classes

### Reports
- `GET /api/admin/reports/attendance` - Attendance report
- `GET /api/admin/reports/fees` - Fees report
- `GET /api/admin/reports/salary` - Salary report

## Security Features

- ✅ JWT-based authentication
- ✅ Branch isolation middleware (enforces data access to own branch only)
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Input validation
- ✅ Audit logging for all actions
- ✅ Error handling with environment-aware messages

## Branch Isolation

All endpoints enforce branch isolation:
- Admin can only access data from their assigned branch
- BranchId is automatically injected from JWT token
- Queries are automatically filtered by branchId
- Cross-branch access is strictly prevented

## JWT Token Structure

```json
{
  "userId": "admin_user_id",
  "role": "ADMIN",
  "branchId": "branch_id"
}
```

## Usage Example

### Login
```bash
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@branch.com",
  "password": "password123"
}
```

### Create Student
```bash
POST /api/admin/students/manual
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "John Doe",
  "guardianName": "Jane Doe",
  "mobile": "1234567890",
  "address": "123 Main St",
  "courseId": "course_id",
  "batchId": "batch_id",
  "registrationDate": "2024-01-15"
}
```

### Mark Attendance
```bash
POST /api/admin/attendance/student
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "studentId": "student_id",
  "batchId": "batch_id",
  "date": "2024-01-15",
  "method": "QR",
  "qrData": "{\"studentId\":\"...\",\"branchId\":\"...\"}"
}
```

## Notes

- OCR functionality is placeholder - integrate actual OCR service (Tesseract, Google Vision API, etc.)
- PDF generation is placeholder - integrate PDF library (PDFKit, jsPDF, etc.)
- Face recognition is placeholder - integrate face recognition service
- All file uploads support both AWS S3 and local storage (falls back to local if S3 not configured)
- QR codes are generated for students, staff, and certificates
- Salary calculation is automatic based on attendance for PER_CLASS type
- Kids batch discount is locked (read-only) once set

## Development

The system is designed to be:
- Scalable and maintainable
- Production-ready
- Secure with proper access controls
- Well-documented
- Easy to extend

## License

ISC
