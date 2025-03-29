import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import emailService from '../config/mail';
import { User, UserRole } from '../models/user';
import { AUTH_CONSTANTS } from '../utils/constant';

interface ForgotPasswordResult {
  user?: User;
  resetToken?: string;
  emailSent: boolean;
  onCooldown: boolean;
  cooldownMinutes?: number;
}

class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<User> {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }

    // Tạo người dùng mới
    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      password, // Sẽ được mã hóa bởi hook BeforeInsert của entity
      role: UserRole.USER,
    });

    await this.userRepository.save(user);
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    // Tìm người dùng và lấy cả mật khẩu để xác thực
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new Error('Thông tin đăng nhập không hợp lệ.');
    }

    // Xác thực mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Thông tin đăng nhập không hợp lệ');
    }

    return user;
  }

  async getUserById(userId: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id: userId });
  }

  generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = '24h';

    return jwt.sign(payload, secret, { expiresIn });
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    // Tìm người dùng theo email
    const user = await this.userRepository.findOneBy({ email });

    // Nếu không tìm thấy người dùng
    if (!user) {
      return { emailSent: false, onCooldown: false };
    }

    // Kiểm tra xem người dùng có đang trong thời gian chờ không
    const now = new Date();
    if (user.lastPasswordResetRequest) {
      const cooldownMinutes = AUTH_CONSTANTS.PASSWORD_RESET_COOLDOWN_MINUTES;
      const cooldownTime = new Date(user.lastPasswordResetRequest.getTime() + cooldownMinutes * 60 * 1000);

      if (now < cooldownTime) {
        // Vẫn đang trong thời gian chờ
        const remainingMinutes = Math.ceil((cooldownTime.getTime() - now.getTime()) / (60 * 1000));
        return {
          emailSent: false,
          onCooldown: true,
          cooldownMinutes: remainingMinutes
        };
      }
    }

    // Kiểm tra số lần yêu cầu reset trong ngày (nếu cần)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Đếm số lần yêu cầu đặt lại mật khẩu trong ngày
    // Phần này yêu cầu lưu lịch sử reset mật khẩu trong DB
    // Giản lược bằng cách chỉ sử dụng cooldown

    // Tạo token ngẫu nhiên
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Thiết lập thời gian hết hạn
    const expiryHours = AUTH_CONSTANTS.PASSWORD_RESET_TOKEN_EXPIRY_HOURS;
    const expiryDate = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

    // Cập nhật thông tin người dùng
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = expiryDate;
    user.lastPasswordResetRequest = now;
    await this.userRepository.save(user);

    // Gửi email
    const emailSent = await emailService.sendPasswordResetEmail(user, resetToken);

    return {
      user,
      resetToken,
      emailSent,
      onCooldown: false
    };
  }

  // Cập nhật phương thức resetPassword
  async resetPassword(token: string, password: string): Promise<User> {
    // Tìm người dùng với token hợp lệ và chưa hết hạn
    const user = await this.userRepository.findOneBy({
      resetPasswordToken: token,
      resetPasswordExpires: MoreThan(new Date()),
    });

    if (!user) {
      throw new Error('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    // Cập nhật mật khẩu mới
    user.password = password; // Sẽ được mã hóa bởi hook entity

    // Xóa token đặt lại mật khẩu
    user.resetPasswordToken = '';

    await this.userRepository.save(user);

    // Gửi email xác nhận
    await emailService.sendPasswordResetConfirmation(user);

    return user;
  }
}

export default new AuthService();
