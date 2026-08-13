import ProductQuestion from '../models/productQuestion.model.js';
import ProductAnswer from '../models/productAnswer.model.js';

/**
 * @route  GET /api/admin/questions
 * @desc   Get all product questions for admin review
 * @access Admin, Superadmin
 */
export const getAdminQuestions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.answered === 'false') query.isAnswered = false;

    const total = await ProductQuestion.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const questions = await ProductQuestion.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name slug images')
      .lean();

    const questionIds = questions.map((q) => q._id);
    const answers = await ProductAnswer.find({ question: { $in: questionIds } })
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
      data: { questions: questionsWithAnswers, pagination: { page, limit, total, pages } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/admin/questions/:id/answers
 * @desc   Submit official admin answer to a question
 * @access Admin, Superadmin
 */
export const adminAnswerQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer || answer.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Answer text is required' });
    }

    const question = await ProductQuestion.findById(id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const newAnswer = await ProductAnswer.create({
      question: id,
      user: req.user._id,
      answer: answer.trim(),
      isAdmin: true,
      status: 'approved',
    });

    question.isAnswered = true;
    question.status = 'approved';
    await question.save();

    res.status(201).json({
      success: true,
      message: 'Official admin answer submitted',
      data: { answer: newAnswer },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PATCH /api/admin/questions/:id/status
 * @desc   Approve or reject a question
 * @access Admin, Superadmin
 */
export const moderateQuestionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const question = await ProductQuestion.findById(id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    question.status = status;
    await question.save();

    res.status(200).json({
      success: true,
      message: `Question status updated to ${status}`,
      data: { question },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  DELETE /api/admin/questions/:id
 * @desc   Delete question and its answers
 * @access Admin, Superadmin
 */
export const deleteAdminQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await ProductQuestion.findById(id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    await question.deleteOne();
    await ProductAnswer.deleteMany({ question: id });

    res.status(200).json({ success: true, message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
};
