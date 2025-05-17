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

    console.log('[EMAIL SERVICE] Khởi tạo với cấu hình:');
    console.log(`- EMAIL_HOST: ${process.env.EMAIL_HOST}`);
    console.log(`- EMAIL_PORT: ${process.env.EMAIL_PORT}`);
    console.log(`- EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`- FROM EMAIL: ${this.fromEmail}`);
    console.log(`- FRONTEND URL: ${this.frontendUrl}`);
    console.log(`- Template Directory: ${this.templateDir}`);

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
      console.log('[EMAIL SERVICE] ✅ Kết nối SMTP đã sẵn sàng');
    } catch (error) {
      console.error('[EMAIL SERVICE] ❌ Lỗi kết nối SMTP:', error);
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
      console.log(`[EMAIL SERVICE] Đang tải template: ${templateName}`);
      const filePath = path.join(this.templateDir, `${templateName}.html`);
      console.log(`[EMAIL SERVICE] Đường dẫn đầy đủ đến template: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        console.error(`[EMAIL SERVICE] ❌ Template không tồn tại: ${filePath}`);
        throw new Error(`Template ${templateName} không tồn tại`);
      }

      let content = await fs.promises.readFile(filePath, 'utf8');
      console.log(`[EMAIL SERVICE] Đã đọc template thành công (${content.length} bytes)`);

      // Thay thế các biến trong template
      Object.keys(replacements).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, replacements[key]);
      });

      return content;
    } catch (error) {
      console.error(`[EMAIL SERVICE] ❌ Lỗi đọc template ${templateName}:`, error);
      throw new Error(`Không thể đọc template ${templateName}`);
    }
  }

  /**
   * Gửi email xác thực tài khoản
   */
  async sendVerificationEmail(user: User, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${verificationToken}`;
    console.log(`[EMAIL SERVICE] 🔄 Đang gửi email xác thực cho: ${user.email}`);
    console.log(`[EMAIL SERVICE] 🔗 URL xác thực: ${verificationUrl}`);

    try {
      // Sử dụng template hiện có hoặc tạo nội dung email trực tiếp
      let html;
      try {
        html = await this.loadTemplate('email-verification', {
          firstName: user.firstName,
          verificationUrl: verificationUrl,
        });
      } catch (error) {
        console.error('[EMAIL SERVICE] ❌ Lỗi khi tải template, sử dụng HTML cơ bản', error);

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

      console.log(`[EMAIL SERVICE] 🔄 Tạo mailOptions cho email xác thực`);
      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: 'Xác thực tài khoản của bạn',
        html
      };

      console.log(`[EMAIL SERVICE] 🔄 Đang gửi email xác thực đến: ${user.email}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL SERVICE] ✅ Email xác thực đã được gửi: ${info.messageId}`);
      console.log(`[EMAIL SERVICE] 📧 Thông tin email gửi:`, info);
      return true;
    } catch (error: any) {
      console.error('[EMAIL SERVICE] ❌ Lỗi gửi email xác thực:', error);

      if (error.code === 'EAUTH') {
        console.error('[EMAIL SERVICE] 🔐 Lỗi xác thực: Kiểm tra lại username và password trong .env');
      } else if (error.code === 'ESOCKET') {
        console.error('[EMAIL SERVICE] 🔌 Lỗi kết nối: Kiểm tra lại host và port trong .env');
      } else if (error.code === 'EENVELOPE') {
        console.error('[EMAIL SERVICE] 📧 Lỗi địa chỉ email: Kiểm tra lại địa chỉ email người gửi/nhận');
        console.error(`[EMAIL SERVICE] Người gửi: ${this.fromEmail}, Người nhận: ${user.email}`);
      }

      return false;
    }
  }

  /**
   * Gửi email đặt lại mật khẩu
   */
  async sendPasswordResetEmail(user: User, resetToken: string): Promise<boolean> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;
    console.log(`[EMAIL SERVICE] 🔄 Đang gửi email đặt lại mật khẩu cho: ${user.email}`);

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

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL SERVICE] ✅ Email đặt lại mật khẩu đã được gửi: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error('[EMAIL SERVICE] ❌ Lỗi gửi email đặt lại mật khẩu:', error);
      return false;
    }
  }

  /**
   * Hàm chung để gửi email
   */
  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    try {
      console.log(`[EMAIL SERVICE] 🔄 Đang gửi email đến: ${options.to}`);

      const mailOptions = {
        from: this.fromEmail,
        ...options
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL SERVICE] ✅ Email đã được gửi: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error('[EMAIL SERVICE] ❌ Lỗi gửi email:', error);
      return false;
    }
  }
}

export default new EmailService();
