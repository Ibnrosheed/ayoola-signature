import Product from '../models/product.model.js';
import InventoryLog from '../models/inventoryLog.model.js';
import AuditLog from '../models/auditLog.model.js';

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD || '5', 10);

/**
 * @desc    Get inventory list with filters
 * @route   GET /api/admin/inventory
 * @access  Admin, Superadmin
 */
export const getInventory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      stockStatus = '',
      category = '',
      sort = 'quantity',
    } = req.query;

    const filter = {};

    // Search by name or SKU
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    // Stock status filter
    if (stockStatus === 'out_of_stock') {
      filter.quantity = 0;
    } else if (stockStatus === 'low_stock') {
      filter.quantity = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
    } else if (stockStatus === 'in_stock') {
      filter.quantity = { $gt: LOW_STOCK_THRESHOLD };
    }

    if (category) {
      filter.category = category;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Determine sort
    let sortObj = { quantity: 1 };
    if (sort === '-quantity') sortObj = { quantity: -1 };
    else if (sort === 'name') sortObj = { name: 1 };
    else if (sort === '-name') sortObj = { name: -1 };
    else if (sort === 'updatedAt') sortObj = { updatedAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('name sku quantity images status category updatedAt')
        .populate('category', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Compute stock status for each product
    const inventory = products.map((p) => ({
      ...p,
      stockStatus:
        p.quantity === 0
          ? 'out_of_stock'
          : p.quantity <= LOW_STOCK_THRESHOLD
          ? 'low_stock'
          : 'in_stock',
    }));

    res.status(200).json({
      success: true,
      data: {
        inventory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product stock (quick stock update)
 * @route   PATCH /api/admin/products/:id/stock
 * @access  Admin, Superadmin
 */
export const updateProductStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, reason = 'manual_adjustment', note = '' } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ success: false, message: 'Quantity is required' });
    }

    const newQty = parseInt(quantity);
    if (isNaN(newQty) || newQty < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a non-negative number' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousQuantity = product.quantity;
    const change = newQty - previousQuantity;

    product.quantity = newQty;
    await product.save();

    // Create inventory log entry
    await InventoryLog.create({
      product: product._id,
      change,
      previousQuantity,
      newQuantity: newQty,
      reason,
      note,
      reference: `Manual update by ${req.user.firstName} ${req.user.lastName}`,
      createdBy: req.user._id,
    });

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'STOCK_UPDATED',
      resource: 'Product',
      resourceId: product._id.toString(),
      details: { productName: product.name, sku: product.sku, previousQuantity, newQuantity: newQty, change, reason, note },
      ipAddress: req.ip || '',
    });

    res.status(200).json({
      success: true,
      message: `Stock updated: ${previousQuantity} → ${newQty}`,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product status (activate/deactivate)
 * @route   PATCH /api/admin/products/:id/status
 * @access  Admin, Superadmin
 */
export const updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "active" or "inactive"' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStatus = product.status;
    product.status = status;
    await product.save();

    await AuditLog.create({
      user: req.user._id,
      action: status === 'active' ? 'PRODUCT_ACTIVATED' : 'PRODUCT_DEACTIVATED',
      resource: 'Product',
      resourceId: product._id.toString(),
      details: { productName: product.name, previousStatus, newStatus: status },
      ipAddress: req.ip || '',
    });

    res.status(200).json({
      success: true,
      message: `Product ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: { product: { _id: product._id, name: product.name, status: product.status } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle product featured flag
 * @route   PATCH /api/admin/products/:id/featured
 * @access  Admin, Superadmin
 */
export const toggleProductFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.featured = !product.featured;
    await product.save();

    await AuditLog.create({
      user: req.user._id,
      action: product.featured ? 'PRODUCT_FEATURED' : 'PRODUCT_UNFEATURED',
      resource: 'Product',
      resourceId: product._id.toString(),
      details: { productName: product.name, featured: product.featured },
      ipAddress: req.ip || '',
    });

    res.status(200).json({
      success: true,
      message: `Product ${product.featured ? 'marked as featured' : 'removed from featured'}`,
      data: { product: { _id: product._id, name: product.name, featured: product.featured } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle product best seller flag
 * @route   PATCH /api/admin/products/:id/bestseller
 * @access  Admin, Superadmin
 */
export const toggleProductBestSeller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.bestSeller = !product.bestSeller;
    await product.save();

    await AuditLog.create({
      user: req.user._id,
      action: product.bestSeller ? 'PRODUCT_BESTSELLER' : 'PRODUCT_UNBESSELLER',
      resource: 'Product',
      resourceId: product._id.toString(),
      details: { productName: product.name, bestSeller: product.bestSeller },
      ipAddress: req.ip || '',
    });

    res.status(200).json({
      success: true,
      message: `Product ${product.bestSeller ? 'marked as best seller' : 'removed from best sellers'}`,
      data: { product: { _id: product._id, name: product.name, bestSeller: product.bestSeller } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get inventory history for a specific product
 * @route   GET /api/admin/inventory/:productId/history
 * @access  Admin, Superadmin
 */
export const getInventoryHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const product = await Product.findById(productId).select('name sku quantity').lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      InventoryLog.find({ product: productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'firstName lastName email')
        .lean(),
      InventoryLog.countDocuments({ product: productId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        product,
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 8: Variant CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Add a variant to a product
 * @route   POST /api/admin/products/:id/variants
 * @access  Admin, Superadmin
 */
export const addVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sku, attributes, price, discount, quantity, image, isActive } = req.body;

    if (!sku || !sku.trim()) {
      return res.status(400).json({ success: false, message: 'Variant SKU is required' });
    }
    if (quantity === undefined || quantity === null || isNaN(Number(quantity)) || Number(quantity) < 0) {
      return res.status(400).json({ success: false, message: 'Valid variant stock quantity is required' });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Check SKU uniqueness within this product's variants
    const duplicateSku = product.variants.some(
      (v) => v.sku.toUpperCase() === sku.trim().toUpperCase()
    );
    if (duplicateSku) {
      return res.status(409).json({ success: false, message: `Variant SKU '${sku}' already exists on this product` });
    }

    product.variants.push({
      sku: sku.trim().toUpperCase(),
      attributes: attributes || {},
      price: price !== undefined && price !== '' ? Number(price) : null,
      discount: Number(discount) || 0,
      quantity: Number(quantity),
      image: image?.trim() || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    await product.save(); // pre-validate hook recalculates all finalPrices

    await AuditLog.create({
      user: req.user._id,
      action: 'VARIANT_ADDED',
      resource: 'Product',
      resourceId: product._id.toString(),
      details: { productName: product.name, variantSku: sku.trim().toUpperCase() },
      ipAddress: req.ip || '',
    });

    res.status(201).json({
      success: true,
      message: 'Variant added successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a variant on a product
 * @route   PUT /api/admin/products/:id/variants/:variantId
 * @access  Admin, Superadmin
 */
export const updateVariant = async (req, res, next) => {
  try {
    const { id, variantId } = req.params;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    const { sku, attributes, price, discount, quantity, image, isActive } = req.body;

    if (sku !== undefined) {
      // Check SKU uniqueness (excluding self)
      const dupSku = product.variants.some(
        (v) => v._id.toString() !== variantId && v.sku.toUpperCase() === sku.trim().toUpperCase()
      );
      if (dupSku) {
        return res.status(409).json({ success: false, message: `Variant SKU '${sku}' already exists on this product` });
      }
      variant.sku = sku.trim().toUpperCase();
    }
    if (attributes !== undefined) variant.attributes = attributes;
    if (price !== undefined) variant.price = price !== '' && price !== null ? Number(price) : null;
    if (discount !== undefined) variant.discount = Number(discount) || 0;
    if (quantity !== undefined) {
      if (isNaN(Number(quantity)) || Number(quantity) < 0) {
        return res.status(400).json({ success: false, message: 'Quantity must be a non-negative number' });
      }
      variant.quantity = Number(quantity);
    }
    if (image !== undefined) variant.image = image?.trim() || '';
    if (isActive !== undefined) variant.isActive = Boolean(isActive);

    await product.save(); // recalculates finalPrices

    res.status(200).json({
      success: true,
      message: 'Variant updated successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a variant from a product
 * @route   DELETE /api/admin/products/:id/variants/:variantId
 * @access  Admin, Superadmin
 */
export const deleteVariant = async (req, res, next) => {
  try {
    const { id, variantId } = req.params;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    const removedSku = variant.sku;
    product.variants.pull(variantId);

    await product.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'VARIANT_DELETED',
      resource: 'Product',
      resourceId: product._id.toString(),
      details: { productName: product.name, variantSku: removedSku },
      ipAddress: req.ip || '',
    });

    res.status(200).json({
      success: true,
      message: 'Variant removed successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};
