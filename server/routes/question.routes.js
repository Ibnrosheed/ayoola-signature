import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getProductQuestions,
  createQuestion,
  createAnswer,
} from '../controllers/question.controller.js';

const router = express.Router({ mergeParams: true });

// Public product questions & answers
router.get('/', getProductQuestions);

// Protected — post question
router.post('/', protect, createQuestion);

// Protected — post answer to a question
router.post('/:questionId/answers', protect, createAnswer);

export default router;
