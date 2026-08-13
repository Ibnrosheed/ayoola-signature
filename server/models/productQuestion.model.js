import mongoose from 'mongoose';

const productQuestionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      minlength: [5, 'Question must be at least 5 characters'],
      maxlength: [500, 'Question cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true,
    },
    isAnswered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

productQuestionSchema.index({ product: 1, status: 1, createdAt: -1 });

const ProductQuestion = mongoose.model('ProductQuestion', productQuestionSchema);

export default ProductQuestion;
