import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/database';
import { User } from '../models/user';
import type { UpdateProfileDto } from '../dtos/user';

class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async getUserById(userId: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id: userId });
  }

  async updateProfile(userId: number, updateData: UpdateProfileDto): Promise<User> {
    // Lấy người dùng kèm mật khẩu để xác thực
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    const {
      firstName,
      lastName,
      phoneNumber,
      profilePicture,
      currentPassword,
      newPassword,
      confirmNewPassword,
    } = updateData;

    // Xử lý thay đổi mật khẩu nếu được yêu cầu
    if (currentPassword && newPassword && confirmNewPassword) {
      // Kiểm tra mật khẩu mới khớp nhau
      if (newPassword !== confirmNewPassword) {
        throw new Error('Mật khẩu mới không khớp');
      }

      // Xác thực mật khẩu hiện tại
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new Error('Mật khẩu hiện tại không đúng');
      }

      // Cập nhật mật khẩu
      user.password = newPassword;
    }

    // Cập nhật các trường thông tin nếu được cung cấp
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (profilePicture) user.profilePicture = profilePicture;

    // Lưu thông tin người dùng đã cập nhật
    await this.userRepository.save(user);
    return user;
  }
}

export default new UserService();
