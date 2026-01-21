# Jatiya Yuva Computer Project

A complete backend system for "National Youth Computer Center" with Super Admin and Branch Admin panels.

## Project Structure

```
├── SuperAdmin/          # Super Admin Panel (System-wide management)
├── Admin/               # Branch Admin Panel (Branch-level management)
├── app.js              # Unified server (runs both panels on port 3000)
└── package.json
```

## Features

### Super Admin Panel
- System-wide branch management
- Branch admin creation and management
- Finance overview
- Master settings
- Course management
- Certificate control
- Lead management
- System settings

### Admin Panel (Branch-level)
- Student management
- Attendance tracking (QR/Face/Manual)
- Payment processing
- Course & batch management
- Staff/Teacher management
- Exam & result management
- Certificate generation
- Inquiry management
- Recorded classes
- Comprehensive reporting

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=Jatiya_Yuva_Computer

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=10

# AWS S3 Configuration (optional)
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name

# QR Code Configuration
QR_CODE_SIZE=200

# File Upload
MAX_FILE_SIZE=5242880
```

## Running the Application

### Unified Server (Recommended)
Runs both Super Admin and Admin panels on port 3000:

```bash
# Development
npm run dev

# Production
npm start
```

### Individual Servers
Run Super Admin and Admin panels separately:

```bash
# Super Admin only (port 3000)
npm run dev:superadmin

# Admin Panel only (port 3000)
npm run dev:admin
```

## API Endpoints

### Super Admin API
Base URL: `/api/super-admin`

- Authentication: `/api/super-admin/login`, `/api/super-admin/signup`
- Dashboard: `/api/super-admin/dashboard/*`
- Branches: `/api/super-admin/branches/*`
- Branch Admins: `/api/super-admin/branch-admins/*`
- Finance: `/api/super-admin/finance/*`
- Master Settings: `/api/super-admin/master/*`
- Certificates: `/api/super-admin/certificates/*`
- Leads: `/api/super-admin/leads/*`
- System: `/api/super-admin/system/*`

### Admin Panel API
Base URL: `/api/admin`

- Authentication: `/api/admin/login`
- Dashboard: `/api/admin/dashboard/*`
- Students: `/api/admin/students/*`
- Attendance: `/api/admin/attendance/*`
- Payments: `/api/admin/payments/*`
- Courses: `/api/admin/courses/*`
- Batches: `/api/admin/batches/*`
- Staff: `/api/admin/staff/*`
- Exams: `/api/admin/exams/*`
- Results: `/api/admin/results/*`
- Certificates: `/api/admin/certificates/*`
- Inquiries: `/api/admin/inquiries/*`
- Recorded Classes: `/api/admin/recorded-classes/*`
- Reports: `/api/admin/reports/*`

### Public API
- Certificate Verification: `/api/certificates/verify/:certificateId`

## Health Check

```bash
GET /api/health
```

Returns status of both services.

## Documentation

- Super Admin API: `SuperAdmin/docs/SuperAdmin_Api.md`
- Admin Panel API: `Admin/docs/Admin_API.md`

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing
- QR Code generation
- AWS S3 for file storage
- Multer for file uploads

## Security Features

- JWT-based authentication
- Branch isolation (Admin panel)
- Role-based access control
- Password hashing
- Input validation
- Audit logging
- Error handling

## Port Configuration

**All services run on port 3000 by default.**

The unified server (`app.js`) runs both Super Admin and Admin panels on the same port, making it easy to deploy and manage.

## Development

The project uses:
- Nodemon for auto-reload in development
- Environment-based configuration
- Centralized error handling
- Comprehensive logging

## License

ISC
