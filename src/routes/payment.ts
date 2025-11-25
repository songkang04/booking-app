import express from 'express';
import * as paymentController from '../controllers/payment';
import { authenticateJWT, authorizeAdmin } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * /payments/bookings/{id}/payments:
 *   post:
 *     summary: Initiate payment for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum:
 *                   - credit_card
 *                   - bank_transfer
 *                   - wallet
 *     responses:
 *       201:
 *         description: Payment initiated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.post('/bookings/:id/payments', authenticateJWT, paymentController.initiatePayment);

/**
 * @swagger
 * /payments/bookings/{id}/payments:
 *   get:
 *     summary: Get payment info for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Payment information
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */
router.get('/bookings/:id/payments', authenticateJWT, paymentController.getPaymentInfo);

/**
 * @swagger
 * /payments/bookings/{id}/payments:
 *   patch:
 *     summary: Update payment status (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - processing
 *                   - completed
 *                   - failed
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Payment not found
 */
router.patch('/bookings/:id/payments', authenticateJWT, authorizeAdmin, paymentController.updatePaymentStatus);

/**
 * @swagger
 * /payments/bookings/{id}/payments/verify:
 *   post:
 *     summary: Verify payment (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Payment not found
 */
router.post('/bookings/:id/payments/verify', authenticateJWT, authorizeAdmin, paymentController.verifyPayment);

export default router;
