import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  verifyBooking,
  updateBookingStatus,
  confirmPayment
} from '../controllers/booking';
import { authenticateJWT, authorize } from '../middlewares/auth';
import { UserRole } from '../models/user';

const router = express.Router();

// POST /api/bookings - Tạo đặt phòng mới
router.post('/', authenticateJWT, createBooking);

// GET /api/bookings/user - Lấy danh sách đặt phòng của người dùng đăng nhập
router.get('/user', authenticateJWT, getUserBookings);

// GET /api/bookings/:id - Lấy chi tiết đặt phòng theo ID
router.get('/:id', authenticateJWT, getBookingById);

// GET /api/bookings/verify/:token - Xác nhận đặt phòng qua token
router.get('/verify/:token', verifyBooking);

// POST /api/bookings/:id/payment-confirmation - Xác nhận người dùng đã thanh toán
router.post('/:id/payment-confirmation', authenticateJWT, confirmPayment);

// PUT /api/bookings/:id/status - Cập nhật trạng thái đặt phòng (admin)
router.put('/:id/status', authenticateJWT, authorize([UserRole.ADMIN]), updateBookingStatus);

export default router;
