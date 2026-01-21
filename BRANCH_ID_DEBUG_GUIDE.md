# Branch ID Error Debugging Guide

## Error: "Branch not found"

This error occurs when the system cannot find a branch with the provided `branchId`. Here's how to fix it:

## Step 1: Verify Authentication

The API requires a valid JWT token with `branchId` in the payload.

### 1.1 Login as Admin

```bash
POST http://localhost:3000/api/admin/login
Content-Type: application/json

{
  "email": "admin@branch.com",
  "password": "your_password"
}
```

**Response should include:**
```json
{
  "success": true,
  "jwt_token": "...",
  "role": "ADMIN",
  "branchId": "<BRANCH_ID>"
}
```

### 1.2 Check Token Payload

Decode your JWT token at https://jwt.io and verify it contains:
```json
{
  "userId": "...",
  "role": "ADMIN",
  "branchId": "<BRANCH_ID>"
}
```

## Step 2: Verify Branch Exists

### 2.1 Check if Branch Exists (SuperAdmin)

```bash
GET http://localhost:3000/api/super-admin/branches
Authorization: Bearer <SUPER_ADMIN_TOKEN>
```

Look for the branch ID that matches your admin's `branchId`.

### 2.2 Verify Branch is Not Deleted

The branch must have `isDeleted: false` in the database.

### 2.3 Verify Branch is Not Locked

The branch must have `status: "ACTIVE"` (not `"LOCKED"`).

## Step 3: Verify Admin User Has BranchId

### 3.1 Check Admin User Record

The admin user in the `User` collection must have:
- `role: "ADMIN"`
- `branchId: <VALID_BRANCH_ID>`
- `isActive: true`

### 3.2 Create/Update Admin with BranchId

If admin doesn't have branchId, create/update via SuperAdmin:

```bash
POST http://localhost:3000/api/super-admin/branch-admins
Authorization: Bearer <SUPER_ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "Branch Admin",
  "email": "admin@branch.com",
  "password": "123456",
  "branchId": "<VALID_BRANCH_ID>"
}
```

## Step 4: Test the API

### 4.1 Use Correct Headers

```bash
POST http://localhost:3000/api/admin/students/manual
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json

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
  }
}
```

## Common Issues and Solutions

### Issue 1: "Branch ID is required"
**Cause:** JWT token doesn't have branchId or user is not authenticated.

**Solution:**
1. Login again to get a fresh token
2. Verify the admin user has a branchId assigned
3. Check that `enforceBranchIsolation` middleware is running

### Issue 2: "Branch not found"
**Cause:** The branchId in the token doesn't exist in the database.

**Solution:**
1. Verify branch exists: `GET /api/super-admin/branches`
2. Check branch ID matches exactly
3. Ensure branch is not deleted (`isDeleted: false`)
4. Ensure branch is active (`status: "ACTIVE"`)

### Issue 3: "Invalid branchId format"
**Cause:** branchId is not a valid MongoDB ObjectId.

**Solution:**
1. Verify branchId is a 24-character hex string
2. Check format: `507f1f77bcf86cd799439011`

## Quick Test Script

```bash
# 1. Login as Admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@branch.com","password":"password"}' \
  | grep -o '"jwt_token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 2. Create Student
curl -X POST http://localhost:3000/api/admin/students/manual \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "admission": {
      "admission_date": "2026-01-13",
      "course": {"code": "DCA", "type": "Certificate"}
    },
    "student": {
      "name": "Test Student",
      "date_of_birth": "1998-12-09",
      "gender": "Female"
    },
    "contact_details": {
      "mobile": "7431995431"
    },
    "address": {
      "village": "Test",
      "district": "Test",
      "state": "Test",
      "pincode": "123456"
    },
    "education": {},
    "office_use": {}
  }'
```

## Debug Mode

In development mode, the error response includes debug information:

```json
{
  "success": false,
  "message": "Branch not found...",
  "debug": {
    "branchId": "...",
    "branchIdType": "string",
    "isValidObjectId": true
  }
}
```

Use this to identify the exact issue.

