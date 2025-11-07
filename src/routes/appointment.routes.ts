import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const appointmentController = new AppointmentController();

// Get all appointments (authenticated)
router.get('/', authenticate, appointmentController.getAll.bind(appointmentController));

// Get appointment by ID
router.get('/:id', appointmentController.getById.bind(appointmentController));

// Create appointment
router.post(
  '/',
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('clinicId').notEmpty().withMessage('Clinic ID is required'),
    body('dateTime').isISO8601().withMessage('Valid date time is required'),
    validate
  ],
  appointmentController.create.bind(appointmentController)
);

// Confirm appointment with SMS code
router.post(
  '/:id/confirm',
  [
    body('code').notEmpty().withMessage('Confirmation code is required'),
    validate
  ],
  appointmentController.confirm.bind(appointmentController)
);

// Update appointment
router.put(
  '/:id',
  authenticate,
  appointmentController.update.bind(appointmentController)
);

// Cancel appointment
router.delete(
  '/:id',
  authenticate,
  appointmentController.cancel.bind(appointmentController)
);

// Get clinic calendar (admin only)
router.get(
  '/clinic/:clinicId/calendar',
  authenticate,
  authorize('CLINIC_ADMIN', 'SUPER_ADMIN'),
  appointmentController.getClinicCalendar.bind(appointmentController)
);

export default router;







