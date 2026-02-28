/**
 * Generate unique Student ID
 * Format: BRANCH_CODE + YEAR + SEQUENCE (e.g., DHK001-2024-001)
 * Also handles: BRANCH-CODE-YEAR-YEAR format (e.g., YUVA-0002-2026-2027)
 */
const generateStudentId = async (branchCode, Student, maxRetries = 10) => {
  const year = new Date().getFullYear();
  const prefix = `${branchCode}-${year}-`;
  
  // Escape special regex characters in prefix
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Find all students with matching prefix to get the highest sequence
  const students = await Student.find({
    studentId: { $regex: `^${escapedPrefix}` },
  })
    .sort({ studentId: -1 })
    .select('studentId')
    .limit(100); // Limit to prevent performance issues
  
  let maxSequence = 0;
  if (students && students.length > 0) {
    // Extract sequence numbers from all matching studentIds
    for (const student of students) {
      if (student.studentId) {
        const parts = student.studentId.split('-');
        // Handle different formats:
        // Format 1: "DHK001-2024-001" -> parts = ["DHK001", "2024", "001"]
        // Format 2: "YUVA-0002-2026-2027" -> parts = ["YUVA", "0002", "2026", "2027"]
        if (parts.length >= 3) {
          // Try to parse the last part as sequence
          const lastPart = parts[parts.length - 1];
          const seq = parseInt(lastPart, 10);
          // If last part is a valid sequence number (3-4 digits), use it
          if (!isNaN(seq) && lastPart.length >= 3 && lastPart.length <= 4) {
            if (seq > maxSequence) {
              maxSequence = seq;
            }
          } else {
            // If last part is not a number, try second-to-last part
            if (parts.length >= 4) {
              const secondLastPart = parts[parts.length - 2];
              const seq2 = parseInt(secondLastPart, 10);
              if (!isNaN(seq2) && secondLastPart.length === 4) {
                // This might be a year, check if last part is also a year
                const lastPartYear = parseInt(lastPart, 10);
                if (!isNaN(lastPartYear) && lastPart.length === 4) {
                  // Both are years, this is a special format - use last part as sequence
                  if (lastPartYear > maxSequence) {
                    maxSequence = lastPartYear;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  // Generate new sequence
  let sequence = maxSequence + 1;
  let studentId = `${prefix}${String(sequence).padStart(3, '0')}`;
  
  // Verify uniqueness with retry logic
  let retries = 0;
  while (retries < maxRetries) {
    const existing = await Student.findOne({ studentId });
    if (!existing) {
      return studentId;
    }
    // If exists, try next sequence
    sequence++;
    studentId = `${prefix}${String(sequence).padStart(3, '0')}`;
    retries++;
  }
  
  // Fallback: use timestamp-based ID if all retries fail
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
};

/**
 * Generate unique Staff ID
 * Format: BRANCH_CODE + ROLE + SEQUENCE (e.g., DHK001-STAFF-001)
 */
const generateStaffId = async (branchCode, role, Staff) => {
  const rolePrefix = role === 'TEACHER' ? 'TCH' : 'STF';
  const prefix = `${branchCode}-${rolePrefix}-`;
  
  const lastStaff = await Staff.findOne({
    staffId: { $regex: `^${prefix}` },
  })
    .sort({ staffId: -1 })
    .select('staffId');
  
  let sequence = 1;
  if (lastStaff && lastStaff.staffId) {
    const lastSeq = parseInt(lastStaff.staffId.split('-')[2] || '0', 10);
    sequence = lastSeq + 1;
  }
  
  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

/**
 * Generate unique Teacher ID
 * Format: BRANCH_CODE + TCH + SEQUENCE (e.g., DHK001-TCH-001)
 */
const generateTeacherId = async (branchCode, Teacher, maxRetries = 10) => {
  const prefix = `${branchCode}-TCH-`;
  
  // Escape special regex characters in prefix
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Find all teachers with matching prefix to get the highest sequence
  const teachers = await Teacher.find({
    teacherId: { $regex: `^${escapedPrefix}` },
  })
    .sort({ teacherId: -1 })
    .select('teacherId')
    .limit(100); // Limit to prevent performance issues
  
  let maxSequence = 0;
  if (teachers && teachers.length > 0) {
    // Extract sequence numbers from all matching teacherIds
    for (const teacher of teachers) {
      if (teacher.teacherId) {
        const parts = teacher.teacherId.split('-');
        // Look for the sequence number (should be the last numeric part after "TCH")
        // Handle formats like: "YUVA-0002-TCH-001" or "DHK001-TCH-001"
        for (let i = parts.length - 1; i >= 0; i--) {
          const part = parts[i];
          // Check if this part comes after "TCH" or is the last part
          if (i > 0 && parts[i - 1] === 'TCH') {
            const seq = parseInt(part, 10);
            if (!isNaN(seq) && seq > maxSequence) {
              maxSequence = seq;
            }
            break;
          } else if (i === parts.length - 1) {
            // Last part - try to parse as sequence
            const seq = parseInt(part, 10);
            if (!isNaN(seq) && seq > maxSequence) {
              maxSequence = seq;
            }
          }
        }
      }
    }
  }
  
  // Generate new sequence
  let sequence = maxSequence + 1;
  let teacherId = `${prefix}${String(sequence).padStart(3, '0')}`;
  
  // Verify uniqueness with retry logic
  let retries = 0;
  while (retries < maxRetries) {
    const existing = await Teacher.findOne({ teacherId });
    if (!existing) {
      return teacherId;
    }
    // If exists, try next sequence
    sequence++;
    teacherId = `${prefix}${String(sequence).padStart(3, '0')}`;
    retries++;
  }
  
  // Fallback: use timestamp-based ID if all retries fail
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
};

/**
 * Generate unique Receipt Number
 * Format: BRANCH_CODE + YEAR + MONTH + SEQUENCE
 */
const generateReceiptNumber = async (branchCode, Payment) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${branchCode}-${year}${month}-`;
  
  const lastPayment = await Payment.findOne({
    receiptNumber: { $regex: `^${prefix}` },
  })
    .sort({ receiptNumber: -1 })
    .select('receiptNumber');
  
  let sequence = 1;
  if (lastPayment && lastPayment.receiptNumber) {
    const parts = lastPayment.receiptNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1] || '0', 10);
    sequence = lastSeq + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

/**
 * Generate unique Certificate ID
 * Format: CERT + YEAR + SEQUENCE
 */
const generateCertificateId = async (Certificate) => {
  const year = new Date().getFullYear();
  const prefix = `CERT-${year}-`;
  
  const lastCert = await Certificate.findOne({
    certificateId: { $regex: `^${prefix}` },
  })
    .sort({ certificateId: -1 })
    .select('certificateId');
  
  let sequence = 1;
  if (lastCert && lastCert.certificateId) {
    const lastSeq = parseInt(lastCert.certificateId.split('-')[2] || '0', 10);
    sequence = lastSeq + 1;
  }
  
  return `${prefix}${String(sequence).padStart(6, '0')}`;
};

module.exports = {
  generateStudentId,
  generateStaffId,
  generateTeacherId,
  generateReceiptNumber,
  generateCertificateId,
};
