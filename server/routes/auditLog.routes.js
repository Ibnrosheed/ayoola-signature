import express from 'express';
import { getAuditLogs } from '../controllers/auditLog.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Superadmin only
router.use(protect, authorize('superadmin'));

router.get('/', getAuditLogs);

export default router;
