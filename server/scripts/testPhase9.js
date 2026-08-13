import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import emailConfig from '../services/email/email.config.js';
import {
  sendVerifyEmailNotification,
  sendWelcomeNotification,
  sendPasswordResetNotification,
  sendOrderConfirmationNotification,
} from '../services/email/email.service.js';


async function runTests() {
  console.log('--- Phase 9 Verification Script ---');

  // Connect to MongoDB first
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Cannot run tests: MongoDB connection failed. Check MONGODB_URI in .env');
    process.exit(1);
  }

  console.log(`Email Service Enabled: ${emailConfig.enabled}`);
  console.log(`Email Host: ${emailConfig.host}`);
  console.log(`Client URL: ${emailConfig.clientUrl}`);
  console.log('---');

  // Test 1: Simulated verification email
  const verifyRes = await sendVerifyEmailNotification({
    user: { _id: new mongoose.Types.ObjectId(), firstName: 'TestUser', email: 'test@ayoolasignature.com' },
    verificationToken: 'test_token_1234567890',
  });
  console.log('Test 1 (Verify Email):', verifyRes.success ? 'PASSED ✅' : 'FAILED ❌');

  // Test 2: Simulated welcome email
  const welcomeRes = await sendWelcomeNotification({
    user: { _id: new mongoose.Types.ObjectId(), firstName: 'TestUser', email: 'test@ayoolasignature.com' },
  });
  console.log('Test 2 (Welcome Email):', welcomeRes.success ? 'PASSED ✅' : 'FAILED ❌');

  // Test 3: Simulated password reset email
  const resetRes = await sendPasswordResetNotification({
    user: { _id: new mongoose.Types.ObjectId(), firstName: 'TestUser', email: 'test@ayoolasignature.com' },
    resetToken: 'reset_token_0987654321',
  });
  console.log('Test 3 (Password Reset):', resetRes.success ? 'PASSED ✅' : 'FAILED ❌');

  // Test 4: Simulated order confirmation email
  const orderRes = await sendOrderConfirmationNotification({
    user: { firstName: 'TestUser' },
    order: {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: 'AYS-2026-TEST01',
      customer: { firstName: 'TestUser', email: 'test@ayoolasignature.com' },
      items: [{ name: 'Signature Leather Oxfords', quantity: 1, finalPrice: 45000, total: 45000 }],
      subtotal: 45000,
      deliveryFee: 2000,
      total: 47000,
      shippingAddress: { fullName: 'Test Customer', address: '123 Victoria Island', city: 'Lagos', state: 'Lagos', phone: '08012345678' },
    },
  });
  console.log('Test 4 (Order Confirmation):', orderRes.success ? 'PASSED ✅' : 'FAILED ❌');

  console.log('--- Phase 9 Verification Complete ---');

  // Clean disconnect
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test error:', err.message);
  process.exit(1);
});

