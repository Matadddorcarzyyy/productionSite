import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const authController = new AuthController();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['PATIENT', 'CLINIC_ADMIN', 'DOCTOR']).withMessage('Invalid role'),
    validate
  ],
  authController.register.bind(authController)
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
  ],
  authController.login.bind(authController)
);

// Get current user
router.get('/me', authenticate, authController.getMe.bind(authController));

// Logout
router.post('/logout', authController.logout.bind(authController));

export default router;







