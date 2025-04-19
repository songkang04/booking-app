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
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../models/user';

const router = Router();

// Public routes
router.get('/search', searchHomestays);
router.get('/:id', getHomestayById);
router.get('/:id/similar', getSimilarHomestays);

// Protected routes
router.use(authenticate);

// Owner/Admin only routes
router.post('/', authorize([UserRole.ADMIN]), createHomestay);
router.put('/:id', authorize([UserRole.ADMIN]), updateHomestay);
router.delete('/:id', authorize([UserRole.ADMIN]), deleteHomestay);
router.get('/owner/my-homestays', authorize([UserRole.ADMIN]), getMyHomestays);

export default router;