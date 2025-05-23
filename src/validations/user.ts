import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateUpdateProfile = [
  body('firstName')
    .optional()
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('lastName')
    .optional()
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('profilePicture').optional().isURL().withMessage('Profile picture must be a valid URL'),
  body('newPassword')
    .optional()
    .isString()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirmNewPassword')
    .optional()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateForgotPassword = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateResetPassword = [
  body('token').notEmpty().withMessage('Token đặt lại mật khẩu là bắt buộc'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Mật khẩu xác nhận không khớp');
    }
    return true;
  }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
