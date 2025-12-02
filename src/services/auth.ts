import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import emailService from '../config/mail';
import { User, IUser, UserRole } from '../schemas/user.schema';
import { AUTH_CONSTANTS } from '../utils/constant';

interface ForgotPasswordResult {
  user?: IUser;
  resetToken?: string;
  emailSent: boolean;
  onCooldown: boolean;
  cooldownMinutes?: number;
}

class AuthService {
  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<IUser> {
    console.log(`[AUTH SERVICE] Đăng ký người dùng mới: ${email}`);

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`[AUTH SERVICE] ⚠️ Email đã được sử dụng: ${email}`);
      throw new Error('Email đã được sử dụng');
    }

    // Tạo mã OTP xác thực email (6 chữ số)
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[AUTH SERVICE] ✅ Đã tạo mã OTP xác thực: ${verificationOtp}`);

    // Thiết lập thời gian hết hạn (15 phút)
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 15);

    // Tạo người dùng mới
    const user = new User({
      firstName,
      lastName,
      email,
      password, // Sẽ được mã hóa bởi middleware pre save của schema
      role: UserRole.USER,
      emailVerificationOtp: verificationOtp,
      emailVerificationExpires: expiryDate,
      isEmailVerified: false
    });

    console.log(`[AUTH SERVICE] 🔄 Đang lưu người dùng vào database...`);
    const savedUser = await user.save();
    console.log(`[AUTH SERVICE] ✅ Đã lưu người dùng: ID=${savedUser._id}`);

    // Gửi email xác thực
    console.log(`[AUTH SERVICE] 🔄 Bắt đầu gửi email xác thực...`);
    try {
      const emailSent = await emailService.sendVerificationEmail(savedUser, verificationOtp);
      if (emailSent) {
        console.log(`[AUTH SERVICE] ✅ Đã gửi email xác thực thành công cho: ${email}`);
      } else {
        console.error(`[AUTH SERVICE] ❌ Không thể gửi email xác thực cho: ${email}`);
      }
    } catch (error) {
      console.error(`[AUTH SERVICE] ❌ Lỗi gửi email xác thực:`, error);
    }

    return savedUser;
  }

  async login(email: string, password: string): Promise<IUser> {
    // Tìm người dùng và lấy cả mật khẩu để xác thực
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new Error('Thông tin đăng nhập không hợp lệ.');
    }

    // Xác thực mật khẩu
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Thông tin đăng nhập không hợp lệ');
    }

    return user;
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  generateToken(user: IUser): string {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = '24h';

    return jwt.sign(payload, secret, { expiresIn });
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    // Tìm người dùng theo email
    const user = await User.findOne({ email });

    // Nếu không tìm thấy người dùng
    if (!user) {
      return { emailSent: false, onCooldown: false };
    }

    // Kiểm tra xem người dùng có đang trong thời gian chờ không
    const now = new Date();
    if (user.passwordResetExpires) {
      const cooldownMinutes = AUTH_CONSTANTS.PASSWORD_RESET_COOLDOWN_MINUTES;
      const cooldownTime = new Date(now.getTime() - cooldownMinutes * 60 * 1000);

      if (user.passwordResetExpires > cooldownTime) {
        // Vẫn đang trong thời gian chờ
        const remainingMinutes = Math.ceil((user.passwordResetExpires.getTime() - now.getTime()) / (60 * 1000));
        return {
          emailSent: false,
          onCooldown: true,
          cooldownMinutes: remainingMinutes
        };
      }
    }

    // Tạo token ngẫu nhiên
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Thiết lập thời gian hết hạn
    const expiryHours = AUTH_CONSTANTS.PASSWORD_RESET_TOKEN_EXPIRY_HOURS;
    const expiryDate = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

    // Cập nhật thông tin người dùng
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = expiryDate;
    await user.save();

    // Gửi email
    const emailSent = await emailService.sendPasswordResetEmail(user, resetToken);

    return {
      user,
      resetToken,
      emailSent,
      onCooldown: false
    };
  }

  async resetPassword(token: string, password: string): Promise<IUser> {
    // Tìm người dùng với token hợp lệ và chưa hết hạn
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    // Cập nhật mật khẩu mới
    user.password = password; // Sẽ được mã hóa bởi middleware pre save
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // Gửi email xác nhận
    await emailService.sendPasswordResetConfirmation(user);

    return user;
  }

  async verifyEmailOtp(email: string, otp: string): Promise<IUser> {
    // Tìm người dùng với OTP hợp lệ và chưa hết hạn
    const user = await User.findOne({
      email,
      emailVerificationOtp: otp,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Cập nhật trạng thái xác thực
    user.isEmailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    // Gửi email xác nhận
    try {
      await emailService.sendVerificationConfirmation(user);
    } catch (error) {
      console.error('Lỗi gửi email xác nhận:', error);
    }

    return user;
  }

  async verifyEmail(token: string): Promise<IUser> {
    // Tìm người dùng với token hợp lệ và chưa hết hạn
    const user = await User.findOne({
      emailVerificationOtp: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Token xác thực không hợp lệ hoặc đã hết hạn');
    }

    // Cập nhật trạng thái xác thực
    user.isEmailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    // Gửi email xác nhận
    try {
      await emailService.sendVerificationConfirmation(user);
    } catch (error) {
      console.error('Lỗi gửi email xác nhận:', error);
    }

    return user;
  }
}

export default new AuthService();
