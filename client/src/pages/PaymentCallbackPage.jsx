import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { Loader2, ShieldCheck } from 'lucide-react';

export const PaymentCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshCart } = useCart();

  const [verifying, setVerifying] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Verifying your transaction with Paystack...');

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    if (!reference) {
      navigate('/payment/failed?error=Missing+reference');
      return;
    }

    const processVerification = async () => {
      try {
        setStatusMessage('Confirming payment details and securing your luxury order...');
        const res = await paymentAPI.verifyPayment(reference);

        if (res.success && res.data?.order) {
          await refreshCart(); // Refresh cart to reflect cleared state
          const orderNumber = res.data.order.orderNumber;
          navigate(`/order-success/${orderNumber}`);
        } else {
          navigate(`/payment/failed?reference=${encodeURIComponent(reference)}`);
        }
      } catch (err) {
        console.error('Payment verification failed:', err.message);
        navigate(`/payment/failed?reference=${encodeURIComponent(reference)}&reason=${encodeURIComponent(err.message)}`);
      }
    };

    processVerification();
  }, [searchParams, navigate, refreshCart]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-6 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="font-serif text-3xl font-bold text-slate-900">Verifying Payment</h1>
        <p className="text-sm text-slate-500">{statusMessage}</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Ayoola Signature 256-Bit SSL Encrypted Verification</span>
      </div>
    </div>
  );
};
export default PaymentCallbackPage;
