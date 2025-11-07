import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const doctorController = new DoctorController();

// Get all doctors (public)
router.get('/', doctorController.getAll.bind(doctorController));

// Get doctor by ID (public)
router.get('/:id', doctorController.getById.bind(doctorController));

// Get available slots (public)
router.get('/:id/available-slots', doctorController.getAvailableSlots.bind(doctorController));

// Create doctor (clinic admin only)
router.post(
  '/',
  authenticate,
  authorize('CLINIC_ADMIN', 'SUPER_ADMIN'),
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('clinicId').notEmpty().withMessage('Clinic ID is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('specializationIds').isArray().withMessage('Specialization IDs must be an array'),
    validate
  ],
  doctorController.create.bind(doctorController)
);

// Update doctor
router.put(
  '/:id',
  authenticate,
  authorize('CLINIC_ADMIN', 'SUPER_ADMIN'),
  doctorController.update.bind(doctorController)
);

// Delete doctor
router.delete(
  '/:id',
  authenticate,
  authorize('CLINIC_ADMIN', 'SUPER_ADMIN'),
  doctorController.delete.bind(doctorController)
);

// Create/update schedule
router.post(
  '/:id/schedule',
  authenticate,
  authorize('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN'),
  [
    body('schedules').isArray().withMessage('Schedules must be an array'),
    validate
  ],
  doctorController.createSchedule.bind(doctorController)
);

// Update availabilities (specific dates)
router.post(
  '/:id/availabilities',
  authenticate,
  authorize('DOCTOR'),
  [
    body('availabilities').isArray().withMessage('Availabilities must be an array'),
    validate
  ],
  doctorController.updateAvailabilities.bind(doctorController)
);

// Get availabilities
router.get(
  '/:id/availabilities',
  authenticate,
  authorize('DOCTOR'),
  doctorController.getAvailabilities.bind(doctorController)
);

// Delete availability
router.delete(
  '/:id/availabilities/:availabilityId',
  authenticate,
  authorize('DOCTOR'),
  doctorController.deleteAvailability.bind(doctorController)
);

export default router;







