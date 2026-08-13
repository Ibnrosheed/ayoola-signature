import Product from '../models/product.model.js';
import Category, { slugify } from '../models/category.model.js';
import { validateProductInput } from '../validators/product.validator.js';

/**
 * Helper to build sort object from query string
 */
const buildSortOption = (sortQuery) => {
  switch (sortQuery) {
    case 'oldest':
      return { createdAt: 1 };
    case 'price_asc':
      return { finalPrice: 1 };
    case 'price_desc':
      return { finalPrice: -1 };
    case 'name_asc':
      return { name: 1 };
    case 'name_desc':
      return { name: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
};

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Admin & Superadmin)
 */
export const createProduct = async (req, res, next) => {
  try {
    const { isValid, errors } = validateProductInput(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const { name, sku, price, discount, description, shortDescription, quantity, category, featured, bestSeller, status } = req.body;
    const cleanSKU = sku.toUpperCase().trim();
    const cleanSlug = slugify(name);

    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: 'Specified category does not exist' });
    }

    // Verify SKU uniqueness
    const existingSKU = await Product.findOne({ sku: cleanSKU });
    if (existingSKU) {
      return res.status(400).json({ success: false, message: `SKU '${cleanSKU}' is already in use` });
    }

    // Handle Image Uploads
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map((file) => `/uploads/products/${file.filename}`);
    } else if (req.body.images) {
      imagePaths = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    // Calculate finalPrice on server
    const numPrice = Number(price);
    const numDiscount = Number(discount) || 0;
    const finalPrice = Math.max(0, Math.round(numPrice * (1 - numDiscount / 100)));

    const product = await Product.create({
      name: name.trim(),
      slug: cleanSlug,
      sku: cleanSKU,
      price: numPrice,
      discount: numDiscount,
      finalPrice,
      description: description.trim(),
      shortDescription: shortDescription?.trim() || '',
      images: imagePaths,
      quantity: Number(quantity),
      category: categoryDoc._id,
      featured: featured === 'true' || featured === true,
      bestSeller: bestSeller === 'true' || bestSeller === true,
      status: status || 'active',
      createdBy: req.user._id,
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: populatedProduct },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products
 * @desc    Get paginated, filtered, searched, and sorted products
 * @access  Public
 */
export const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const query = {};

    // Customers only see active products; Admin can query all if status parameter passed
    const isAdmin = req.user && ['admin', 'superadmin'].includes(req.user.role);
    if (req.query.status && isAdmin) {
      query.status = req.query.status;
    } else {
      query.status = 'active';
    }

    // Category filter (by ID or slug)
    if (req.query.category) {
      const categoryInput = req.query.category.trim();
      let categoryObj = null;

      if (categoryInput.match(/^[0-9a-fA-F]{24}$/)) {
        categoryObj = await Category.findById(categoryInput);
      } else {
        categoryObj = await Category.findOne({ slug: categoryInput });
      }

      if (categoryObj) {
        query.category = categoryObj._id;
      } else {
        // Return empty result if requested category is invalid
        return res.status(200).json({
          success: true,
          data: {
            products: [],
            pagination: { page, limit, total: 0, pages: 0 },
          },
        });
      }
    }

    // Featured & Best Seller filters
    if (req.query.featured === 'true') query.featured = true;
    if (req.query.bestSeller === 'true') query.bestSeller = true;

    // Price range filters
    if (req.query.minPrice || req.query.maxPrice) {
      query.finalPrice = {};
      if (req.query.minPrice) query.finalPrice.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.finalPrice.$lte = Number(req.query.maxPrice);
    }

    // Server-side text search across Name, SKU, Description
    if (req.query.search && req.query.search.trim() !== '') {
      const searchTerm = req.query.search.trim();
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { sku: { $regex: searchTerm, $options: 'i' } },
        { shortDescription: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Sorting
    const sortOption = buildSortOption(req.query.sort);

    // Query Database
    const total = await Product.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Get single product by Slug + Related Products from same category
 * @access  Public
 */
export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Fetch up to 4 related products from the same category excluding current product
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      status: 'active',
    })
      .limit(4)
      .populate('category', 'name slug')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        product,
        relatedProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/products/:id
 * @desc    Update product details, pricing, images, stock, or status
 * @access  Private (Admin & Superadmin)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { isValid, errors } = validateProductInput({ ...product.toObject(), ...req.body });
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // Check SKU uniqueness if changed
    if (req.body.sku && req.body.sku.toUpperCase().trim() !== product.sku) {
      const newSKU = req.body.sku.toUpperCase().trim();
      const existingSKU = await Product.findOne({ sku: newSKU, _id: { $ne: product._id } });
      if (existingSKU) {
        return res.status(400).json({ success: false, message: `SKU '${newSKU}' is already taken` });
      }
      product.sku = newSKU;
    }

    if (req.body.name) {
      product.name = req.body.name.trim();
      product.slug = slugify(req.body.name);
    }

    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.discount !== undefined) product.discount = Number(req.body.discount);
    if (req.body.description) product.description = req.body.description.trim();
    if (req.body.shortDescription !== undefined) product.shortDescription = req.body.shortDescription.trim();
    if (req.body.quantity !== undefined) product.quantity = Number(req.body.quantity);
    if (req.body.category) product.category = req.body.category;
    if (req.body.status) product.status = req.body.status;
    if (req.body.featured !== undefined) product.featured = req.body.featured === 'true' || req.body.featured === true;
    if (req.body.bestSeller !== undefined) product.bestSeller = req.body.bestSeller === 'true' || req.body.bestSeller === true;

    // Handle New Uploaded Images or Updated Image List
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/products/${file.filename}`);
      if (req.body.replaceImages === 'true') {
        product.images = newImages;
      } else {
        product.images = [...product.images, ...newImages];
      }
    } else if (req.body.images) {
      product.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    await product.save();
    const updatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete/deactivate product
 * @access  Private (Admin & Superadmin)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Perform soft deactivation
    product.status = 'inactive';
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deactivated successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};
