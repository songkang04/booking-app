export const AUTH_CONSTANTS = {
  // Thời gian chờ giữa các yêu cầu đặt lại mật khẩu (phút)
  PASSWORD_RESET_COOLDOWN_MINUTES: 0.5,

  // Thời gian hết hạn của token đặt lại mật khẩu (giờ)
  PASSWORD_RESET_TOKEN_EXPIRY_HOURS: 1,

  // Số lần yêu cầu đặt lại mật khẩu tối đa trong một ngày
  MAX_PASSWORD_RESET_REQUESTS_PER_DAY: 5,
};
