import { Router } from 'express';
import { ClinicController } from '../controllers/clinic.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const clinicController = new ClinicController();

// Get all clinics (public)
router.get('/', clinicController.getAll.bind(clinicController));

// Get clinic by ID (public)
router.get('/:id', clinicController.getById.bind(clinicController));

// Get clinic doctors (public)
router.get('/:id/doctors', clinicController.getDoctors.bind(clinicController));

// Create clinic (authenticated - CLINIC_ADMIN)
router.post(
  '/',
  authenticate,
  authorize('CLINIC_ADMIN', 'SUPER_ADMIN'),
  [
    body('name').notEmpty().withMessage('Clinic name is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('latitude').isFloat().withMessage('Valid latitude is required'),
    body('longitude').isFloat().withMessage('Valid longitude is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    validate
  ],
  clinicController.create.bind(clinicController)
);

// Update clinic
router.put(
  '/:id',
  authenticate,
  authorize('CLINIC_ADMIN', 'SUPER_ADMIN'),
  clinicController.update.bind(clinicController)
);

// Delete clinic
router.delete(
  '/:id',
  authenticate,
  authorize('CLINIC_ADMIN', 'SUPER_ADMIN'),
  clinicController.delete.bind(clinicController)
);

export default router;







