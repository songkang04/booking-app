import { Request, Response } from 'express';
import { LoginDto, RegisterDto, type ForgotPasswordDto, type ResetPasswordDto } from '../dtos/auth';
import type { UpdateProfileDto } from '../dtos/user';
import authService from '../services/auth';
import userService from '../services/user';
import { createResponse } from '../utils/function';
import { AUTH_CONSTANTS } from '../utils/constant';

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, confirmPassword }: RegisterDto = req.body;

    // Kiểm tra mật khẩu khớp nhau
    if (password !== confirmPassword) {
      return res.status(400).json(createResponse(false, 'Mật khẩu không khớp'));
    }

    const user = await authService.register(firstName, lastName, email, password);
    const token = authService.generateToken(user);

    // Trả về thông tin người dùng không bao gồm mật khẩu
    const { password: _, ...userData } = user;

    return res
      .status(201)
      .json(createResponse(true, 'Đăng ký tài khoản thành công', { user: userData, token }));
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    if (error instanceof Error && error.message === 'Email đã được sử dụng') {
      return res.status(400).json(createResponse(false, error.message));
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi đăng ký tài khoản'));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginDto = req.body;

    const user = await authService.login(email, password);
    const token = authService.generateToken(user);

    // Trả về thông tin người dùng không bao gồm mật khẩu
    const { password: _, ...userData } = user;

    return res.json(createResponse(true, 'Đăng nhập thành công', { user: userData, token }));
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    if (error instanceof Error && error.message === 'Thông tin đăng nhập không hợp lệ') {
      return res.status(401).json(createResponse(false, error.message));
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi đăng nhập'));
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    // Người dùng được đính kèm từ middleware xác thực
    const { user } = req;

    if (!user) {
      return res.status(401).json(createResponse(false, 'Chưa xác thực'));
    }

    return res.json(createResponse(true, 'Lấy thông tin người dùng thành công', { user }));
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng hiện tại:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi lấy thông tin người dùng'));
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    // Lấy người dùng đã xác thực từ request (được đặt bởi middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực'));
    }

    const updateData: UpdateProfileDto = req.body;
    const user = await userService.updateProfile(userId, updateData);

    // Trả về thông tin người dùng đã cập nhật (không bao gồm mật khẩu)
    const { password: _, ...userData } = user;

    return res.json(
      createResponse(true, 'Cập nhật thông tin cá nhân thành công', { user: userData })
    );
  } catch (error) {
    console.error('Lỗi cập nhật thông tin:', error);
    if (error instanceof Error) {
      if (error.message === 'Không tìm thấy người dùng') {
        return res.status(404).json(createResponse(false, error.message));
      }
      if (['Mật khẩu mới không khớp', 'Mật khẩu hiện tại không đúng'].includes(error.message)) {
        return res.status(400).json(createResponse(false, error.message));
      }
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi cập nhật thông tin cá nhân'));
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email }: ForgotPasswordDto = req.body;

    const result = await authService.forgotPassword(email);

    // Nếu email không tồn tại hoặc đang trong thời gian chờ, vẫn trả về thành công để tránh lộ thông tin
    if (!result.user || result.onCooldown) {
      // Trong môi trường development, có thể trả về thêm thông tin để debug
      if (process.env.NODE_ENV === 'development') {
        if (result.onCooldown) {
          console.log(`Tài khoản đang trong thời gian chờ: ${result.cooldownMinutes} phút `);
        }
      }

      return res
        .status(200)
        .json(
          createResponse(true, 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu')
        );
    }

    // Kiểm tra trạng thái gửi email
    if (!result.emailSent) {
      console.error('Không thể gửi email đặt lại mật khẩu');
      // Vẫn trả về thành công nhưng ghi log lỗi
    }

    const responseData =
      process.env.NODE_ENV === 'development'
        ? {
            resetToken: result.resetToken,
            cooldown: AUTH_CONSTANTS.PASSWORD_RESET_COOLDOWN_MINUTES,
          }
        : undefined;

    return res
      .status(200)
      .json(
        createResponse(
          true,
          'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu',
          responseData
        )
      );
  } catch (error) {
    console.error('Lỗi quên mật khẩu:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi xử lý yêu cầu đặt lại mật khẩu'));
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password, confirmPassword }: ResetPasswordDto = req.body;

    // Kiểm tra mật khẩu khớp nhau
    if (password !== confirmPassword) {
      return res.status(400).json(createResponse(false, 'Mật khẩu không khớp'));
    }

    await authService.resetPassword(token, password);

    return res.status(200).json(createResponse(true, 'Mật khẩu đã được đặt lại thành công'));
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    if (
      error instanceof Error &&
      error.message === 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
    ) {
      return res.status(400).json(createResponse(false, error.message));
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi đặt lại mật khẩu'));
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json(createResponse(false, 'Token xác thực không được cung cấp'));
    }

    const result = await authService.verifyEmail(token);

    return res.status(200).json(createResponse(true, 'Email đã được xác thực thành công'));
  } catch (error) {
    console.error('Lỗi xác thực email:', error);
    if (error instanceof Error && error.message === 'Token xác thực không hợp lệ hoặc đã hết hạn') {
      return res.status(400).json(createResponse(false, error.message));
    }
    return res.status(500).json(createResponse(false, 'Lỗi khi xác thực email'));
  }
};
