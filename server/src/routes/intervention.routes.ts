import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getInterventions,
  createIntervention,
  updateIntervention,
} from '../controllers/intervention.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getInterventions);
router.post('/', createIntervention);
router.put('/:id', updateIntervention);

export default router;
