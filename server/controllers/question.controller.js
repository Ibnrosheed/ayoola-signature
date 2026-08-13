import ProductQuestion from '../models/productQuestion.model.js';
import ProductAnswer from '../models/productAnswer.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';

/**
 * @route  GET /api/products/:productId/questions
 * @desc   Get approved questions and their answers for a product
 * @access Public
 */
export const getProductQuestions = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { product: productId, status: 'approved' };

    const total = await ProductQuestion.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const questions = await ProductQuestion.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName')
      .lean();

    // Fetch answers for these questions
    const questionIds = questions.map((q) => q._id);
    const answers = await ProductAnswer.find({
      question: { $in: questionIds },
      status: 'approved',
    })
      .sort({ createdAt: 1 })
      .populate('user', 'firstName lastName role')
      .lean();

    const answerMap = {};
    answers.forEach((ans) => {
      const qId = ans.question.toString();
      if (!answerMap[qId]) answerMap[qId] = [];
      answerMap[qId].push(ans);
    });

    const questionsWithAnswers = questions.map((q) => ({
      ...q,
      answers: answerMap[q._id.toString()] || [],
    }));

    res.status(200).json({
      success: true,
      data: {
        questions: questionsWithAnswers,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/products/:productId/questions
 * @desc   Ask a question about a product
 * @access Private (Authenticated User)
 */
export const createQuestion = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { question } = req.body;
    const userId = req.user._id;

    if (!question || question.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Question must be at least 5 characters long' });
    }
    if (question.trim().length > 500) {
      return res.status(400).json({ success: false, message: 'Question cannot exceed 500 characters' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const newQuestion = await ProductQuestion.create({
      product: productId,
      user: userId,
      question: question.trim(),
      status: 'approved', // Auto-approved for smooth experience
    });

    res.status(201).json({
      success: true,
      message: 'Question posted successfully',
      data: { question: newQuestion },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/questions/:questionId/answers
 * @desc   Answer a product question (Customer or Admin)
 * @access Private (Authenticated User)
 */
export const createAnswer = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    const userId = req.user._id;

    if (!answer || answer.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Answer text is required' });
    }

    const questionDoc = await ProductQuestion.findById(questionId);
    if (!questionDoc) return res.status(404).json({ success: false, message: 'Question not found' });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    // Check verified buyer status if customer
    let isVerifiedBuyer = false;
    if (!isAdmin) {
      const order = await Order.findOne({
        user: userId,
        paymentStatus: 'successful',
        'items.product': questionDoc.product,
      });
      if (order) isVerifiedBuyer = true;
    }

    const newAnswer = await ProductAnswer.create({
      question: questionId,
      user: userId,
      answer: answer.trim(),
      isAdmin,
      isVerifiedBuyer,
      status: 'approved',
    });

    questionDoc.isAnswered = true;
    await questionDoc.save();

    res.status(201).json({
      success: true,
      message: 'Answer posted successfully',
      data: { answer: newAnswer },
    });
  } catch (error) {
    next(error);
  }
};
