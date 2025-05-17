import express from 'express';
import * as paymentController from '../controllers/payment';
import { authenticateJWT, authorizeAdmin } from '../middlewares/auth';

const router = express.Router();

// Khởi tạo thanh toán cho đặt phòng
router.post('/bookings/:id/payments', authenticateJWT, paymentController.initiatePayment);

// Lấy thông tin thanh toán của đặt phòng
router.get('/bookings/:id/payments', authenticateJWT, paymentController.getPaymentInfo);

// [ADMIN] Cập nhật trạng thái thanh toán
router.patch('/bookings/:id/payments', authenticateJWT, authorizeAdmin, paymentController.updatePaymentStatus);

// [ADMIN] Xác nhận thanh toán
router.post('/bookings/:id/payments/verify', authenticateJWT, authorizeAdmin, paymentController.verifyPayment);

export default router;
