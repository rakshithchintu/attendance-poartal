import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getSessionAttendance,
  submitBulkAttendance,
  getStudentAttendance,
  getAttendanceHistory,
} from '../controllers/attendance.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/session', getSessionAttendance);
router.post('/session', submitBulkAttendance);
router.get('/student/:id', getStudentAttendance);
router.get('/history', getAttendanceHistory);

export default router;
