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

// Public routes
router.get('/homestay/:homestayId', getHomestayReviews);

// Protected routes
router.use(authenticateJWT);

// User routes
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

// Owner routes
router.post('/:id/response', responseToReview);

export default router;
