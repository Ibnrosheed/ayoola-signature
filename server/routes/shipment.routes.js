import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  adminCreateShipment,
  adminGetShipments,
  adminGetShipment,
  adminUpdateShipment,
  adminUpdateShipmentStatus,
  adminShipmentStats,
  customerTrackShipment,
} from '../controllers/shipment.controller.js';

const router = express.Router();

// Customer tracking (protected - must be logged in)
router.get('/track/:orderId', protect, customerTrackShipment);

// Admin shipments
router.get('/admin/stats', protect, authorize('admin', 'superadmin'), adminShipmentStats);
router.get('/admin', protect, authorize('admin', 'superadmin'), adminGetShipments);
router.post('/admin', protect, authorize('admin', 'superadmin'), adminCreateShipment);
router.get('/admin/:id', protect, authorize('admin', 'superadmin'), adminGetShipment);
router.patch('/admin/:id', protect, authorize('admin', 'superadmin'), adminUpdateShipment);
router.patch('/admin/:id/status', protect, authorize('admin', 'superadmin'), adminUpdateShipmentStatus);

export default router;
