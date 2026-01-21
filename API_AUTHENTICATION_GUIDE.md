# API Authentication Guide

## How to Get and Use JWT Token for SuperAdmin API

### Step 1: Login to Get JWT Token

**Endpoint:** `POST /api/super-admin/login`

**Request:**
```bash
curl -X POST http://localhost:3000/api/super-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

**Or using Postman/Thunder Client:**
- Method: `POST`
- URL: `http://localhost:3000/api/super-admin/login`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "SUPER_ADMIN"
}
```

### Step 2: Use the Token in Protected Endpoints

**Copy the `jwt_token` from the login response and use it in the Authorization header.**

**Example: Access Dashboard Summary**

```bash
curl -X GET http://localhost:3000/api/super-admin/dashboard/summary \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Or using Postman/Thunder Client:**
- Method: `GET`
- URL: `http://localhost:3000/api/super-admin/dashboard/summary`
- Headers:
  - `Authorization: Bearer <your_jwt_token>`
  - OR use Postman's "Authorization" tab → Type: "Bearer Token" → Paste token

## Complete Example Workflow

### 1. First Time Setup (Create SuperAdmin Account)

If you don't have an account yet:

```bash
curl -X POST http://localhost:3000/api/super-admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "System Owner",
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

### 2. Login to Get Token

```bash
curl -X POST http://localhost:3000/api/super-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

**Save the `jwt_token` from the response!**

### 3. Use Token in API Calls

```bash
# Replace YOUR_TOKEN_HERE with the actual token from step 2
curl -X GET http://localhost:3000/api/super-admin/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Using JavaScript/Fetch

```javascript
// Step 1: Login
const loginResponse = await fetch('http://localhost:3000/api/super-admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'your_password'
  })
});

const loginData = await loginResponse.json();
const token = loginData.jwt_token;

// Step 2: Use token in protected endpoint
const dashboardResponse = await fetch('http://localhost:3000/api/super-admin/dashboard/summary', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const dashboardData = await dashboardResponse.json();
console.log(dashboardData);
```

## Using Postman Collection

1. **Create Login Request:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/super-admin/login`
   - Body → raw → JSON:
   ```json
   {
     "email": "admin@example.com",
     "password": "your_password"
   }
   ```
   - Send request
   - Copy the `jwt_token` from response

2. **Create Dashboard Request:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/super-admin/dashboard/summary`
   - Authorization → Type: `Bearer Token`
   - Token: Paste the `jwt_token` from step 1
   - Send request

## Important Notes

1. **Token Format:** Always use `Bearer <token>` in the Authorization header
2. **Token Expiry:** Tokens expire after the time set in `JWT_EXPIRES_IN` (default: 30 days)
3. **Development Mode:** In development, if you login with a non-existent email, the system will auto-create the account
4. **Token Storage:** Store the token securely (localStorage, sessionStorage, or secure cookie)

## Troubleshooting

### Error: "Invalid or expired token"
- Check if token is correctly formatted: `Bearer <token>` (with space)
- Token might have expired - login again to get a new token
- Make sure you're using the token from SuperAdmin login, not from other modules

### Error: "No token provided"
- Make sure you're sending the Authorization header
- Format must be: `Authorization: Bearer <token>`

### Error: "Invalid credentials"
- Check email and password are correct
- In development mode, the system will auto-create account if email doesn't exist

## Quick Test Script

Save this as `test-auth.sh`:

```bash
#!/bin/bash

# Step 1: Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/super-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token (requires jq: brew install jq or apt-get install jq)
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.jwt_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to get token. Check login credentials."
  exit 1
fi

echo "Token: $TOKEN"
echo ""

# Step 2: Use token
echo "Accessing dashboard..."
curl -X GET http://localhost:3000/api/super-admin/dashboard/summary \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
```

Run: `chmod +x test-auth.sh && ./test-auth.sh`

