import express from 'express';
import { 
  createBooking, 
  getUserBookings, 
  getBookingById, 
  verifyBooking, 
  updateBookingStatus 
} from '../controllers/booking';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../models/user';

const router = express.Router();

// POST /api/bookings - Tạo đặt phòng mới
router.post('/', authenticate, createBooking);

// GET /api/bookings/user - Lấy danh sách đặt phòng của người dùng đăng nhập
router.get('/user', authenticate, getUserBookings);

// GET /api/bookings/:id - Lấy chi tiết đặt phòng theo ID
router.get('/:id', authenticate, getBookingById);

// GET /api/bookings/verify/:token - Xác nhận đặt phòng qua token
router.get('/verify/:token', verifyBooking);

// PUT /api/bookings/:id/status - Cập nhật trạng thái đặt phòng (admin)
router.put('/:id/status', authenticate, authorize([UserRole.ADMIN]), updateBookingStatus);

export default router;
