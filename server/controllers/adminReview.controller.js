import Review from '../models/review.model.js';
import ReviewReport from '../models/reviewReport.model.js';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import AuditLog from '../models/auditLog.model.js';
import { updateProductRating } from './review.controller.js';

/**
 * @route  GET /api/admin/reviews
 * @desc   Get all reviews (paginated, filterable) for moderation
 * @access Admin, Superadmin
 */
export const getAdminReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
      if (req.query.status === 'published') {
        query.status = { $in: ['published', 'approved'] };
      } else {
        query.status = req.query.status;
      }
    }
    if (req.query.verified === 'true') query.isVerifiedPurchase = true;
    if (req.query.verified === 'false') query.isVerifiedPurchase = false;
    if (req.query.featured === 'true') query.isFeatured = true;
    if (req.query.rating) query.rating = parseInt(req.query.rating, 10);

    if (req.query.search && req.query.search.trim()) {
      const s = req.query.search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { comment: { $regex: s, $options: 'i' } },
      ];
    }

    const total = await Review.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name slug images')
      .populate('moderatedBy', 'firstName lastName')
      .populate('adminResponse.respondedBy', 'firstName lastName')
      .lean();

    // Summary counts
    const [pending, approved, rejected, hidden, reported] = await Promise.all([
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: { $in: ['approved', 'published'] } }),
      Review.countDocuments({ status: 'rejected' }),
      Review.countDocuments({ status: 'hidden' }),
      Review.countDocuments({ reportedCount: { $gt: 0 } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        summary: { pending, approved, rejected, hidden, reported, total: pending + approved + rejected + hidden },
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PATCH /api/admin/reviews/:id/moderate
 * @desc   Approve, publish, reject or hide a review
 * @access Admin, Superadmin
 */
export const moderateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const allowedStatuses = ['approved', 'published', 'rejected', 'hidden'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }

    const review = await Review.findById(id).populate('user', 'email firstName');
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const previousStatus = review.status;
    review.status = status;
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();
    if (note) review.moderationNote = note.trim();
    await review.save();

    await updateProductRating(review.product);

    // Create in-app / email notification for customer
    if (review.user?._id) {
      const isApproved = ['approved', 'published'].includes(status);
      try {
        await Notification.create({
          user: review.user._id,
          recipientEmail: review.user.email,
          type: 'review_moderated',
          channel: 'in_app',
          subject: isApproved ? 'Your Review Has Been Published!' : 'Update Regarding Your Product Review',
          body: isApproved
            ? `Your review for "${review.title}" has been approved and published on Ayoola Signature.`
            : `Your review for "${review.title}" was reviewed by our team and could not be published.`,
          relatedProduct: review.product,
          status: 'sent',
          sentAt: new Date(),
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr.message);
      }
    }

    // Audit log
    try {
      await AuditLog.create({
        user: req.user._id,
        action: 'REVIEW_MODERATED',
        resource: 'Review',
        resourceId: review._id.toString(),
        details: { previousStatus, newStatus: status, productId: review.product },
        ipAddress: req.ip || '',
      });
    } catch (auditErr) {
      console.error('Audit log failed:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Review marked as ${status}`,
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PATCH /api/admin/reviews/:id/feature
 * @desc   Toggle featured flag on a review
 * @access Admin, Superadmin
 */
export const toggleFeatureReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.isFeatured = !review.isFeatured;
    await review.save();

    res.status(200).json({
      success: true,
      message: review.isFeatured ? 'Review marked as featured' : 'Review unfeatured',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/admin/reviews/:id/respond
 * @desc   Add official administrator response to a review
 * @access Admin, Superadmin
 */
export const adminRespondReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Response comment is required' });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.adminResponse = {
      comment: comment.trim(),
      respondedBy: req.user._id,
      respondedAt: new Date(),
    };
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Admin response added',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/admin/review-reports
 * @desc   Get flagged/reported reviews list
 * @access Admin, Superadmin
 */
export const getReviewReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const total = await ReviewReport.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const reports = await ReviewReport.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'review',
        populate: [{ path: 'user', select: 'firstName lastName' }, { path: 'product', select: 'name slug' }],
      })
      .populate('user', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName')
      .lean();

    res.status(200).json({
      success: true,
      data: { reports, pagination: { page, limit, total, pages } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PATCH /api/admin/review-reports/:id
 * @desc   Resolve or dismiss a review report
 * @access Admin, Superadmin
 */
export const moderateReviewReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'resolve_hide_review' or 'dismiss'

    const report = await ReviewReport.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (action === 'resolve_hide_review') {
      report.status = 'resolved';
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
      await report.save();

      // Hide the reported review
      const review = await Review.findById(report.review);
      if (review) {
        review.status = 'hidden';
        await review.save();
        await updateProductRating(review.product);
      }
    } else {
      report.status = 'dismissed';
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
      await report.save();
    }

    res.status(200).json({
      success: true,
      message: `Report ${report.status}`,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  DELETE /api/admin/reviews/:id
 * @desc   Hard delete a review (admin)
 * @access Admin, Superadmin
 */
export const deleteAdminReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const productId = review.product;
    await review.deleteOne();
    await ReviewReport.deleteMany({ review: id });
    await updateProductRating(productId);

    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};
