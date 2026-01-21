const path = require('path');
const https = require('https');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const config = require('../config/env.config');

let s3;
let storage;
let s3Initialized = false;
let clockSkewDetected = false;
let lastClockCheck = null;

// Check system clock sync with AWS (simple HTTP request to AWS time service)
const checkClockSync = async () => {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 's3.amazonaws.com',
      path: '/',
      method: 'HEAD',
      timeout: 5000,
    }, (res) => {
      const serverDate = new Date(res.headers.date);
      const localDate = new Date();
      const diffMs = Math.abs(localDate.getTime() - serverDate.getTime());
      const diffMinutes = diffMs / (1000 * 60);
      
      resolve({
        synced: diffMinutes <= 15, // AWS allows 15 minutes max
        diffMinutes: diffMinutes.toFixed(2),
        localTime: localDate.toISOString(),
        serverTime: serverDate.toISOString(),
        diffMs,
      });
    });

    req.on('error', () => {
      // If check fails, assume clock might be OK (don't block uploads)
      resolve({ synced: true, checkFailed: true });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ synced: true, checkFailed: true });
    });

    req.end();
  });
};

// Validate S3 configuration
const validateS3Config = () => {
  const missing = [];
  if (!config.AWS_REGION) missing.push('AWS_REGION');
  if (!config.AWS_ACCESS_KEY_ID) missing.push('AWS_ACCESS_KEY_ID');
  if (!config.AWS_SECRET_ACCESS_KEY) missing.push('AWS_SECRET_ACCESS_KEY');
  if (!config.AWS_S3_BUCKET) missing.push('AWS_S3_BUCKET');
  return missing;
};

// Initialize S3 - REQUIRED, no fallback
const initializeStorage = () => {
  if (s3Initialized) {
    return;
  }

  s3Initialized = true;

  // Check if S3 config is available
  const missingS3Config = validateS3Config();
  if (missingS3Config.length > 0) {
    const error = new Error(`Missing required S3 configuration: ${missingS3Config.join(', ')}. S3 is required for file uploads.`);
    console.error(`❌ ${error.message}`);
    throw error;
  }

  // Initialize S3 Client
  s3 = new S3Client({
    region: config.AWS_REGION,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
    maxAttempts: 3,
  });

  // Configure S3 storage for multer
  storage = multerS3({
    s3,
    bucket: config.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const safeName = `${file.fieldname}-${timestamp}-${random}${ext}`;
      cb(null, `courses/${safeName}`);
    },
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      });
    },
  });

  console.log('✅ AWS S3 configured successfully for file uploads');
  console.log(`📦 S3 Bucket: ${config.AWS_S3_BUCKET}`);
  console.log(`🌍 S3 Region: ${config.AWS_REGION}`);
};

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image') {
    const ok = ['.jpg', '.jpeg', '.png', '.webp'].includes(
      path.extname(file.originalname).toLowerCase()
    );
    return cb(ok ? null : new Error('Invalid image type'), ok);
  }
  if (file.fieldname === 'pdf') {
    const ok = path.extname(file.originalname).toLowerCase() === '.pdf';
    return cb(ok ? null : new Error('Invalid pdf type'), ok);
  }
  return cb(new Error('Invalid file field'), false);
};

// Create multer instance with automatic fallback
const getMulterInstance = () => {
  // Initialize storage (S3 or local) only when needed
  if (!s3Initialized) {
    initializeStorage();
  }
  
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: config.MAX_FILE_SIZE || 5 * 1024 * 1024 }, // 5MB default
  });
};

const uploadCourseFiles = (req, res, next) => {
  // Allow bypassing clock check via environment variable (for testing only)
  // WARNING: AWS will still reject requests if clock is off, this just skips our pre-check
  const skipClockCheck = process.env.SKIP_CLOCK_CHECK === 'true' || config.SKIP_CLOCK_CHECK === true;
  
  // Pre-check clock sync before attempting upload (cache result for 5 minutes)
  const now = Date.now();
  const checkClock = async () => {
    // Skip check if disabled via env var
    if (skipClockCheck) {
      console.warn('⚠️  Clock check is disabled via SKIP_CLOCK_CHECK. AWS may still reject requests if clock is out of sync.');
      clockSkewDetected = false;
    } else if (!lastClockCheck || (now - lastClockCheck) > 5 * 60 * 1000) {
      const clockCheck = await checkClockSync();
      lastClockCheck = Date.now();
      
      if (!clockCheck.synced && !clockCheck.checkFailed) {
        clockSkewDetected = true;
        return res.status(400).json({
          success: false,
          message: 'System clock is out of sync with AWS servers. Please sync your system time before uploading files.',
          error: 'ClockSkewDetected',
          details: {
            localTime: clockCheck.localTime,
            awsTime: clockCheck.serverTime,
            difference: `${clockCheck.diffMinutes} minutes (max allowed: 15 minutes)`,
          },
          fix: {
            windows: [
              '1. Open Command Prompt as Administrator',
              '2. Run: w32tm /resync',
              '3. Verify: w32tm /query /status',
              '4. Or: Settings → Date & Time → Sync now',
              '5. Restart your Node.js server after syncing',
            ],
            linux: [
              'Run: sudo ntpdate -s time.nist.gov',
              'Or: sudo timedatectl set-ntp true',
              'Verify: timedatectl status',
              'Restart your Node.js server after syncing',
            ],
            mac: [
              'Run: sudo sntp -sS time.apple.com',
              'Verify: sntp time.apple.com',
              'Restart your Node.js server after syncing',
            ],
          },
          note: 'AWS S3 requires accurate system time for security. Your clock must be within 15 minutes of AWS server time.',
          s3Required: true,
          temporaryWorkaround: 'To bypass this check temporarily (AWS will still reject), set SKIP_CLOCK_CHECK=true in your .env file. This is NOT recommended for production.',
        });
      }
      clockSkewDetected = false;
    } else if (clockSkewDetected && !skipClockCheck) {
      // If we previously detected clock skew, return error immediately
      return res.status(400).json({
        success: false,
        message: 'System clock is out of sync. Please sync your clock and restart the server.',
        error: 'ClockSkewDetected',
        fix: 'Sync your system clock and restart the server. See previous error for detailed instructions.',
        temporaryWorkaround: 'To bypass this check temporarily, set SKIP_CLOCK_CHECK=true in your .env file. WARNING: AWS will still reject the request.',
      });
    }
    
    // Clock is OK, proceed with upload
    const multerInstance = getMulterInstance();
    multerInstance.fields([
      { name: 'image', maxCount: 1 },
      { name: 'pdf', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return handleS3UploadError(err, req, res, next);
      }
      
      // Ensure S3 URLs are in the correct format
      // Format: https://bucket-name.s3.region.amazonaws.com/courses/filename
      if (req.files) {
        Object.keys(req.files).forEach((fieldname) => {
          req.files[fieldname].forEach((file) => {
            if (file.location) {
              // If location is already an S3 URL, ensure it's in the correct format
              // multer-s3 should already provide the correct URL, but let's verify
              if (!file.location.startsWith('http')) {
                // If it's not a full URL, construct it
                file.location = `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${file.key || file.location.replace(/^\//, '')}`;
              }
            }
          });
        });
      }
      
      next();
    });
  };
  
  // Run clock check (async, but we handle it)
  checkClock().catch(() => {
    // If clock check fails, proceed anyway (don't block uploads)
    const multerInstance = getMulterInstance();
    multerInstance.fields([
      { name: 'image', maxCount: 1 },
      { name: 'pdf', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return handleS3UploadError(err, req, res, next);
      }
      
      if (req.files) {
        Object.keys(req.files).forEach((fieldname) => {
          req.files[fieldname].forEach((file) => {
            if (file.location && !file.location.startsWith('http')) {
              file.location = `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${file.key || file.location.replace(/^\//, '')}`;
            }
          });
        });
      }
      
      next();
    });
  });
};

// Error handling middleware for S3 upload errors
const handleS3UploadError = (err, req, res, next) => {
  if (err) {
    console.error('S3 Upload Error:', err);
    
    // Extract error code from nested structure (AWS SDK v3)
    const errorCode = err.code || err.Code || (err.storageErrors?.[0]?.Code) || (err.storageErrors?.[0]?.code);
    const errorMessage = err.message || err.Message || (err.storageErrors?.[0]?.message) || (err.storageErrors?.[0]?.Message);
    
    // Handle RequestTimeTooSkewed - system clock out of sync
    if (errorCode === 'RequestTimeTooSkewed' || errorMessage?.includes('RequestTimeTooSkewed')) {
      // Extract time information from error if available
      const requestTime = err.RequestTime || err.requestTime;
      const serverTime = err.ServerTime || err.serverTime;
      
      clockSkewDetected = true; // Mark for future requests
      
      return res.status(400).json({
        success: false,
        message: 'System clock is out of sync with AWS servers. Files must be uploaded to S3. Please sync your system time immediately.',
        error: 'RequestTimeTooSkewed',
        details: {
          message: 'The difference between your system time and AWS server time is too large (max 15 minutes).',
          requestTime: requestTime || 'Not available',
          serverTime: serverTime || 'Not available',
          maxAllowedSkew: '15 minutes (900000 milliseconds)',
        },
        fix: {
          windows: [
            '1. Open Command Prompt as Administrator',
            '2. Run: w32tm /resync',
            '3. Verify sync: w32tm /query /status',
            '4. Alternative: Settings → Date & Time → Sync now',
            '5. IMPORTANT: Restart your Node.js server after syncing',
          ],
          linux: [
            'Run: sudo ntpdate -s time.nist.gov',
            'Or: sudo timedatectl set-ntp true',
            'Verify: timedatectl status',
            'IMPORTANT: Restart your Node.js server after syncing',
          ],
          mac: [
            'Run: sudo sntp -sS time.apple.com',
            'Verify: sntp time.apple.com',
            'IMPORTANT: Restart your Node.js server after syncing',
          ],
        },
        note: 'AWS S3 requires accurate system time for security. After syncing, you MUST restart the server for changes to take effect.',
        s3Required: true,
        actionRequired: 'SYNC_CLOCK_AND_RESTART_SERVER',
      });
    }
    
    // Handle AccessDenied - IAM permissions issue
    if (errorCode === 'AccessDenied' || errorCode === 'Forbidden' || errorMessage?.includes('AccessDenied') || errorMessage?.includes('not authorized')) {
      const isDeleteError = errorMessage?.includes('s3:DeleteObject');
      
      return res.status(403).json({
        success: false,
        message: isDeleteError 
          ? 'AWS S3 delete permission not available (this is OK for uploads)' 
          : 'AWS S3 access denied. Please check IAM user permissions.',
        error: 'AccessDenied',
        details: errorMessage || 'The AWS IAM user needs proper S3 permissions.',
        requiredPermissions: [
          's3:PutObject - Required to upload files',
          's3:GetObject - Required to read files',
        ],
        note: isDeleteError 
          ? 'The s3:DeleteObject error can be safely ignored. Only PutObject and GetObject are needed for file uploads. If you need to delete files, add s3:DeleteObject permission to your IAM policy.'
          : 'Please ensure your IAM user has s3:PutObject and s3:GetObject permissions for the bucket.',
        seeDocumentation: 'Check SuperAdmin/docs/S3_SETUP.md for IAM policy examples',
      });
    }
    
    // Handle NoSuchBucket
    if (errorCode === 'NoSuchBucket' || errorMessage?.includes('NoSuchBucket')) {
      return res.status(404).json({
        success: false,
        message: 'AWS S3 bucket not found. Please check bucket name.',
        error: 'NoSuchBucket',
        bucket: config.AWS_S3_BUCKET,
      });
    }
    
    // Handle InvalidAccessKeyId
    if (errorCode === 'InvalidAccessKeyId' || errorMessage?.includes('InvalidAccessKeyId')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid AWS Access Key ID. Please check your credentials.',
        error: 'InvalidAccessKeyId',
      });
    }
    
    // Generic S3 error
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file to AWS S3',
      error: errorCode || 'S3UploadError',
      details: config.isDevelopment() ? errorMessage : 'An error occurred while uploading the file. Please check your S3 configuration.',
    });
  }
  next();
};

module.exports = {
  uploadCourseFiles,
  handleS3UploadError,
};

