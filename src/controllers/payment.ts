import { Request, Response } from 'express';
import { createResponse } from '../utils/function';
import paymentService from '../services/payment';
import { UpdatePaymentStatusDto } from '../dtos/booking.dto';

/**
 * Khởi tạo quy trình thanh toán cho đặt phòng
 */
export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const booking = await paymentService.initiatePayment(bookingId);

    return res.json(createResponse(true, 'Khởi tạo thanh toán thành công', {
      id: booking.id,
      totalPrice: booking.totalPrice,
      paymentStatus: booking.paymentStatus,
      paymentQrCode: booking.paymentQrCode,
      paymentReference: booking.paymentReference
    }));
  } catch (error) {
    console.error('Lỗi khởi tạo thanh toán:', error);

    if (error instanceof Error) {
      if (error.message.includes('Đặt phòng không tồn tại')) {
        return res.status(404).json(createResponse(false, error.message));
      }

      if (error.message.includes('Đặt phòng chưa được xác nhận') ||
          error.message.includes('Đặt phòng đã được thanh toán')) {
        return res.status(400).json(createResponse(false, error.message));
      }
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi khởi tạo thanh toán'));
  }
};

/**
 * Lấy thông tin thanh toán của đặt phòng
 */
export const getPaymentInfo = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const payment = await paymentService.getPaymentInfo(bookingId);

    return res.json(createResponse(true, 'Lấy thông tin thanh toán thành công', payment));
  } catch (error) {
    console.error('Lỗi lấy thông tin thanh toán:', error);

    if (error instanceof Error && error.message === 'Đặt phòng không tồn tại') {
      return res.status(404).json(createResponse(false, error.message));
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi lấy thông tin thanh toán'));
  }
};

/**
 * Cập nhật trạng thái thanh toán (cho admin)
 */
export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const updateStatusDto: UpdatePaymentStatusDto = req.body;

    const success = await paymentService.updatePaymentStatus(
      bookingId, 
      updateStatusDto.paymentStatus, 
      updateStatusDto.paymentReference
    );

    if (!success) {
      return res.status(400).json(createResponse(false, 'Không thể cập nhật trạng thái thanh toán'));
    }

    return res.json(createResponse(true, 'Cập nhật trạng thái thanh toán thành công'));
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái thanh toán:', error);

    if (error instanceof Error && error.message === 'Đặt phòng không tồn tại') {
      return res.status(404).json(createResponse(false, error.message));
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi cập nhật trạng thái thanh toán'));
  }
};

/**
 * Xác nhận thanh toán (cho admin)
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const adminId = req.user?.id;
    const notes = req.body.notes;
    const approved = req.body.approved !== undefined ? req.body.approved : true;

    if (!adminId) {
      return res.status(401).json(createResponse(false, 'Không có quyền thực hiện hành động này'));
    }

    const booking = await paymentService.verifyPayment(bookingId, adminId, notes, approved);

    const message = approved
      ? 'Xác nhận thanh toán thành công'
      : 'Đã từ chối thanh toán';

    return res.json(createResponse(true, message, booking));
  } catch (error) {
    console.error('Lỗi xác nhận thanh toán:', error);

    if (error instanceof Error) {
      if (error.message === 'Đặt phòng không tồn tại') {
        return res.status(404).json(createResponse(false, error.message));
      }

      if (error.message === 'Đặt phòng này đã được thanh toán') {
        return res.status(400).json(createResponse(false, error.message));
      }
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi xác nhận thanh toán'));
  }
};
