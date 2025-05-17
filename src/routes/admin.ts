import express from 'express';
import * as adminController from '../controllers/admin';
import { authenticateJWT, authorizeAdmin } from '../middlewares/auth';

const router = express.Router();

// Middleware bảo vệ tất cả các route admin
router.use(authenticateJWT, authorizeAdmin);

// Lấy danh sách đặt phòng
router.get('/bookings', adminController.getAllBookings);

// Lấy thống kê dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Cập nhật trạng thái đặt phòng
router.patch('/bookings/:id/status', adminController.updateBookingStatus);

// Lấy danh sách thanh toán chờ xác nhận
router.get('/bookings/payment-approvals', adminController.getPaymentApprovals);

export default router;
