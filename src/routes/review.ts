import { Router } from 'express';
import {
  createReview,
  updateReview,
  deleteReview,
  getHomestayReviews,
  responseToReview
} from '../controllers/review';
import { authenticateJWT, authorize } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /reviews/homestay/{homestayId}:
 *   get:
 *     summary: Get reviews for a homestay
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: homestayId
 *         required: true
 *         schema:
 *           type: string
 *         description: Homestay ID
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 */
router.get('/homestay/:homestayId', getHomestayReviews);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - homestay
 *               - rating
 *               - comment
 *             properties:
 *               homestay:
 *                 type: string
 *                 description: Homestay ID
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateJWT, createReview);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.put('/:id', authenticateJWT, updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.delete('/:id', authenticateJWT, deleteReview);

/**
 * @swagger
 * /reviews/{id}/response:
 *   post:
 *     summary: Respond to a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.post('/:id/response', authenticateJWT, responseToReview);

export default router;
