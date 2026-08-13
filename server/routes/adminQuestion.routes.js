import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  getAdminQuestions,
  adminAnswerQuestion,
  moderateQuestionStatus,
  deleteAdminQuestion,
} from '../controllers/adminQuestion.controller.js';

const router = express.Router();

router.use(protect, authorize('admin', 'superadmin'));

router.get('/', getAdminQuestions);
router.post('/:id/answers', adminAnswerQuestion);
router.patch('/:id/status', moderateQuestionStatus);
router.delete('/:id', deleteAdminQuestion);

export default router;
