import mongoose from 'mongoose';
import { slugify } from './category.model.js';

/**
 * Variant subdocument — embedded on Product for atomic reads
 * Discount precedence: variantDiscount > productDiscount > none
 */
const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'Variant SKU is required'],
      uppercase: true,
      trim: true,
    },
    attributes: {
      // Flexible key-value pairs e.g. { "size": "42", "color": "Black" }
      type: Map,
      of: String,
      default: {},
    },
    price: {
      type: Number,
      default: null, // null = inherit parent product price
      min: [0, 'Variant price cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    finalPrice: {
      type: Number,
      default: null,
    },
    quantity: {
      type: Number,
      required: [true, 'Variant stock quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    finalPrice: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    quantity: {
      type: Number,
      required: [true, 'Product stock quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    bestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: '{VALUE} is not a valid product status',
      },
      default: 'active',
      index: true,
    },
    // Phase 8: Product Variants
    variants: {
      type: [variantSchema],
      default: [],
    },
    hasVariants: {
      type: Boolean,
      default: false,
    },
    // Phase 8: Rating Summary (maintained by review aggregation)
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratingDistribution: {
      type: Map,
      of: Number,
      default: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for fast server-side searching
productSchema.index({
  name: 'text',
  sku: 'text',
  description: 'text',
  shortDescription: 'text',
});

// Pre-validate hook to calculate finalPrice and generate slug
productSchema.pre('validate', function (next) {
  // Generate slug if name is set/modified
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name);
  }

  // Calculate parent product finalPrice on the backend
  if (this.price !== undefined) {
    const discountPercent = this.discount || 0;
    this.finalPrice = Math.max(0, Math.round(this.price * (1 - discountPercent / 100)));
  }

  // Recalculate variant finalPrices
  if (this.variants && this.variants.length > 0) {
    this.hasVariants = true;
    for (const variant of this.variants) {
      const vPrice = variant.price !== null && variant.price !== undefined ? variant.price : this.price;
      const vDiscount = variant.discount || 0;
      variant.finalPrice = Math.max(0, Math.round(vPrice * (1 - vDiscount / 100)));
    }
  } else {
    this.hasVariants = false;
  }

  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
