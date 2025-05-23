import { NextFunction, Request, Response } from 'express';
import { createResponse } from '../utils/function';

// Map lưu trữ số lần yêu cầu và thời gian yêu cầu cuối cùng
const ipRequestMap = new Map<string, { count: number; lastReset: Date }>();

// Số lần yêu cầu tối đa cho mỗi IP trong khoảng thời gian
const MAX_REQUESTS = 5;
// Thời gian reset số lần yêu cầu (giây)
const WINDOW_SECONDS = 60; // 1 giờ

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = new Date();

  // Lấy thông tin hiện tại của IP
  let ipData = ipRequestMap.get(ip);

  // Nếu không có dữ liệu hoặc đã quá thời gian cửa sổ, tạo mới
  if (!ipData || now.getTime() - ipData.lastReset.getTime() > WINDOW_SECONDS * 1000) {
    ipData = { count: 0, lastReset: now };
  }

  // Tăng số lần yêu cầu
  ipData.count += 1;

  // Kiểm tra nếu vượt quá giới hạn
  if (ipData.count > MAX_REQUESTS) {
    // Tính thời gian còn lại
    const resetTime = new Date(ipData.lastReset.getTime() + WINDOW_SECONDS * 1000);
    const remainingSeconds = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);

    return res
      .status(429)
      .json(
        createResponse(
          false,
          `Quá nhiều yêu cầu. Vui lòng thử lại sau ${Math.ceil(remainingSeconds / 60)} phút`
        )
      );
  }

  // Cập nhật lại thông tin
  ipRequestMap.set(ip, ipData);

  next();
};
