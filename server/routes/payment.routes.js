import express from 'express';
import { verifyPayment } from '../controllers/payment.controller.js';

const router = express.Router();

// Public payment verification endpoint (invoked via reference)
router.get('/verify/:reference', verifyPayment);

export default router;
