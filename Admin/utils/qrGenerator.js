const QRCode = require('qrcode');
const config = require('../config/env.config');

/**
 * Generate QR Code as data URL
 * @param {String} data - Data to encode in QR code
 * @returns {Promise<String>} Data URL of QR code image
 */
const generateQRCode = async (data) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: config.QR_CODE_SIZE,
      margin: 2,
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR Code as buffer (for file upload)
 * @param {String} data - Data to encode in QR code
 * @returns {Promise<Buffer>} Buffer of QR code image
 */
const generateQRCodeBuffer = async (data) => {
  try {
    const qrBuffer = await QRCode.toBuffer(data, {
      width: config.QR_CODE_SIZE,
      margin: 2,
    });
    return qrBuffer;
  } catch (error) {
    console.error('QR Code buffer generation error:', error);
    throw new Error('Failed to generate QR code buffer');
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeBuffer,
};
