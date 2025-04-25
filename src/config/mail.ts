import nodemailer from 'nodemailer';
import { User } from '../models/user';
import fs from 'fs';
import path from 'path';

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

    // Khởi tạo transporter cho nodemailer
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
      },
    });

    // Kiểm tra kết nối khi khởi tạo (trong môi trường development)
    if (process.env.NODE_ENV === 'development') {
      this.verifyConnection();
    }
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Kết nối SMTP đã sẵn sàng');
    } catch (error) {
      console.error('Lỗi kết nối SMTP:', error);
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
  async sendPasswordResetEmail(user: User, resetToken: string): Promise<boolean> {
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
  async sendPasswordResetConfirmation(user: User): Promise<boolean> {
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
  async sendVerificationEmail(user: User, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${verificationToken}`;

    try {
      // Sử dụng template hiện có hoặc tạo nội dung email trực tiếp
      let html;
      try {
        html = await this.loadTemplate('email-verification', {
          firstName: user.firstName,
          verificationUrl: verificationUrl,
        });
      } catch (error) {
        // Nếu không có template, sử dụng HTML cơ bản
        html = `
          <div>
            <h1>Xác thực tài khoản</h1>
            <p>Xin chào ${user.firstName},</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống của chúng tôi. Vui lòng nhấp vào liên kết dưới đây để xác thực email của bạn:</p>
            <p><a href="${verificationUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Xác thực email</a></p>
            <p>Hoặc bạn có thể sao chép và dán liên kết này vào trình duyệt:</p>
            <p>${verificationUrl}</p>
            <p>Liên kết sẽ hết hạn sau 24 giờ.</p>
          </div>
        `;
      }

      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: 'Xác thực tài khoản của bạn',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email xác thực:', error);
      return false;
    }
  }

  /**
   * Gửi email xác nhận xác thực tài khoản thành công
   */
  async sendVerificationConfirmation(user: User): Promise<boolean> {
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
   * Gửi email xác nhận đặt phòng
   */
  async sendBookingConfirmation(
    user: User,
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
    user: User,
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
}

export default new EmailService();
