# JWT Token Debugging Guide

## Common Issue: "Invalid or expired token"

This error usually occurs due to one of these reasons:

### 1. JWT_SECRET Mismatch
The token was signed with one JWT_SECRET but verified with a different one.

**Solution:**
- Ensure you have a single `.env` file in the **root directory**
- Make sure `JWT_SECRET` is set correctly
- Restart the server after changing JWT_SECRET
- Generate a new token after restarting

### 2. Token Expired
The token has passed its expiration time.

**Solution:**
- Login again to get a fresh token
- Check `JWT_EXPIRES_IN` in your `.env` file (default: 30d)

### 3. Wrong Token Format
The token is not being sent correctly in the Authorization header.

**Solution:**
- Use format: `Authorization: Bearer <token>`
- Make sure there's a space after "Bearer"
- Don't include quotes around the token

## Debugging Steps

### Step 1: Check Your .env File

Make sure you have a `.env` file in the **root directory** with:

```env
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=30d
```

### Step 2: Verify JWT_SECRET is Consistent

1. **Restart your server** after setting/changing JWT_SECRET
2. **Login again** to get a new token (old tokens won't work with new secret)
3. **Use the new token** immediately

### Step 3: Test Token Generation and Verification

1. Login to get a token:
```bash
POST http://localhost:3000/api/super-admin/login
Body: {"email": "admin@test.com", "password": "test123"}
```

2. Copy the `jwt_token` from response

3. Use it immediately:
```bash
GET http://localhost:3000/api/super-admin/dashboard/summary
Header: Authorization: Bearer <your_token>
```

### Step 4: Check Server Logs

With the improved error handling, you'll now see more detailed error messages in development mode:

- `Invalid token: invalid signature` - JWT_SECRET mismatch
- `Token expired at: ...` - Token has expired
- `Token payload is missing required fields` - Token structure issue

## Quick Fix

1. **Stop your server**
2. **Check/Update `.env` file in root:**
   ```env
   JWT_SECRET=your_consistent_secret_key_here
   JWT_EXPIRES_IN=30d
   ```
3. **Start server again**
4. **Login to get NEW token**
5. **Use the NEW token immediately**

## Testing with cURL

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/super-admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test123"}' \
  | grep -o '"jwt_token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 2. Use token (immediately, before it expires)
curl -X GET http://localhost:3000/api/super-admin/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"
```

## Important Notes

- **Never change JWT_SECRET** without regenerating all tokens
- **Always restart server** after changing JWT_SECRET
- **Tokens become invalid** when JWT_SECRET changes
- **Use the same .env file** for both token generation and verification

