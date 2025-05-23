import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(__dirname, '../../uploads/qrcodes');

/**
 * Generates a QR code for payment information
 * @param data QR code content data (bank account, amount, reference)
 * @returns Promise with the URL of the stored QR code
 */
export const generatePaymentQRCode = async (data: {
  accountNumber: string;
  accountName: string;
  bankName: string;
  amount: number;
  reference: string;
}): Promise<string> => {
  try {
    // Ensure the directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Create a unique filename
    const filename = `payment-${data.reference}-${Date.now()}.png`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Construct the QR code content in a format that banking apps can recognize
    const qrContent = [
      `Tài khoản: ${data.accountNumber}`,
      `Tên: ${data.accountName}`,
      `Ngân hàng: ${data.bankName}`,
      `Số tiền: ${data.amount}`,
      `Nội dung: ${data.reference}`
    ].join('\n');

    // Generate and save the QR code
    await QRCode.toFile(filePath, qrContent, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400
    });

    // Return the relative URL
    return `/uploads/qrcodes/${filename}`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Không thể tạo mã QR thanh toán');
  }
};

/**
 * Creates a data URL for a QR code (useful for direct embedding)
 */
export const generateQRDataURL = async (content: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(content, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300
    });
  } catch (error) {
    console.error('Error generating QR data URL:', error);
    throw new Error('Không thể tạo mã QR thanh toán');
  }
};
