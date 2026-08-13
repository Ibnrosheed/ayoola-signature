import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  getPublicZones,
  getAvailableShippingMethods,
  getPublicPickupLocations,
  adminGetZones,
  adminCreateZone,
  adminUpdateZone,
  adminDeleteZone,
  adminGetMethods,
  adminCreateMethod,
  adminUpdateMethod,
  adminDeleteMethod,
  adminGetPickupLocations,
  adminCreatePickupLocation,
  adminUpdatePickupLocation,
  adminDeletePickupLocation,
  adminGetSettings,
  adminUpdateSettings,
} from '../controllers/shipping.controller.js';

const router = express.Router();

// ---- Public / Customer ----
router.get('/zones', getPublicZones);
router.post('/methods/available', getAvailableShippingMethods);
router.get('/pickup-locations', getPublicPickupLocations);

// ---- Admin: Zones ----
router.get('/admin/zones', protect, authorize('admin', 'superadmin'), adminGetZones);
router.post('/admin/zones', protect, authorize('admin', 'superadmin'), adminCreateZone);
router.put('/admin/zones/:id', protect, authorize('admin', 'superadmin'), adminUpdateZone);
router.delete('/admin/zones/:id', protect, authorize('admin', 'superadmin'), adminDeleteZone);

// ---- Admin: Methods ----
router.get('/admin/methods', protect, authorize('admin', 'superadmin'), adminGetMethods);
router.post('/admin/methods', protect, authorize('admin', 'superadmin'), adminCreateMethod);
router.put('/admin/methods/:id', protect, authorize('admin', 'superadmin'), adminUpdateMethod);
router.delete('/admin/methods/:id', protect, authorize('admin', 'superadmin'), adminDeleteMethod);

// ---- Admin: Pickup Locations ----
router.get('/admin/pickup-locations', protect, authorize('admin', 'superadmin'), adminGetPickupLocations);
router.post('/admin/pickup-locations', protect, authorize('admin', 'superadmin'), adminCreatePickupLocation);
router.put('/admin/pickup-locations/:id', protect, authorize('admin', 'superadmin'), adminUpdatePickupLocation);
router.delete('/admin/pickup-locations/:id', protect, authorize('admin', 'superadmin'), adminDeletePickupLocation);

// ---- Admin: Settings ----
router.get('/admin/settings', protect, authorize('admin', 'superadmin'), adminGetSettings);
router.put('/admin/settings', protect, authorize('superadmin'), adminUpdateSettings);

export default router;
