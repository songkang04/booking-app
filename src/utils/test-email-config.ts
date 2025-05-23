import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

async function testEmailConfig() {
  console.log('🔍 Kiểm tra cấu hình email:');
  console.log('----------------------------------------');
  
  // Kiểm tra biến môi trường
  const requiredVars = ['EMAIL_USER', 'EMAIL_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Thiếu các biến môi trường:', missingVars.join(', '));
    return;
  }

  console.log('✅ Có đầy đủ biến môi trường');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '(đã cấu hình)' : '(chưa cấu hình)');

  try {
    console.log('\n🔄 Khởi tạo transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      debug: true
    });

    console.log('\n🔄 Kiểm tra kết nối SMTP...');
    await transporter.verify();
    console.log('✅ Kết nối SMTP thành công!');

    console.log('\n🔄 Gửi email test...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test Email Configuration',
      text: 'Nếu bạn nhận được email này, cấu hình email đã hoạt động!',
      html: '<b>Nếu bạn nhận được email này, cấu hình email đã hoạt động!</b>'
    });

    console.log('✅ Gửi email test thành công!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Lỗi:', error);

    if (error) {
      console.error('\n💡 Gợi ý khắc phục:');
      console.error('1. Kiểm tra lại EMAIL_USER và EMAIL_PASSWORD trong file .env');
      console.error('2. Nếu bạn dùng Gmail:');
      console.error('   - Bật xác thực 2 bước: https://myaccount.google.com/security');
      console.error('   - Tạo App Password: https://myaccount.google.com/apppasswords');
      console.error('   - Sử dụng App Password thay vì mật khẩu Gmail');
    }
  }
}

testEmailConfig();
