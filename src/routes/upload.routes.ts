import { Router } from 'express';
import { UploadController, uploadSingle, uploadMultiple } from '../controllers/upload.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const uploadController = new UploadController();

// Загрузка одного изображения (только для админов)
router.post(
  '/single',
  authenticate,
  authorize('SUPER_ADMIN', 'CLINIC_ADMIN'),
  uploadSingle,
  uploadController.uploadImage.bind(uploadController)
);

// Загрузка нескольких изображений
router.post(
  '/multiple',
  authenticate,
  authorize('SUPER_ADMIN', 'CLINIC_ADMIN'),
  uploadMultiple,
  uploadController.uploadMultipleImages.bind(uploadController)
);

export default router;

