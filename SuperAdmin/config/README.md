# Environment Configuration Management

This directory contains the centralized environment configuration system for the Super Admin authentication system.

## Overview

The `env.config.js` file provides a centralized way to manage and validate all environment variables used throughout the application. This ensures:

- ✅ All required variables are present
- ✅ Variables are validated before use
- ✅ Sensitive data is handled securely
- ✅ Better error messages for missing/invalid config
- ✅ Type-safe access to configuration values

## Usage

### Basic Usage

```javascript
const config = require('./config/env.config');

// Access configuration values
const port = config.PORT;
const mongoUri = config.MONGODB_URI;
const jwtSecret = config.JWT_SECRET;
```

### Helper Methods

```javascript
const config = require('./config/env.config');

// Check environment
if (config.isProduction()) {
  // Production-specific code
}

if (config.isDevelopment()) {
  // Development-specific code
}

// Get all config (sensitive data hidden)
const allConfig = config.getAll();

// Get specific value
const value = config.get('PORT');
```

## Environment Variables

### Required Variables

These must be set in your `.env` file:

- **MONGODB_URI** - MongoDB connection string
- **JWT_SECRET** - Secret key for JWT token signing

### Optional Variables (with defaults)

- **NODE_ENV** - Environment mode (default: `development`)
- **PORT** - Server port (default: `3000`)
- **JWT_EXPIRES_IN** - JWT token expiration (default: `7d`)
- **BCRYPT_SALT_ROUNDS** - Bcrypt salt rounds (default: `10`)
- **CORS_ORIGIN** - CORS origin (default: `*`)
- **API_PREFIX** - API route prefix (default: `/api`)
- **LOG_LEVEL** - Logging level (default: `info`)

## Validation

The config system automatically validates:

1. **Required Variables** - Checks that all required variables are present
2. **JWT_SECRET Strength** - Warns if JWT_SECRET is too short in production
3. **Default JWT_SECRET** - Prevents using default secret in production
4. **MongoDB URI Format** - Validates MongoDB connection string format
5. **PORT Range** - Ensures PORT is between 1 and 65535
6. **Bcrypt Salt Rounds** - Warns if salt rounds are outside recommended range

## Error Handling

If validation fails:

- **In Production**: Application exits with error code 1
- **In Development**: Warning is shown, but application continues (some features may not work)

## Security Notes

1. **Never commit `.env` file** to version control
2. **Use strong JWT_SECRET** in production (at least 32 characters)
3. **Generate secure secrets** using:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
4. **Sensitive data is hidden** when using `config.getAll()` method

## Example .env File

See `.env.example` in the SuperAdmin root directory for a complete example with all available options.

## Integration

The config is automatically loaded when the module is required. All files in the application use this centralized config:

- `app.js` - Server and MongoDB configuration
- `utils/jwt.js` - JWT secret and expiration
- `controllers/auth.controller.js` - Bcrypt salt rounds
- `middlewares/auth.middleware.js` - Environment checks

This ensures consistency across the entire application.

