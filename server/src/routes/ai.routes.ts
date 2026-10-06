import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  analyzeStudentRiskEndpoint,
  analyzeClassRiskEndpoint,
  generateParentMessageEndpoint,
} from '../controllers/ai.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/analyze-student-risk', analyzeStudentRiskEndpoint);
router.post('/analyze-class-risk', analyzeClassRiskEndpoint);
router.post('/generate-parent-message', generateParentMessageEndpoint);

export default router;
