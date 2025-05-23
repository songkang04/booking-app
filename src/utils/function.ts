import type { ApiResponse } from '../types';
import dayjs from 'dayjs';

/**
 * Tạo phản hồi chuẩn hóa
 */
export function createResponse<T>(success: boolean, message: string, data?: T): ApiResponse<T> {
  return {
    success,
    message,
    data,
    timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
}
