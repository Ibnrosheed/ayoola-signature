import express from 'express';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/address.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth middleware to protect all address routes
router.use(protect);

router.route('/')
  .get(getAddresses)
  .post(createAddress);

router.route('/:id')
  .put(updateAddress)
  .delete(deleteAddress);

router.patch('/:id/default', setDefaultAddress);

export default router;
