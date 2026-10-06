import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getClasses,
  getClassById,
  createClass,
  getClassAnalyticsEndpoint,
} from '../controllers/class.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getClasses);
router.post('/', createClass);
router.get('/:id', getClassById);
router.get('/:classId/analytics', getClassAnalyticsEndpoint);

export default router;
