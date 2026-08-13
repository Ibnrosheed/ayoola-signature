import express from 'express';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  getProductReviews,
  getProductReviewSummary,
  createReview,
  updateReview,
  deleteReview,
  checkReviewEligibility,
  toggleHelpfulVote,
  reportReview,
} from '../controllers/review.controller.js';

const router = express.Router({ mergeParams: true }); // mergeParams for :productId

// Public — get approved reviews + summary for a product (optional auth for helpful state)
router.get('/', optionalAuth, getProductReviews);
router.get('/summary', getProductReviewSummary);

// Protected — eligibility check & create (with image upload support)
router.get('/eligibility', protect, checkReviewEligibility);
router.post('/', protect, upload.array('images', 5), createReview);

export default router;
