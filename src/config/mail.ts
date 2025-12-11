import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import type { IUser } from '../schemas/user.schema';
import "dotenv/config";

class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private frontendUrl: string;
  private templateDir: string;

  constructor() {
    // Lấy cấu hình từ biến môi trường
    this.fromEmail = process.env.EMAIL_FROM || 'no-reply@bookingapp.com';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    this.templateDir = path.join(__dirname, '../templates/emails');

    // Kiểm tra biến môi trường bắt buộc
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('[EMAIL SERVICE] ❌ Thiếu thông tin xác thực email:', {
        EMAIL_USER: process.env.EMAIL_USER ? 'Đã cấu hình' : 'Chưa cấu hình',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Đã cấu hình' : 'Chưa cấu hình'
      });
      throw new Error('EMAIL_USER và EMAIL_PASSWORD là bắt buộc');
    }

    // Khởi tạo transporter cho nodemailer
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      debug: true
    });

    // Kiểm tra kết nối khi khởi tạo 
      this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      console.log('Đang kiểm tra kết nối SMTP...');
      await this.transporter.verify();
      console.log('✅ Kết nối SMTP đã sẵn sàng');
    } catch (error) {
      console.error('❌ Lỗi kết nối SMTP:', error);
      console.error('📧 Chi tiết cấu hình email:', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        user: process.env.EMAIL_USER,
        // Hiển thị 3 ký tự đầu tiên của mật khẩu để debug
        pass: process.env.EMAIL_PASSWORD ? `${process.env.EMAIL_PASSWORD.substring(0, 3)}...` : 'không được cung cấp'
      });
    }
  }

  /**
   * Đọc file template và thay thế các biến
   */
  private async loadTemplate(
    templateName: string,
    replacements: Record<string, string>
  ): Promise<string> {
    try {
      const filePath = path.join(this.templateDir, `${templateName}.html`);
      let content = await fs.promises.readFile(filePath, 'utf8');

      // Thay thế các biến trong template
      Object.keys(replacements).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, replacements[key]);
      });

      return content;
    } catch (error) {
      console.error(`Lỗi đọc template ${templateName}:`, error);
      throw new Error(`Không thể đọc template ${templateName}`);
    }
  }

  /**
   * Gửi email đặt lại mật khẩu
   */
  async sendPasswordResetEmail(user: IUser, resetToken: string): Promise<boolean> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    try {
      const html = await this.loadTemplate('reset-password', {
        firstName: user.firstName,
        resetUrl: resetUrl,
      });

      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: 'Đặt lại mật khẩu',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email đặt lại mật khẩu:', error);
      return false;
    }
  }

  /**
   * Gửi email xác nhận đặt lại mật khẩu thành công
   */
  async sendPasswordResetConfirmation(user: IUser): Promise<boolean> {
    try {
      const html = await this.loadTemplate('reset-password-confirmation', {
        firstName: user.firstName,
      });

      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: 'Mật khẩu đã được đặt lại',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email xác nhận đặt lại mật khẩu:', error);
      return false;
    }
  }

  /**
   * Gửi email xác thực tài khoản
   */
  async sendVerificationEmail(user: IUser, verificationOtp: string): Promise<boolean> {
    console.log('🔄 Đang chuẩn bị gửi email xác thực cho:', user.email);
    console.log('🔐 Mã OTP:', verificationOtp);

    try {
      // Kiểm tra lại kết nối SMTP trước khi gửi
      await this.transporter.verify();

      // Chuẩn bị HTML content
      let html;
      try {
        html = await this.loadTemplate('email-verification', {
          firstName: user.firstName,
          verificationOtp: verificationOtp,
        });
        console.log('✅ Đã tải template email-verification thành công');
      } catch (error) {
        console.log('⚠️ Sử dụng template HTML cơ bản thay thế');
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Xác thực tài khoản</h1>
            <p>Xin chào ${user.firstName},</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống của chúng tôi. Vui lòng sử dụng mã xác thực dưới đây:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Mã xác thực của bạn:</p>
              <p style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; margin: 0;">${verificationOtp}</p>
            </div>
            <p>Mã này sẽ hết hạn sau <strong>15 phút</strong>.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">Nếu bạn không yêu cầu xác thực, vui lòng bỏ qua email này.</p>
          </div>
        `;
      }

      console.log('📧 Chuẩn bị gửi email với cấu hình:', {
        from: this.fromEmail,
        to: user.email,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD ? '***' : 'missing'
        }
      });

      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: 'Mã xác thực tài khoản của bạn',
        html,
      });

      console.log('✅ Email xác thực đã được gửi:', info.messageId);
      console.log('📧 Thông tin chi tiết:', info);
      return true;
    } catch (error: any) {
      console.error('❌ Lỗi gửi email xác thực:', error);

      if (error.code === 'EAUTH') {
        console.error('🔐 Lỗi xác thực: Kiểm tra lại EMAIL_USER và EMAIL_PASSWORD trong .env');
      } else if (error.code === 'ESOCKET') {
        console.error('🔌 Lỗi kết nối: Kiểm tra lại kết nối mạng và cấu hình SMTP');
      }

      return false;
    }
  }

  /**
   * Gửi email xác nhận xác thực tài khoản thành công
   */
  async sendVerificationConfirmation(user: IUser): Promise<boolean> {
    try {
      // Sử dụng template hiện có hoặc tạo nội dung email trực tiếp
      let html;
      try {
        html = await this.loadTemplate('verification-confirmation', {
          firstName: user.firstName,
        });
      } catch (error) {
        // Nếu không có template, sử dụng HTML cơ bản
        html = `
          <div>
            <h1>Xác thực tài khoản thành công</h1>
            <p>Xin chào ${user.firstName},</p>
            <p>Chúc mừng! Email của bạn đã được xác thực thành công.</p>
            <p>Bây giờ bạn có thể đăng nhập và sử dụng đầy đủ các tính năng của hệ thống.</p>
          </div>
        `;
      }

      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: 'Tài khoản đã được xác thực thành công',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email xác nhận xác thực:', error);
      return false;
    }
  }

  /**
   * Gửi email OTP xác thực đặt phòng
   */
  async sendBookingOtpEmail(
    user: IUser,
    otp: string,
    bookingDetails: {
      homestayName: string;
      homestayAddress: string;
      checkInDate: Date;
      checkOutDate: Date;
      guestCount: number;
      totalPrice: number;
    }
  ): Promise<boolean> {
    console.log('🔄 Đang chuẩn bị gửi email OTP xác thực booking cho:', user.email);
    console.log('🔐 Mã OTP:', otp);

    // Format dates to Vietnamese format
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    try {
      let html;
      try {
        html = await this.loadTemplate('booking-otp', {
          firstName: user.firstName,
          verificationOtp: otp,
          homestayName: bookingDetails.homestayName,
          homestayAddress: bookingDetails.homestayAddress,
          checkInDate: formatDate(bookingDetails.checkInDate),
          checkOutDate: formatDate(bookingDetails.checkOutDate),
          guestCount: bookingDetails.guestCount.toString(),
          totalPrice: bookingDetails.totalPrice.toLocaleString('vi-VN'),
        });
        console.log('✅ Đã tải template booking-otp thành công');
      } catch (error) {
        console.log('⚠️ Sử dụng template HTML cơ bản thay thế');
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50; text-align: center;">Xác thực đặt phòng</h2>
            <p>Xin chào ${user.firstName},</p>
            <p>Cảm ơn bạn đã đặt phòng tại <strong>${bookingDetails.homestayName}</strong>. Vui lòng sử dụng mã OTP dưới đây để xác thực đặt phòng của bạn:</p>

            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Mã xác thực của bạn:</p>
              <p style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 8px; margin: 0;">${otp}</p>
            </div>

            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Chi tiết đặt phòng:</h3>
              <p><strong>Homestay:</strong> ${bookingDetails.homestayName}</p>
              <p><strong>Địa chỉ:</strong> ${bookingDetails.homestayAddress}</p>
              <p><strong>Ngày check-in:</strong> ${formatDate(bookingDetails.checkInDate)}</p>
              <p><strong>Ngày check-out:</strong> ${formatDate(bookingDetails.checkOutDate)}</p>
              <p><strong>Số lượng khách:</strong> ${bookingDetails.guestCount}</p>
              <p><strong>Tổng giá tiền:</strong> ${bookingDetails.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
            </div>

            <p><strong>Lưu ý:</strong> Mã OTP này sẽ hết hạn sau <strong>15 phút</strong>.</p>
            <p>Nếu bạn không thực hiện đặt phòng này, vui lòng bỏ qua email này.</p>

            <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
              Email này được gửi tự động, vui lòng không trả lời.<br>
              &copy; 2025 Booking App. Bảo lưu mọi quyền.
            </p>
          </div>
        `;
      }

      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: `Mã xác thực đặt phòng tại ${bookingDetails.homestayName}`,
        html,
      });

      console.log('✅ Email OTP đặt phòng đã được gửi:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Lỗi gửi email OTP đặt phòng:', error);
      return false;
    }
  }

  /**
   * Gửi email xác nhận đặt phòng
   */
  async sendBookingConfirmation(
    user: IUser,
    verificationToken: string,
    bookingDetails: {
      homestayName: string;
      homestayAddress: string;
      checkInDate: Date;
      checkOutDate: Date;
      guestCount: number;
      totalPrice: number;
    }
  ): Promise<boolean> {
    const verificationUrl = `${this.frontendUrl}/booking-verification?token=${verificationToken}`;

    // Format dates to Vietnamese format
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    try {
      // Sử dụng template hiện có hoặc tạo nội dung email trực tiếp
      let html;
      try {
        html = await this.loadTemplate('booking-confirmation', {
          firstName: user.firstName,
          verificationUrl: verificationUrl,
          homestayName: bookingDetails.homestayName,
          homestayAddress: bookingDetails.homestayAddress,
          checkInDate: formatDate(bookingDetails.checkInDate),
          checkOutDate: formatDate(bookingDetails.checkOutDate),
          guestCount: bookingDetails.guestCount.toString(),
          totalPrice: bookingDetails.totalPrice.toLocaleString('vi-VN'),
        });
      } catch (error) {
        // Nếu không có template, sử dụng HTML cơ bản theo mẫu từ kế hoạch
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #333;">Xác nhận đặt phòng của bạn tại ${bookingDetails.homestayName}</h2>
            <p>Xin chào ${user.firstName},</p>
            <p>Cảm ơn bạn đã đặt phòng tại ${bookingDetails.homestayName}. Vui lòng xác nhận đặt phòng bằng cách nhấn vào nút dưới đây:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">XÁC NHẬN ĐẶT PHÒNG</a>
            </div>

            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <h3 style="margin-top: 0;">Chi tiết đặt phòng:</h3>
              <p><strong>Homestay:</strong> ${bookingDetails.homestayName}</p>
              <p><strong>Địa chỉ:</strong> ${bookingDetails.homestayAddress}</p>
              <p><strong>Ngày check-in:</strong> ${formatDate(bookingDetails.checkInDate)}</p>
              <p><strong>Ngày check-out:</strong> ${formatDate(bookingDetails.checkOutDate)}</p>
              <p><strong>Số lượng khách:</strong> ${bookingDetails.guestCount}</p>
              <p><strong>Tổng giá tiền:</strong> ${bookingDetails.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
            </div>

            <p>Lưu ý: Link xác nhận này sẽ hết hạn sau 24 giờ.</p>
            <p>Nếu bạn không thực hiện đặt phòng này, vui lòng bỏ qua email này.</p>

            <p>Trân trọng,<br>
            Đội ngũ hỗ trợ Homestay App</p>
          </div>
        `;
      }

      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: `Xác nhận đặt phòng tại ${bookingDetails.homestayName}`,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email xác nhận đặt phòng:', error);
      return false;
    }
  }

  /**
   * Gửi email thông báo đặt phòng thành công
   */
  async sendBookingSuccessNotification(
    user: IUser,
    bookingDetails: {
      homestayName: string;
      homestayAddress: string;
      checkInDate: Date;
      checkOutDate: Date;
      guestCount: number;
      totalPrice: number;
      bookingId: string;
    }
  ): Promise<boolean> {
    // Format dates to Vietnamese format
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    try {
      // Sử dụng template hiện có hoặc tạo nội dung email trực tiếp
      let html;
      try {
        html = await this.loadTemplate('booking-success', {
          firstName: user.firstName,
          homestayName: bookingDetails.homestayName,
          homestayAddress: bookingDetails.homestayAddress,
          checkInDate: formatDate(bookingDetails.checkInDate),
          checkOutDate: formatDate(bookingDetails.checkOutDate),
          guestCount: bookingDetails.guestCount.toString(),
          totalPrice: bookingDetails.totalPrice.toLocaleString('vi-VN'),
          bookingId: bookingDetails.bookingId,
        });
      } catch (error) {
        // Nếu không có template, sử dụng HTML cơ bản
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #333;">Đặt phòng thành công!</h2>
            <p>Xin chào ${user.firstName},</p>
            <p>Chúc mừng! Đặt phòng của bạn tại ${bookingDetails.homestayName} đã được xác nhận thành công.</p>

            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Chi tiết đặt phòng:</h3>
              <p><strong>Mã đặt phòng:</strong> ${bookingDetails.bookingId}</p>
              <p><strong>Homestay:</strong> ${bookingDetails.homestayName}</p>
              <p><strong>Địa chỉ:</strong> ${bookingDetails.homestayAddress}</p>
              <p><strong>Ngày check-in:</strong> ${formatDate(bookingDetails.checkInDate)}</p>
              <p><strong>Ngày check-out:</strong> ${formatDate(bookingDetails.checkOutDate)}</p>
              <p><strong>Số lượng khách:</strong> ${bookingDetails.guestCount}</p>
              <p><strong>Tổng giá tiền:</strong> ${bookingDetails.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
            </div>

            <p>Bạn có thể xem chi tiết đặt phòng và lịch sử đặt phòng của mình trong phần "Đặt phòng của tôi" trên trang cá nhân.</p>

            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>

            <p>Trân trọng,<br>
            Đội ngũ hỗ trợ Homestay App</p>
          </div>
        `;
      }

      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: `Đặt phòng thành công tại ${bookingDetails.homestayName}`,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email thông báo đặt phòng thành công:', error);
      return false;
    }
  }

  /**
   * Gửi email với nội dung tùy chỉnh
   */
  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
      filename: string;
      path: string;
      cid?: string;
    }>;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        ...options
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email:', error);
      return false;
    }
  }
}

export default new EmailService();
