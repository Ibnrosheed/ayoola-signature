import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  getAdminReviews,
  moderateReview,
  toggleFeatureReview,
  adminRespondReview,
  getReviewReports,
  moderateReviewReport,
  deleteAdminReview,
} from '../controllers/adminReview.controller.js';

const router = express.Router();

router.use(protect, authorize('admin', 'superadmin'));

router.get('/', getAdminReviews);
router.patch('/:id/moderate', moderateReview);
router.patch('/:id/feature', toggleFeatureReview);
router.post('/:id/respond', adminRespondReview);

router.get('/reports', getReviewReports);
router.patch('/reports/:id', moderateReviewReport);

router.delete('/:id', deleteAdminReview);

export default router;
