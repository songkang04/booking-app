import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();

async function testSMTPConnection() {
  console.log('Kiểm tra cấu hình SMTP...');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Đã cấu hình' : '✗ Chưa cấu hình');
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Đã cấu hình' : '✗ Chưa cấu hình');

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    console.log('\nĐang kiểm tra kết nối...');
    await transporter.verify();
    console.log('✅ Kết nối SMTP thành công!');

    // Gửi email test
    console.log('\nĐang gửi email test...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Gửi cho chính mình để test
      subject: 'Test SMTP Connection',
      text: 'Nếu bạn nhận được email này, cấu hình SMTP đã hoạt động!',
      html: '<b>Nếu bạn nhận được email này, cấu hình SMTP đã hoạt động!</b>'
    });

    console.log('✅ Gửi email test thành công!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
}

testSMTPConnection();
