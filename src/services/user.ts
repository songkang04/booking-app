import { User, IUser } from '../schemas/user.schema';
import { UpdateProfileDto } from '../dtos/user';

class UserService {
  async getUserById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async updateUser(
    userId: string,
    userData: Partial<IUser>
  ): Promise<IUser | null> {
    // Không cho phép cập nhật password qua phương thức này
    if (userData.password) {
      delete userData.password;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: userData },
      { new: true } // Trả về document sau khi update
    );

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    // Tìm user và lấy cả password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Mật khẩu hiện tại không đúng');
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    return true;
  }

  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto
  ): Promise<IUser> {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Xử lý thay đổi mật khẩu nếu được cung cấp
    if (updateData.currentPassword && updateData.newPassword) {
      if (updateData.newPassword !== updateData.confirmNewPassword) {
        throw new Error('Mật khẩu mới không khớp');
      }

      // Xác thực mật khẩu hiện tại
      const isPasswordValid = await user.comparePassword(updateData.currentPassword);
      if (!isPasswordValid) {
        throw new Error('Mật khẩu hiện tại không đúng');
      }

      // Cập nhật mật khẩu mới
      user.password = updateData.newPassword;
    }

    // Cập nhật các thông tin khác
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.phoneNumber) user.phoneNumber = updateData.phoneNumber;
    if (updateData.profilePicture) user.profilePicture = updateData.profilePicture;

    await user.save();
    return user;
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit),
      User.countDocuments()
    ]);

    return { users, total };
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await User.deleteOne({ _id: userId });
    return result.deletedCount === 1;
  }
}

export default new UserService();
