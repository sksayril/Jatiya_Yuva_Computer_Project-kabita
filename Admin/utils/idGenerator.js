/**
 * Generate unique Student ID
 * Format: BRANCH_CODE + YEAR + SEQUENCE (e.g., DHK001-2024-001)
 */
const generateStudentId = async (branchCode, Student) => {
  const year = new Date().getFullYear();
  const prefix = `${branchCode}-${year}-`;
  
  const lastStudent = await Student.findOne({
    studentId: { $regex: `^${prefix}` },
  })
    .sort({ studentId: -1 })
    .select('studentId');
  
  let sequence = 1;
  if (lastStudent && lastStudent.studentId) {
    const lastSeq = parseInt(lastStudent.studentId.split('-')[2] || '0', 10);
    sequence = lastSeq + 1;
  }
  
  return `${prefix}${String(sequence).padStart(3, '0')}`;
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
  generateReceiptNumber,
  generateCertificateId,
};
