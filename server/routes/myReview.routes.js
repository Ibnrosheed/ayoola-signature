import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  updateReview,
  deleteReview,
  getMyReviews,
  toggleHelpfulVote,
  reportReview,
} from '../controllers/review.controller.js';

const router = express.Router();

// Customer's own reviews
router.get('/my', protect, getMyReviews);
router.put('/:id', protect, upload.array('images', 5), updateReview);
router.delete('/:id', protect, deleteReview);

// Helpful voting & reporting
router.post('/:id/helpful', protect, toggleHelpfulVote);
router.delete('/:id/helpful', protect, toggleHelpfulVote);
router.post('/:id/report', protect, reportReview);

export default router;
