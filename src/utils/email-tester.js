// Tệp này được sử dụng để kiểm tra cấu hình và kết nối email
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('Bắt đầu kiểm tra cấu hình email...');
  console.log('=================================================');

  // 1. Kiểm tra các biến môi trường
  console.log('Kiểm tra biến môi trường:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '(được đặt)' : '(không được đặt)');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('=================================================');

  // 2. Kiểm tra kết nối SMTP
  console.log('Kiểm tra kết nối SMTP:');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    const verifyResult = await transporter.verify();
    console.log('Kết nối SMTP thành công:', verifyResult);
  } catch (error) {
    console.error('Lỗi kết nối SMTP:', error);
    return;
  }

  console.log('=================================================');

  // 3. Thử gửi email kiểm tra
  const testEmail = process.env.EMAIL_USER; // Tự gửi cho chính mình

  console.log(`Thử gửi email đến ${testEmail}`);

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: testEmail,
      subject: 'Kiểm tra hệ thống email',
      html: `
        <div>
          <h1>Đây là email kiểm tra</h1>
          <p>Hệ thống email của bạn đã được cấu hình đúng!</p>
          <p>Thời gian gửi: ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Gửi email thành công:', result);
  } catch (error) {
    console.error('Lỗi gửi email:', error);
  }

  console.log('=================================================');
  console.log('Hoàn thành kiểm tra!');
}

// Chạy kiểm tra
testEmailConfig().catch(console.error);
