import { Request, Response } from 'express';
import { createResponse } from '../utils/function';
import bookingService from '../services/booking';
import paymentService from '../services/payment';
import homestayService from '../services/homestay';
import { BookingStatus, PaymentStatus } from '../models/booking';

/**
 * Lấy danh sách tất cả đặt phòng với thông tin chi tiết (cho admin)
 */
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    let bookings;

    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      bookings = await bookingService.getBookingsByStatus(status as BookingStatus);
    } else {
      bookings = await bookingService.getAllBookings();
    }

    return res.json(createResponse(true, 'Lấy danh sách đặt phòng thành công', bookings));
  } catch (error) {
    console.error('Lỗi lấy danh sách đặt phòng:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi lấy danh sách đặt phòng'));
  }
};

/**
 * Lấy thống kê tổng quan (cho admin dashboard)
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Lấy số đặt phòng theo trạng thái
    const pendingCount = await bookingService.countBookingsByStatus(BookingStatus.PENDING);
    const confirmedCount = await bookingService.countBookingsByStatus(BookingStatus.CONFIRMED);
    const paymentPendingCount = await bookingService.countBookingsByStatus(BookingStatus.PAYMENT_PENDING);
    const rentedCount = await bookingService.countBookingsByStatus(BookingStatus.RENTED);
    const cancelledCount = await bookingService.countBookingsByStatus(BookingStatus.CANCELLED);

    // Lấy tổng số homestay
    const homestayCount = await homestayService.countHomestays();

    // Lấy tổng doanh thu (từ các đặt phòng đã xác nhận thanh toán)
    const totalRevenue = await bookingService.calculateTotalRevenue();

    // Lấy đặt phòng mới nhất đang chờ xác nhận thanh toán
    const pendingPayments = await bookingService.getRecentPendingPayments(5);

    const stats = {
      bookings: {
        pending: pendingCount,
        confirmed: confirmedCount,
        paymentPending: paymentPendingCount,
        rented: rentedCount,
        cancelled: cancelledCount,
        total: pendingCount + confirmedCount + paymentPendingCount + rentedCount + cancelledCount
      },
      homestays: {
        total: homestayCount
      },
      revenue: {
        total: totalRevenue
      },
      recentPendingPayments: pendingPayments
    };

    return res.json(createResponse(true, 'Lấy thống kê thành công', stats));
  } catch (error) {
    console.error('Lỗi lấy thống kê dashboard:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi lấy thống kê'));
  }
};

/**
 * Xác nhận hoặc từ chối đặt phòng
 */
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const booking = await bookingService.adminUpdateBookingStatus(id, status, notes);

    return res.json(createResponse(true, 'Cập nhật trạng thái đặt phòng thành công', booking));
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đặt phòng:', error);

    if (error instanceof Error && error.message === 'Đặt phòng không tồn tại') {
      return res.status(404).json(createResponse(false, 'Đặt phòng không tồn tại'));
    }

    return res.status(500).json(createResponse(false, 'Lỗi khi cập nhật trạng thái đặt phòng'));
  }
};

/**
 * Lấy danh sách các thanh toán đang chờ xác nhận từ admin
 */
export const getPaymentApprovals = async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getBookingsWithPaymentStatus(PaymentStatus.WAITING_APPROVAL);

    return res.json(createResponse(true, 'Lấy danh sách thanh toán chờ duyệt thành công', bookings));
  } catch (error) {
    console.error('Lỗi lấy danh sách thanh toán chờ duyệt:', error);
    return res.status(500).json(createResponse(false, 'Lỗi khi lấy danh sách thanh toán chờ duyệt'));
  }
};
