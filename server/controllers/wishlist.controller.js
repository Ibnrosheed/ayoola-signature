import Wishlist from '../models/wishlist.model.js';
import Product from '../models/product.model.js';
import { validateWishlistInput } from '../validators/wishlist.validator.js';

/**
 * Format Wishlist response
 */
export const formatWishlistResponse = (wishlistDoc) => {
  if (!wishlistDoc || !wishlistDoc.products) {
    return { products: [], count: 0 };
  }

  const validProducts = wishlistDoc.products
    .filter((prod) => prod && prod._id)
    .map((prod) => {
      const unitPrice = Number(prod.price) || 0;
      const discountPct = Number(prod.discount) || 0;
      const finalPrice = Math.max(0, Math.round(unitPrice * (1 - discountPct / 100)));

      return {
        id: prod._id,
        _id: prod._id,
        name: prod.name,
        slug: prod.slug,
        sku: prod.sku,
        images: prod.images || [],
        image: prod.images && prod.images.length > 0 ? prod.images[0] : '',
        price: unitPrice,
        discount: discountPct,
        finalPrice: finalPrice,
        quantityAvailable: prod.quantity,
        status: prod.status,
        inStock: prod.quantity > 0 && prod.status === 'active',
      };
    });

  return {
    products: validProducts,
    count: validProducts.length,
  };
};

/**
 * @route   GET /api/wishlist
 * @desc    Get user's wishlist items
 * @access  Private
 */
export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({
      success: true,
      data: formatWishlistResponse(wishlist),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/wishlist/:productId
 * @desc    Add product to user's wishlist
 * @access  Private
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { isValid, errors } = validateWishlistInput(productId);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const alreadyInWishlist = wishlist.products.some(
      (id) => id.toString() === productId.toString()
    );

    if (!alreadyInWishlist) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    const updatedWishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');

    res.status(200).json({
      success: true,
      message: alreadyInWishlist ? 'Product is already in your wishlist' : 'Product added to wishlist',
      data: formatWishlistResponse(updatedWishlist),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/wishlist/:productId
 * @desc    Remove product from user's wishlist
 * @access  Private
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId.toString()
    );
    await wishlist.save();

    const updatedWishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: formatWishlistResponse(updatedWishlist),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/wishlist
 * @desc    Clear entire wishlist
 * @access  Private
 */
export const clearWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully',
      data: { products: [], count: 0 },
    });
  } catch (error) {
    next(error);
  }
};
