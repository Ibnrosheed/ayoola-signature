import AuditLog from '../models/auditLog.model.js';

/**
 * @desc    Get paginated audit logs
 * @route   GET /api/admin/audit-logs
 * @access  Superadmin only
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 30,
      search = '',
      action = '',
      resource = '',
      userId = '',
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } },
      ];
    }

    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (userId) filter.user = userId;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'firstName lastName email role')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    next(error);
  }
};
