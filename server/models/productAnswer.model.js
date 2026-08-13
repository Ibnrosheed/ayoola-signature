import mongoose from 'mongoose';

const productAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductQuestion',
      required: [true, 'Question reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
      minlength: [2, 'Answer must be at least 2 characters'],
      maxlength: [2000, 'Answer cannot exceed 2000 characters'],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerifiedBuyer: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true,
    },
  },
  { timestamps: true }
);

productAnswerSchema.index({ question: 1, status: 1, createdAt: 1 });

const ProductAnswer = mongoose.model('ProductAnswer', productAnswerSchema);

export default ProductAnswer;
