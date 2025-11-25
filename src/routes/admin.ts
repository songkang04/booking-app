import express from 'express';
import * as adminController from '../controllers/admin';
import { authenticateJWT, authorizeAdmin } from '../middlewares/auth';

const router = express.Router();

// Middleware bảo vệ tất cả các route admin
router.use(authenticateJWT, authorizeAdmin);

/**
 * @swagger
 * /admin/bookings:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - confirmed
 *             - cancelled
 *             - completed
 *     responses:
 *       200:
 *         description: List of all bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/bookings', adminController.getAllBookings);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalBookings:
 *                   type: number
 *                 totalRevenue:
 *                   type: number
 *                 totalUsers:
 *                   type: number
 *                 totalHomestays:
 *                   type: number
 *                 pendingBookings:
 *                   type: number
 *                 completedBookings:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/dashboard', adminController.getDashboardStats);

/**
 * @swagger
 * /admin/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status (Admin only)
 *     tags: [Admin]
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
 *                   - confirmed
 *                   - cancelled
 *                   - completed
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Booking not found
 */
router.patch('/bookings/:id/status', adminController.updateBookingStatus);

/**
 * @swagger
 * /admin/bookings/payment-approvals:
 *   get:
 *     summary: Get pending payment approvals (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending payment approvals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/bookings/payment-approvals', adminController.getPaymentApprovals);

export default router;
