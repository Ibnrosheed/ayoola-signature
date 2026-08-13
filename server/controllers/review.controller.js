import mongoose from 'mongoose';
import Review from '../models/review.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import ReviewHelpfulVote from '../models/reviewHelpfulVote.model.js';
import ReviewReport from '../models/reviewReport.model.js';

/**
 * Recalculate and persist ratingAverage + ratingCount on a product
 */
const updateProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: { $in: ['approved', 'published'] } } },
    {
      $group: {
        _id: '$product',
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingAverage: Math.round(result[0].avg * 10) / 10,
      ratingCount: result[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { ratingAverage: 0, ratingCount: 0 });
  }
};

/**
 * @route  GET /api/products/:productId/reviews
 * @desc   Get paginated published/approved reviews for a product with sorting & filters
 * @access Public (Optional Auth to check user helpful votes)
 */
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const rating = parseInt(req.query.rating, 10) || null;
    const verified = req.query.verified === 'true';
    const withPhotos = req.query.photos === 'true';
    const sort = req.query.sort || 'newest';

    const query = {
      product: productId,
      status: { $in: ['approved', 'published'] },
    };

    if (rating && rating >= 1 && rating <= 5) query.rating = rating;
    if (verified) query.isVerifiedPurchase = true;
    if (withPhotos) query['images.0'] = { $exists: true };

    const sortMap = {
      newest: { isFeatured: -1, createdAt: -1 },
      oldest: { isFeatured: -1, createdAt: 1 },
      highest: { isFeatured: -1, rating: -1, createdAt: -1 },
      lowest: { isFeatured: -1, rating: 1, createdAt: -1 },
      helpful: { isFeatured: -1, helpfulCount: -1, createdAt: -1 },
      verified: { isFeatured: -1, isVerifiedPurchase: -1, createdAt: -1 },
    };
    const sortQuery = sortMap[sort] || sortMap.newest;

    const total = await Review.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    let reviews = await Review.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName')
      .populate('adminResponse.respondedBy', 'firstName lastName')
      .lean();

    // Check user helpful votes if user is logged in
    let userVotedSet = new Set();
    if (req.user?._id && reviews.length > 0) {
      const reviewIds = reviews.map((r) => r._id);
      const userVotes = await ReviewHelpfulVote.find({
        user: req.user._id,
        review: { $in: reviewIds },
      }).select('review');
      userVotedSet = new Set(userVotes.map((v) => v.review.toString()));
    }

    reviews = reviews.map((r) => ({
      ...r,
      isUserHelpful: userVotedSet.has(r._id.toString()),
    }));

    // Rating distribution & statistics
    const distribution = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          status: { $in: ['approved', 'published'] },
        },
      },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) dist[d._id] = d.count;

    // Photos count
    const totalPhotosCount = await Review.countDocuments({
      product: productId,
      status: { $in: ['approved', 'published'] },
      'images.0': { $exists: true },
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        distribution: dist,
        totalPhotosCount,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/products/:productId/reviews/summary
 * @desc   Get rating summary & image gallery for a product
 * @access Public
 */
export const getProductReviewSummary = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).select('ratingAverage ratingCount').lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const distribution = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          status: { $in: ['approved', 'published'] },
        },
      },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) dist[d._id] = d.count;

    // Extract all customer review images
    const photoReviews = await Review.find({
      product: productId,
      status: { $in: ['approved', 'published'] },
      'images.0': { $exists: true },
    })
      .select('images rating user title createdAt')
      .populate('user', 'firstName lastName')
      .limit(10)
      .lean();

    const customerPhotos = photoReviews.flatMap((r) =>
      (r.images || []).map((img) => ({
        url: img,
        rating: r.rating,
        title: r.title,
        userName: r.user ? `${r.user.firstName} ${r.user.lastName ? r.user.lastName[0] + '.' : ''}` : 'Customer',
        createdAt: r.createdAt,
      }))
    );

    res.status(200).json({
      success: true,
      data: {
        averageRating: product.ratingAverage || 0,
        totalReviews: product.ratingCount || 0,
        distribution: dist,
        customerPhotos,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/reviews/my
 * @desc   Get authenticated customer's own reviews
 * @access Private (Customer)
 */
export const getMyReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const total = await Review.countDocuments({ user: req.user._id });
    const pages = Math.ceil(total / limit) || 1;

    const reviews = await Review.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name images slug')
      .lean();

    res.status(200).json({
      success: true,
      data: { reviews, pagination: { page, limit, total, pages } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/products/:productId/reviews/eligibility
 * @desc   Check if authenticated user is eligible to review this product
 * @access Private
 */
export const checkReviewEligibility = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    // Find a paid order containing this product
    const order = await Order.findOne({
      user: userId,
      paymentStatus: 'successful',
      'items.product': productId,
    }).sort({ createdAt: -1 }).lean();

    if (!order) {
      return res.status(200).json({
        success: true,
        data: { eligible: false, reason: 'no_purchase', message: 'You have not purchased this product.' },
      });
    }

    // Check if already reviewed for this product+order combo
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
      order: order._id,
    }).lean();

    if (existingReview) {
      return res.status(200).json({
        success: true,
        data: {
          eligible: false,
          reason: 'already_reviewed',
          message: 'You have already submitted a review for this purchase.',
          existingReview,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        eligible: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/products/:productId/reviews
 * @desc   Submit a review with optional image uploads (verified-purchase gate enforced server-side)
 * @access Private (Customer)
 */
export const createReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment, orderId } = req.body;
    const userId = req.user._id;

    // Handle image file attachments if uploaded via multer
    const uploadedImages = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.slice(0, 5).forEach((file) => {
        uploadedImages.push(`/uploads/reviews/${file.filename}`);
      });
    }

    // Validate inputs
    const parsedRating = parseInt(rating, 10);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Review title is required (min 3 chars)' });
    }
    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Review comment must be at least 10 characters' });
    }
    if (comment.trim().length > 2000) {
      return res.status(400).json({ success: false, message: 'Review comment cannot exceed 2000 characters' });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Server-side verified purchase check — NEVER trust frontend
    const orderQuery = {
      user: userId,
      paymentStatus: 'successful',
      'items.product': productId,
    };
    if (orderId) orderQuery._id = orderId;

    const order = await Order.findOne(orderQuery);
    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products from completed purchases.',
      });
    }

    // Check for duplicate review (same user + product + order)
    const existing = await Review.findOne({ user: userId, product: productId, order: order._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a review for this product purchase.',
        data: { existingReview: existing },
      });
    }

    const review = await Review.create({
      user: userId,
      product: productId,
      order: order._id,
      rating: parsedRating,
      title: title.trim(),
      comment: comment.trim(),
      images: uploadedImages,
      status: 'pending', // Starts pending moderation
      isVerifiedPurchase: true, // Backend verified
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your review has been submitted for moderation.',
      data: { review },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });
    }
    next(error);
  }
};

/**
 * @route  PUT /api/reviews/:id
 * @desc   Customer updates their own review
 * @access Private (Customer)
 */
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own reviews' });
    }
    if (review.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Rejected reviews cannot be edited' });
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const newImages = req.files.slice(0, 5).map((f) => `/uploads/reviews/${f.filename}`);
      review.images = newImages;
    }

    if (rating) {
      const r = parseInt(rating, 10);
      if (r < 1 || r > 5) return res.status(400).json({ success: false, message: 'Rating must be 1–5' });
      review.rating = r;
    }
    if (title) review.title = title.trim();
    if (comment) {
      if (comment.trim().length < 10) return res.status(400).json({ success: false, message: 'Comment too short' });
      review.comment = comment.trim();
    }

    review.isEdited = true;
    review.status = 'pending'; // Re-submit for moderation
    await review.save();

    await updateProductRating(review.product);

    res.status(200).json({
      success: true,
      message: 'Review updated and resubmitted for moderation',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  DELETE /api/reviews/:id
 * @desc   Customer deletes their own review
 * @access Private (Customer)
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
    }

    const productId = review.product;
    await review.deleteOne();
    await ReviewHelpfulVote.deleteMany({ review: id });
    await updateProductRating(productId);

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/reviews/:id/helpful
 * @desc   Toggle helpful vote on a review
 * @access Private (Authenticated User)
 */
export const toggleHelpfulVote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const existingVote = await ReviewHelpfulVote.findOne({ review: id, user: userId });

    if (existingVote) {
      // Remove vote
      await existingVote.deleteOne();
      review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1);
      await review.save();
      return res.status(200).json({
        success: true,
        message: 'Helpful vote removed',
        data: { helpfulCount: review.helpfulCount, isHelpful: false },
      });
    } else {
      // Add vote
      await ReviewHelpfulVote.create({ review: id, user: userId });
      review.helpfulCount = (review.helpfulCount || 0) + 1;
      await review.save();
      return res.status(200).json({
        success: true,
        message: 'Marked as helpful',
        data: { helpfulCount: review.helpfulCount, isHelpful: true },
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already voted on this review.' });
    }
    next(error);
  }
};

/**
 * @route  POST /api/reviews/:id/report
 * @desc   Report an inappropriate review
 * @access Private (Authenticated User)
 */
export const reportReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const validReasons = ['spam', 'offensive', 'false_information', 'personal_information', 'advertisement', 'other'];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid reason for reporting.' });
    }

    const existingReport = await ReviewReport.findOne({ review: id, user: userId });
    if (existingReport) {
      return res.status(409).json({ success: false, message: 'You have already reported this review.' });
    }

    await ReviewReport.create({
      review: id,
      user: userId,
      reason,
      description: description ? description.trim() : '',
    });

    review.reportedCount = (review.reportedCount || 0) + 1;
    await review.save();

    res.status(201).json({
      success: true,
      message: 'Thank you for flagging this review. Our moderation team will investigate.',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reported this review.' });
    }
    next(error);
  }
};

export { updateProductRating };
