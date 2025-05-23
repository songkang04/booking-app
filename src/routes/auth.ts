import { Router } from 'express';
import {
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
  updateProfile,
  verifyEmail
} from '../controllers/auth';
import { authenticateJWT } from '../middlewares/auth';
import {
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
} from '../validations/user';
import { rateLimit } from '../middlewares/rateLimit';

const router = Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateJWT, me);
router.put('/update-profile', authenticateJWT, validateUpdateProfile, updateProfile);
router.post('/forgot-password', rateLimit, validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.post('/verify-email', verifyEmail);

export default router;
