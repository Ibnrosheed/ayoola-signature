import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import { validateCartInput } from '../validators/cart.validator.js';

/**
 * Helper to calculate and format cart response with server-side price security
 */
export const formatCartResponse = (cartDoc) => {
  if (!cartDoc || !cartDoc.items) {
    return {
      items: [],
      summary: {
        itemCount: 0,
        subtotal: 0,
        discount: 0,
        total: 0,
      },
    };
  }

  let totalItemCount = 0;
  let subtotal = 0;
  let totalDiscount = 0;
  const formattedItems = [];

  for (const item of cartDoc.items) {
    const prod = item.product;
    // Skip if product reference failed or product is inactive
    if (!prod || prod.status !== 'active') continue;

    const unitPrice = Number(prod.price) || 0;
    const discountPct = Number(prod.discount) || 0;
    const finalPrice = Math.max(0, Math.round(unitPrice * (1 - discountPct / 100)));
    const qty = Math.min(item.quantity, prod.quantity); // Cap at current available stock
    const itemTotal = finalPrice * qty;
    const itemSubtotal = unitPrice * qty;
    const itemDiscount = (unitPrice - finalPrice) * qty;

    totalItemCount += qty;
    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;

    formattedItems.push({
      product: {
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
      },
      quantity: qty,
      itemTotal: itemTotal,
      isStockAdjusted: item.quantity > prod.quantity,
    });
  }

  const grandTotal = Math.max(0, subtotal - totalDiscount);

  return {
    items: formattedItems,
    summary: {
      itemCount: totalItemCount,
      subtotal: Math.round(subtotal),
      discount: Math.round(totalDiscount),
      total: Math.round(grandTotal),
    },
  };
};

/**
 * @route   GET /api/cart
 * @desc    Get current user's cart
 * @access  Private
 */
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const cartData = formatCartResponse(cart);

    res.status(200).json({
      success: true,
      data: cartData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/cart/items
 * @desc    Add product to cart
 * @access  Private
 */
export const addToCart = async (req, res, next) => {
  try {
    const { isValid, errors } = validateCartInput(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const { productId, quantity = 1 } = req.body;
    const requestedQty = Math.max(1, parseInt(quantity, 10));

    // 1. Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // 2. Verify product is active
    if (product.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Product is currently unavailable' });
    }

    // 3. Verify stock
    if (product.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Product is out of stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    let currentQtyInCart = 0;
    if (existingItemIndex > -1) {
      currentQtyInCart = cart.items[existingItemIndex].quantity;
    }

    const newTotalQty = currentQtyInCart + requestedQty;

    // 4. Validate stock limit
    if (newTotalQty > product.quantity) {
      const allowedAdd = Math.max(0, product.quantity - currentQtyInCart);
      return res.status(400).json({
        success: false,
        message: allowedAdd > 0
          ? `Cannot add ${requestedQty} units. Only ${allowedAdd} additional units available (Stock: ${product.quantity}).`
          : `You already have maximum available stock (${product.quantity}) in your cart.`,
        availableStock: product.quantity,
        currentInCart: currentQtyInCart,
      });
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = newTotalQty;
    } else {
      cart.items.push({ product: productId, quantity: requestedQty });
    }

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    const cartData = formatCartResponse(updatedCart);

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
      data: cartData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/cart/items/:productId
 * @desc    Update quantity of specific cart item
 * @access  Private
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || isNaN(quantity)) {
      return res.status(400).json({ success: false, message: 'Quantity is required' });
    }

    const targetQty = parseInt(quantity, 10);

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // If quantity set to 0, remove item
    if (targetQty <= 0) {
      cart.items = cart.items.filter((item) => item.product.toString() !== productId.toString());
      await cart.save();

      const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      return res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        data: formatCartResponse(updatedCart),
      });
    }

    // Check product stock limit
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Product unavailable' });
    }

    if (targetQty > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock (${product.quantity})`,
        availableStock: product.quantity,
      });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId.toString());
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = targetQty;
    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    const cartData = formatCartResponse(updatedCart);

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: cartData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/cart/items/:productId
 * @desc    Remove product from cart
 * @access  Private
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId.toString());
    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    const cartData = formatCartResponse(updatedCart);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cartData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
export const clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        summary: { itemCount: 0, subtotal: 0, discount: 0, total: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/cart/merge
 * @desc    Merge guest cart items into authenticated user cart upon login
 * @access  Private
 */
export const mergeCart = async (req, res, next) => {
  try {
    const { items = [] } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    for (const guestItem of items) {
      if (!guestItem.productId) continue;

      const product = await Product.findById(guestItem.productId);
      if (!product || product.status !== 'active' || product.quantity <= 0) continue;

      const requestedQty = Math.max(1, parseInt(guestItem.quantity, 10) || 1);
      const existingIndex = cart.items.findIndex(
        (item) => item.product.toString() === guestItem.productId.toString()
      );

      if (existingIndex > -1) {
        const combinedQty = cart.items[existingIndex].quantity + requestedQty;
        cart.items[existingIndex].quantity = Math.min(combinedQty, product.quantity);
      } else {
        cart.items.push({
          product: guestItem.productId,
          quantity: Math.min(requestedQty, product.quantity),
        });
      }
    }

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    const cartData = formatCartResponse(updatedCart);

    res.status(200).json({
      success: true,
      message: 'Guest cart merged successfully',
      data: cartData,
    });
  } catch (error) {
    next(error);
  }
};
