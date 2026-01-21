# Super Admin Authentication System

A secure Super Admin authentication system built with Node.js, Express, MongoDB, and JWT.

## Features

- ✅ Super Admin Signup
- ✅ Super Admin Login
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Account status checking
- ✅ Secure token generation

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- bcrypt
- jsonwebtoken
- dotenv

## Installation

1. Install dependencies:
```bash
npm install express mongoose bcrypt jsonwebtoken dotenv
```

2. Create a `.env` file in the SuperAdmin folder (use `.env.example` as reference):
```env
MONGODB_URI=mongodb://localhost:27017/superadmin_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=3000
NODE_ENV=development
```

3. Start the server:
```bash
node app.js
```

Or with nodemon:
```bash
nodemon app.js
```

## API Endpoints

### 1. Super Admin Signup

**Endpoint:** `POST /api/super-admin/signup`

**Request Body:**
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

**Error Responses:**
- `400` - Missing required fields
- `409` - Email already exists
- `500` - Server error

### 2. Super Admin Login

**Endpoint:** `POST /api/auth/super-admin/login`

**Request Body:**
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

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `403` - Account disabled
- `500` - Server error

## Project Structure

```
SuperAdmin/
├── models/
│   └── superAdmin.model.js      # SuperAdmin Mongoose model
├── controllers/
│   └── auth.controller.js       # Signup and login controllers
├── routes/
│   └── auth.routes.js           # Authentication routes
├── middlewares/
│   └── auth.middleware.js       # JWT authentication middleware
├── utils/
│   └── jwt.js                   # JWT utility functions
├── app.js                       # Express application setup
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## Database Model

**Collection:** `SuperAdmin`

**Fields:**
- `_id` (ObjectId)
- `name` (string, required)
- `email` (string, required, unique)
- `password` (string, required, bcrypt hashed)
- `role` (string, default: "SUPER_ADMIN")
- `isActive` (boolean, default: true)
- `createdAt` (Date, auto-generated)
- `updatedAt` (Date, auto-generated)

## Security Features

- ✅ Passwords are hashed using bcrypt (10 salt rounds)
- ✅ Passwords are never returned in API responses
- ✅ JWT tokens expire after 7 days
- ✅ Account status validation
- ✅ Input validation
- ✅ Error handling with proper HTTP status codes

## Using the Authentication Middleware

To protect routes, use the `authenticateSuperAdmin` middleware:

```javascript
const { authenticateSuperAdmin } = require('./middlewares/auth.middleware');

// Protected route
router.get('/protected', authenticateSuperAdmin, (req, res) => {
  // req.user contains: { id, email, role }
  res.json({ message: 'Access granted', user: req.user });
});
```

**Authorization Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

## Notes

- Make sure to set a strong `JWT_SECRET` in production
- Never commit `.env` file to version control
- The password field is automatically excluded from JSON responses
- All timestamps are automatically managed by Mongoose

