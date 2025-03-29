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
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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
}

export default new EmailService();
