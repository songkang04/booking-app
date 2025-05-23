import { Request, Response } from 'express';
import { Types } from 'mongoose';
import bookingService from '../services/booking';
import { createResponse } from '../utils/function';
import { CreateBookingDto, UpdateBookingStatusDto } from '../dtos/booking.dto';
import { BookingStatus, PaymentStatus } from '../schemas/booking.schema';

/**
 * Tạo đặt phòng mới
 */
export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực hoặc ID người dùng không hợp lệ'));
    }

    const bookingData: CreateBookingDto = req.body;

    // Validate homestayId
    if (!bookingData.homestayId || !Types.ObjectId.isValid(bookingData.homestayId)) {
      return res.status(400).json(createResponse(false, 'ID homestay không hợp lệ'));
    }

    // Validate dates
    const now = new Date();
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);

    if (checkIn < now) {
      return res.status(400).json(createResponse(false, 'Ngày check-in không hợp lệ'));
    }

    if (checkOut <= checkIn) {
      return res.status(400).json(createResponse(false, 'Ngày check-out phải sau ngày check-in'));
    }

    // Validate guest count
    if (!bookingData.guestCount || bookingData.guestCount < 1) {
      return res.status(400).json(createResponse(false, 'Số lượng khách không hợp lệ'));
    }

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

      if (errorMessage === 'Người dùng không tồn tại' || 
          errorMessage === 'Homestay không tồn tại') {
        return res.status(404).json(createResponse(false, errorMessage));
      }

      if (errorMessage.includes('Ngày check-in') || 
          errorMessage.includes('Số lượng khách') ||
          errorMessage.includes('không còn trống')) {
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
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực hoặc ID người dùng không hợp lệ'));
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const status = req.query.status as BookingStatus;

    const result = await bookingService.getBookings({ userId, page, limit, status });
    return res.json(createResponse(true, 'Lấy danh sách đặt phòng thành công', result));
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
    if (!Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json(createResponse(false, 'ID đặt phòng không hợp lệ'));
    }

    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json(createResponse(false, 'Đặt phòng không tồn tại'));
    }

    // Kiểm tra quyền truy cập (chỉ người đặt, chủ homestay hoặc admin mới có thể xem)
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';
    const isHost = (booking.homestayId as any)?.hostId?._id?.toString() === userId;

    if (!isAdmin && !isHost && booking.userId.toString() !== userId) {
      return res.status(403).json(createResponse(false, 'Không có quyền truy cập thông tin đặt phòng này'));
    }

    return res.json(createResponse(true, 'Lấy thông tin đặt phòng thành công', booking));
  } catch (error) {
    console.error('Lỗi lấy thông tin đặt phòng:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi lấy thông tin đặt phòng'));
  }
};

/**
 * Xác nhận đặt phòng qua token
 */
export const verifyBooking = async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    if (!token || token.length < 10) {
      return res.status(400).json(createResponse(false, 'Token không hợp lệ'));
    }

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
      if (error.message.includes('Token không hợp lệ') || 
          error.message.includes('Token đã hết hạn')) {
        return res.status(400).json(createResponse(false, error.message));
      }
      if (error.message.includes('không tồn tại')) {
        return res.status(404).json(createResponse(false, error.message));
      }
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi xác nhận đặt phòng'));
  }
};

/**
 * Cập nhật trạng thái đặt phòng (cho admin/host)
 */
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    if (!Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json(createResponse(false, 'ID đặt phòng không hợp lệ'));
    }

    const updateStatusDto: UpdateBookingStatusDto = req.body;
    if (!Object.values(BookingStatus).includes(updateStatusDto.status)) {
      return res.status(400).json(createResponse(false, 'Trạng thái đặt phòng không hợp lệ'));
    }

    const booking = await bookingService.updateBookingStatus(bookingId, updateStatusDto.status);
    return res.json(createResponse(true, 'Cập nhật trạng thái đặt phòng thành công', booking));
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đặt phòng:', error);

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (errorMessage === 'Đặt phòng không tồn tại') {
        return res.status(404).json(createResponse(false, errorMessage));
      }

      if (errorMessage.includes('không thể thay đổi') || 
          errorMessage.includes('không thể xác nhận')) {
        return res.status(400).json(createResponse(false, errorMessage));
      }
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
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json(createResponse(false, 'Yêu cầu xác thực hoặc ID người dùng không hợp lệ'));
    }

    const bookingId = req.params.id;
    if (!Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json(createResponse(false, 'ID đặt phòng không hợp lệ'));
    }

    const { paymentMethod, paymentReference } = req.body;
    if (!paymentMethod) {
      return res.status(400).json(createResponse(false, 'Phương thức thanh toán không được để trống'));
    }

    const booking = await bookingService.confirmUserPayment(userId, bookingId, {
      paymentMethod,
      paymentReference
    });

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
          errorMessage === 'Đặt phòng đã được thanh toán') {
        return res.status(400).json(createResponse(false, errorMessage));
      }
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi xác nhận thanh toán. Vui lòng thử lại sau.'));
  }
};
