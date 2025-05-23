// Kiểm tra triển khai gửi email đầy đủ
require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function testFullEmailFlow() {
  console.log('Bắt đầu kiểm tra luồng email đầy đủ...');
  console.log('=================================================');

  // 1. Cấu hình và kiểm tra kết nối
  console.log('Cấu hình email:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('EMAIL_PASSWORD (độ dài):', process.env.EMAIL_PASSWORD?.length);
  console.log('=================================================');

  // Thiết lập transporter
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
    console.log('Kiểm tra kết nối SMTP...');
    await transporter.verify();
    console.log('✅ Kết nối SMTP thành công!');
  } catch (error) {
    console.error('❌ Lỗi kết nối SMTP:', error);
    return;
  }

  // 2. Đọc template email
  console.log('=================================================');
  console.log('Tìm kiếm template email...');

  const templateDir = path.join(__dirname, '../templates/emails');
  console.log('Template directory:', templateDir);

  try {
    const files = fs.readdirSync(templateDir);
    console.log(`Các templates có sẵn: ${files.join(', ')}`);

    const templatePath = path.join(templateDir, 'email-verification.html');
    console.log('Đọc template từ:', templatePath);

    if (fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, 'utf8');
      console.log(`✅ Đọc template thành công (${template.length} bytes)`);

      // Thay thế các biến trong template
      const firstName = 'Test User';
      const verificationUrl = 'https://example.com/verify?token=test_token';

      let html = template
        .replace(/{{firstName}}/g, firstName)
        .replace(/{{verificationUrl}}/g, verificationUrl);

      console.log('✅ Đã thay thế các biến trong template');
    } else {
      console.error('❌ Không tìm thấy template email-verification.html');
    }
  } catch (error) {
    console.error('❌ Lỗi khi đọc template:', error);
  }

  // 3. Thử gửi email kiểm tra
  console.log('=================================================');
  console.log('Gửi email kiểm tra...');

  try {
    // Sử dụng HTML đơn giản để gửi
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #4CAF50; text-align: center;">Email Kiểm Tra</h1>
        <p>Đây là email kiểm tra từ ứng dụng Booking App.</p>
        <p>Nếu bạn nhận được email này, cấu hình email đã hoạt động đúng!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:5173" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Kiểm Tra Hoàn Thành</a>
        </div>
        <p>Thời gian gửi: ${new Date().toLocaleString()}</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // Gửi cho chính mình
      subject: 'Kiểm tra cấu hình email - Booking App',
      html: html
    };

    console.log(`Đang gửi email đến ${mailOptions.to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Gửi email thành công!');
    console.log('messageId:', info.messageId);
    console.log('=================================================');
    console.log('Kiểm tra hoàn thành!');
    console.log('Kiểm tra hộp thư đến và thư mục spam của bạn.');
  } catch (error) {
    console.error('❌ Lỗi gửi email:', error);
  }
}

// Chạy kiểm tra
testFullEmailFlow().catch(console.error);
