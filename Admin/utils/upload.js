const path = require('path');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const config = require('../config/env.config');

let s3;
let storage;

// Initialize S3 if credentials are available
if (config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY) {
  try {
    s3 = new S3Client({
      region: config.AWS_REGION,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      },
    });

    storage = multerS3({
      s3,
      bucket: config.AWS_S3_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        let folder = 'files';
        if (file.fieldname === 'image' || file.fieldname === 'thumbnail') folder = 'images';
        else if (file.fieldname === 'pdf') folder = 'pdfs';
        else if (file.fieldname === 'video') folder = 'videos';
        else if (['studentPhoto', 'studentSignature', 'officeSignature', 'formScanImage'].includes(file.fieldname)) {
          folder = `students/${file.fieldname}`;
        }
        else if (file.fieldname === 'teacherImage') {
          folder = 'teachers';
        }
        else if (file.fieldname === 'staffImage') {
          folder = 'staff';
        }
        const safeName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, safeName);
      },
      // Handle S3 errors gracefully
      acl: 'private', // Set ACL to private to avoid permission issues
    });
  } catch (error) {
    console.warn('S3 initialization failed, using local storage:', error.message);
  }
}

// Fallback to local storage if S3 is not available
if (!storage) {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath = path.join(__dirname, '../uploads');
      // Create subfolder for student files
      if (['studentPhoto', 'studentSignature', 'officeSignature', 'formScanImage'].includes(file.fieldname)) {
        uploadPath = path.join(uploadPath, 'students', file.fieldname);
      }
      // Create subfolder for teacher files
      else if (file.fieldname === 'teacherImage') {
        uploadPath = path.join(uploadPath, 'teachers');
      }
      // Create subfolder for staff files
      else if (file.fieldname === 'staffImage') {
        uploadPath = path.join(uploadPath, 'staff');
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'image' || file.fieldname === 'thumbnail' || file.fieldname === 'teacherImage' || file.fieldname === 'staffImage') {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    return cb(allowed.includes(ext) ? null : new Error(`Invalid ${file.fieldname} type. Allowed: ${allowed.join(', ')}`), allowed.includes(ext));
  }
  
  if (file.fieldname === 'pdf') {
    return cb(ext === '.pdf' ? null : new Error('Invalid PDF type. Only .pdf files are allowed'), ext === '.pdf');
  }
  
  if (file.fieldname === 'video') {
    const allowed = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
    return cb(allowed.includes(ext) ? null : new Error(`Invalid video type. Allowed: ${allowed.join(', ')}`), allowed.includes(ext));
  }
  
  return cb(new Error(`Invalid file field: ${file.fieldname}. Expected: image, pdf, video, or thumbnail`), false);
};

const uploadFormImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.MAX_FILE_SIZE },
}).single('formImage');

const uploadCourseFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.MAX_FILE_SIZE },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
]);

const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.MAX_FILE_SIZE * 10 }, // 50MB for videos
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// Student file uploads (photo, signatures, form scan)
const uploadStudentFiles = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const isValid = allowed.includes(ext);
    return cb(isValid ? null : new Error(`Invalid file type for ${file.fieldname}. Allowed: ${allowed.join(', ')}`), isValid);
  },
  limits: { fileSize: config.MAX_FILE_SIZE },
}).fields([
  { name: 'studentPhoto', maxCount: 1 },
  { name: 'studentSignature', maxCount: 1 },
  { name: 'officeSignature', maxCount: 1 },
  { name: 'formScanImage', maxCount: 1 },
]);

// Teacher image upload
const uploadTeacherImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.MAX_FILE_SIZE },
}).single('teacherImage');

// Staff image upload
const uploadStaffImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.MAX_FILE_SIZE },
}).single('staffImage');

module.exports = {
  uploadFormImage,
  uploadCourseFiles,
  uploadVideo,
  uploadStudentFiles,
  uploadTeacherImage,
  uploadStaffImage,
};
