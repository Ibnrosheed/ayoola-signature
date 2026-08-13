import Category, { slugify } from '../models/category.model.js';
import Product from '../models/product.model.js';
import { validateCategoryInput } from '../validators/category.validator.js';

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private (Admin & Superadmin)
 */
export const createCategory = async (req, res, next) => {
  try {
    const { isValid, errors } = validateCategoryInput(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const name = req.body.name.trim();
    const slug = slugify(name);

    // Check duplicate name or slug
    const existing = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists',
      });
    }

    let image = req.body.image || '';
    if (req.file) {
      image = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.create({
      name,
      slug,
      description: req.body.description?.trim() || '',
      image,
      status: req.body.status || 'active',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/categories
 * @desc    Get all categories (public gets active, admin gets all)
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    // If admin is authenticated, allow viewing all categories, else only active
    const isAdmin = req.user && ['admin', 'superadmin'].includes(req.user.role);
    const filter = isAdmin && req.query.all === 'true' ? {} : { status: 'active' };

    const categories = await Category.find(filter).sort({ name: 1 }).lean();

    // Attach product count to each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({
          category: cat._id,
          ...(isAdmin ? {} : { status: 'active' }),
        });
        return { ...cat, productCount };
      })
    );

    res.status(200).json({
      success: true,
      data: { categories: categoriesWithCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID
 * @access  Public
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productCount = await Product.countDocuments({ category: category._id, status: 'active' });

    res.status(200).json({
      success: true,
      data: { category: { ...category.toObject(), productCount } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Get single category by Slug
 * @access  Public
 */
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productCount = await Product.countDocuments({ category: category._id, status: 'active' });

    res.status(200).json({
      success: true,
      data: { category: { ...category.toObject(), productCount } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (Admin & Superadmin)
 */
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { isValid, errors } = validateCategoryInput(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const name = req.body.name.trim();
    const newSlug = slugify(name);

    // Check duplicate if name/slug changed
    if (name !== category.name) {
      const existing = await Category.findOne({
        _id: { $ne: category._id },
        $or: [{ name }, { slug: newSlug }],
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Another category with this name already exists',
        });
      }
      category.name = name;
      category.slug = newSlug;
    }

    if (req.body.description !== undefined) category.description = req.body.description.trim();
    if (req.body.status) category.status = req.body.status;

    if (req.file) {
      category.image = `/uploads/categories/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      category.image = req.body.image;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete/deactivate category
 * @access  Private (Admin & Superadmin)
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if products exist in this category
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      // Prefer soft-deactivation if category contains products
      category.status = 'inactive';
      await category.save();
      return res.status(200).json({
        success: true,
        message: `Category deactivated because it contains ${productCount} associated product(s).`,
        data: { category, deactivated: true },
      });
    }

    await Category.findByIdAndDelete(category._id);
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
