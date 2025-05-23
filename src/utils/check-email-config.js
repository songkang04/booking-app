// Tạo một file kiểm tra đơn giản hơn
require('dotenv').config();

console.log('Kiểm tra cấu hình email:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '(đã thiết lập)' : '(chưa thiết lập)');

// Kiểm tra mật khẩu ứng dụng Gmail
if (process.env.EMAIL_PASSWORD) {
  const passwordLength = process.env.EMAIL_PASSWORD.length;
  console.log(`Độ dài mật khẩu: ${passwordLength} ký tự`);

  // Nếu dùng Gmail, cần mật khẩu ứng dụng (thường là 16 ký tự)
  if (process.env.EMAIL_HOST?.includes('gmail') && passwordLength !== 16) {
    console.log('\n⚠️ CẢNH BÁO: Bạn đang sử dụng Gmail nhưng độ dài mật khẩu không phải 16 ký tự.');
    console.log('Gmail yêu cầu mật khẩu ứng dụng (App Password) gồm 16 ký tự.');
    console.log('Vui lòng kiểm tra lại hoặc tạo mật khẩu ứng dụng mới tại: https://myaccount.google.com/apppasswords');
  }
}

console.log('\nKiểm tra bảo mật Gmail:');
console.log('1. Đảm bảo bạn đã bật "Quyền truy cập của ứng dụng kém an toàn" hoặc');
console.log('2. Đã thiết lập "Xác minh 2 bước" và sử dụng "Mật khẩu ứng dụng"');
console.log('\nHướng dẫn thiết lập:');
console.log('1. Truy cập https://myaccount.google.com/security');
console.log('2. Bật xác minh 2 bước');
console.log('3. Tạo mật khẩu ứng dụng tại https://myaccount.google.com/apppasswords');
console.log('4. Chọn "Khác" và đặt tên là "BookingApp"');
console.log('5. Sao chép mật khẩu được tạo vào .env file với khóa EMAIL_PASSWORD');
