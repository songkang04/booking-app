import { Router } from 'express';
import {
  createHomestay,
  updateHomestay,
  deleteHomestay,
  getHomestayById,
  searchHomestays,
  getMyHomestays,
  getSimilarHomestays,
} from '../controllers/homestay';
import { authenticateJWT, authorize } from '../middlewares/auth';
import { UserRole } from '../schemas/user.schema';

const router = Router();

/**
 * @swagger
 * /homestays/search:
 *   get:
 *     summary: Search homestays
 *     tags: [Homestays]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location to search
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: capacity
 *         schema:
 *           type: number
 *         description: Capacity
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
 *     responses:
 *       200:
 *         description: List of homestays
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Homestay'
 */
router.get('/search', searchHomestays);

/**
 * @swagger
 * /homestays/{id}:
 *   get:
 *     summary: Get homestay by ID
 *     tags: [Homestays]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Homestay ID
 *     responses:
 *       200:
 *         description: Homestay details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Homestay'
 *       404:
 *         description: Homestay not found
 */
router.get('/:id', getHomestayById);

/**
 * @swagger
 * /homestays/{id}/similar:
 *   get:
 *     summary: Get similar homestays
 *     tags: [Homestays]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Homestay ID
 *     responses:
 *       200:
 *         description: List of similar homestays
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Homestay'
 */
router.get('/:id/similar', getSimilarHomestays);

/**
 * @swagger
 * /homestays:
 *   post:
 *     summary: Create a new homestay (Admin only)
 *     tags: [Homestays]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *               - description
 *               - price
 *               - capacity
 *             properties:
 *               title:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               capacity:
 *                 type: number
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Homestay created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Homestay'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post('/', authenticateJWT, authorize([UserRole.ADMIN]), createHomestay);

/**
 * @swagger
 * /homestays/{id}:
 *   put:
 *     summary: Update homestay (Admin only)
 *     tags: [Homestays]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               capacity:
 *                 type: number
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Homestay updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Homestay'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Homestay not found
 */
router.put('/:id', authenticateJWT, authorize([UserRole.ADMIN]), updateHomestay);

/**
 * @swagger
 * /homestays/{id}:
 *   delete:
 *     summary: Delete homestay (Admin only)
 *     tags: [Homestays]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Homestay deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Homestay not found
 */
router.delete('/:id', authenticateJWT, authorize([UserRole.ADMIN]), deleteHomestay);

/**
 * @swagger
 * /homestays/owner/my-homestays:
 *   get:
 *     summary: Get my homestays (Admin only)
 *     tags: [Homestays]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's homestays
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Homestay'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/owner/my-homestays', authenticateJWT, authorize([UserRole.ADMIN]), getMyHomestays);

export default router;