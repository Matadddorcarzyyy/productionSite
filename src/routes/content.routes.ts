import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const contentController = new ContentController();

// Public route - get content for frontend
router.get('/public', contentController.getPublicContent.bind(contentController));

// Admin routes - require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

// Get all content
router.get('/', contentController.getAllContent.bind(contentController));

// Get content by key
router.get('/:key', contentController.getContentByKey.bind(contentController));

// Create or update content
router.post(
  '/',
  [
    body('key').notEmpty().withMessage('Key is required'),
    body('language').notEmpty().withMessage('Language is required'),
    body('value').notEmpty().withMessage('Value is required'),
    validate,
  ],
  contentController.upsertContent.bind(contentController)
);

// Update content
router.put(
  '/:key',
  [
    body('language').notEmpty().withMessage('Language is required'),
    validate,
  ],
  contentController.updateContent.bind(contentController)
);

// Delete content
router.delete('/:key', contentController.deleteContent.bind(contentController));

export default router;

