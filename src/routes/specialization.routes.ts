import { Router } from 'express';
import { SpecializationController } from '../controllers/specialization.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const specializationController = new SpecializationController();

// Get all specializations (public)
router.get('/', specializationController.getAll.bind(specializationController));

// Get specialization by ID (public)
router.get('/:id', specializationController.getById.bind(specializationController));

// Create specialization (admin only)
router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    validate
  ],
  specializationController.create.bind(specializationController)
);

// Update specialization (admin only)
router.put(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  specializationController.update.bind(specializationController)
);

// Delete specialization (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  specializationController.delete.bind(specializationController)
);

export default router;







