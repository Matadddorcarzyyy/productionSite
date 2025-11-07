import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const adminController = new AdminController();

// All routes require SUPER_ADMIN role
router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

// Statistics
router.get('/statistics', adminController.getStatistics.bind(adminController));

// Users management
router.get('/users', adminController.getAllUsers.bind(adminController));
router.post(
  '/users',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['PATIENT', 'CLINIC_ADMIN', 'DOCTOR', 'SUPER_ADMIN']).withMessage('Invalid role'),
    validate,
  ],
  adminController.createUser.bind(adminController)
);
router.get('/users/:id', adminController.getUserById.bind(adminController));
router.put('/users/:id', adminController.updateUser.bind(adminController));
router.put(
  '/users/:id/password',
  [
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    validate,
  ],
  adminController.changePassword.bind(adminController)
);
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

// Clinics management
router.get('/clinics', adminController.getAllClinicsAdmin.bind(adminController));
router.put('/clinics/:id/verify', adminController.verifyClinic.bind(adminController));

export default router;

