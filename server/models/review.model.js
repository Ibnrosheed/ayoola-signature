import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'published', 'rejected', 'hidden', 'deleted'],
        message: '{VALUE} is not a valid review status',
      },
      default: 'pending',
      index: true,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false, // Set server-side only
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reportedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    adminResponse: {
      comment: { type: String, trim: true },
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      respondedAt: { type: Date },
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: {
      type: Date,
    },
    moderationNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per product per order
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

// Fast lookup for product review pages and featured reviews
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ product: 1, isFeatured: -1, status: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
