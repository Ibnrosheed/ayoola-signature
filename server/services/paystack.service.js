import dotenv from 'dotenv';

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Check if current key is a test/mock placeholder
 */
const isTestPlaceholder = () => {
  return (
    !PAYSTACK_SECRET_KEY ||
    PAYSTACK_SECRET_KEY.includes('phase_1') ||
    PAYSTACK_SECRET_KEY.includes('ayoola_signature')
  );
};

/**
 * Initialize a Paystack transaction
 * Amount must be in Kobo (NGN * 100)
 */
export const initializeTransaction = async ({ email, amount, reference, callback_url, metadata = {} }) => {
  // Convert NGN to Kobo (smallest currency unit)
  const amountInKobo = Math.round(Number(amount) * 100);

  // Fallback test simulation mode for development sandbox placeholder keys
  if (isTestPlaceholder()) {
    console.log(`[Paystack Service Sandbox] Initializing simulated transaction for ${reference} (₦${amount})`);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const simulatedCallback = `${clientUrl}/payment/callback?reference=${encodeURIComponent(reference)}&trxref=${encodeURIComponent(reference)}`;
    return {
      success: true,
      data: {
        authorization_url: simulatedCallback,
        access_code: `sim_access_${Date.now()}`,
        reference: reference,
      },
    };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference,
        callback_url,
        metadata,
      }),
    });

    const resData = await response.json();
    if (!response.ok || !resData.status) {
      throw new Error(resData.message || 'Paystack payment initialization failed');
    }

    return {
      success: true,
      data: resData.data,
    };
  } catch (error) {
    console.error('❌ Paystack Initialization Error:', error.message);
    throw error;
  }
};

/**
 * Verify a Paystack transaction by reference
 */
export const verifyTransaction = async (reference) => {
  if (isTestPlaceholder()) {
    console.log(`[Paystack Service Sandbox] Verifying simulated transaction for ${reference}`);
    return {
      status: true,
      message: 'Verification successful (Sandbox Simulation)',
      data: {
        id: Date.now(),
        domain: 'test',
        status: 'success',
        reference: reference,
        amount: null, // Will be verified against server-calculated order amount in controller
        currency: 'NGN',
        channel: 'card',
        paid_at: new Date().toISOString(),
      },
    };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const resData = await response.json();
    if (!response.ok || !resData.status) {
      throw new Error(resData.message || 'Paystack payment verification failed');
    }

    return {
      status: resData.status,
      message: resData.message,
      data: resData.data,
    };
  } catch (error) {
    console.error('❌ Paystack Verification Error:', error.message);
    throw error;
  }
};
