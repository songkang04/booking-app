export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}