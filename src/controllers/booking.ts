import { Request, Response } from 'express';
import bookingService from '../services/booking';
import { createResponse } from '../utils/function';
import { CreateBookingDto, UpdateBookingStatusDto } from '../dtos/booking.dto';

/**
 * Tạo đặt phòng mới
 */
export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu đăng nhập để đặt phòng'));
    }

    const bookingData: CreateBookingDto = req.body;
    const booking = await bookingService.createBooking(userId, bookingData);
    return res.status(201).json(
      createResponse(
        true,
        'Đặt phòng thành công! Vui lòng kiểm tra email để xác nhận đặt phòng của bạn.',
        booking
      )
    );
  } catch (error) {
    console.error('Lỗi tạo đặt phòng:', error);

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (errorMessage === 'Người dùng không tồn tại') {
        return res.status(404).json(createResponse(false, errorMessage));
      }

      if (errorMessage === 'Homestay không tồn tại') {
        return res.status(404).json(createResponse(false, errorMessage));
      }

      if (errorMessage.includes('Ngày check-in') || errorMessage.includes('Số lượng khách')) {
        return res.status(400).json(createResponse(false, errorMessage));
      }
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi tạo đặt phòng. Vui lòng thử lại sau.'));
  }
};

/**
 * Lấy danh sách đặt phòng của người dùng
 */
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu đăng nhập'));
    }

    const bookings = await bookingService.getUserBookings(userId);

    return res.json(createResponse(true, 'Lấy danh sách đặt phòng thành công', bookings));
  } catch (error) {
    console.error('Lỗi lấy danh sách đặt phòng:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi lấy danh sách đặt phòng'));
  }
};

/**
 * Lấy chi tiết đặt phòng
 */
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const booking = await bookingService.getBookingById(bookingId);

    // Kiểm tra quyền truy cập (chỉ người đặt hoặc admin mới có thể xem)
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin && booking.userId !== userId) {
      return res.status(403).json(createResponse(false, 'Không có quyền truy cập thông tin đặt phòng này'));
    }

    return res.json(createResponse(true, 'Lấy thông tin đặt phòng thành công', booking));
  } catch (error) {
    console.error('Lỗi lấy thông tin đặt phòng:', error);

    if (error instanceof Error && error.message === 'Đặt phòng không tồn tại') {
      return res.status(404).json(createResponse(false, error.message));
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi lấy thông tin đặt phòng'));
  }
};

/**
 * Xác nhận đặt phòng qua token
 */
export const verifyBooking = async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const booking = await bookingService.verifyBooking(token);

    return res.json(
      createResponse(
        true,
        'Xác nhận đặt phòng thành công! Chúng tôi đã gửi email thông báo chi tiết cho bạn.',
        booking
      )
    );
  } catch (error) {
    console.error('Lỗi xác nhận đặt phòng:', error);

    if (error instanceof Error) {
      if (error.message.includes('Token không hợp lệ') || error.message.includes('Token đã hết hạn')) {
        return res.status(400).json(createResponse(false, error.message));
      }
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi xác nhận đặt phòng'));
  }
};

/**
 * Cập nhật trạng thái đặt phòng (cho admin)
 */
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    // Kiểm tra quyền admin - middleware đã xử lý việc này
    const bookingId = req.params.id;
    const updateStatusDto: UpdateBookingStatusDto = req.body;

    const booking = await bookingService.updateBookingStatus(bookingId, updateStatusDto);

    return res.json(createResponse(true, 'Cập nhật trạng thái đặt phòng thành công', booking));
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đặt phòng:', error);

    if (error instanceof Error && error.message === 'Đặt phòng không tồn tại') {
      return res.status(404).json(createResponse(false, error.message));
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi cập nhật trạng thái đặt phòng'));
  }
};

/**
 * Xác nhận người dùng đã thanh toán
 */
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(createResponse(false, 'Yêu cầu đăng nhập để xác nhận thanh toán'));
    }

    const bookingId = req.params.id;

    // Cập nhật trạng thái thanh toán thành "đang chờ xác nhận"
    const booking = await bookingService.confirmUserPayment(userId, bookingId);

    return res.status(200).json(
      createResponse(
        true,
        'Xác nhận thanh toán thành công. Chúng tôi sẽ xác minh và cập nhật trạng thái đặt phòng của bạn trong thời gian sớm nhất.',
        booking
      )
    );
  } catch (error) {
    console.error('Lỗi xác nhận thanh toán:', error);

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (errorMessage === 'Đặt phòng không tồn tại') {
        return res.status(404).json(createResponse(false, errorMessage));
      }

      if (errorMessage === 'Bạn không có quyền xác nhận thanh toán cho đặt phòng này') {
        return res.status(403).json(createResponse(false, errorMessage));
      }

      if (errorMessage === 'Đặt phòng chưa được xác nhận' ||
          errorMessage === 'Trạng thái đặt phòng không hợp lệ để xác nhận thanh toán' ||
          errorMessage === 'Đặt phòng đã được thanh toán') {
        return res.status(400).json(createResponse(false, errorMessage));
      }
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi xác nhận thanh toán. Vui lòng thử lại sau.'));
  }
};
