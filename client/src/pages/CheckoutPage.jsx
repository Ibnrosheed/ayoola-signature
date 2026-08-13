import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderAPI, addressAPI, couponAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import { ShoppingBag, ArrowLeft, ShieldCheck, CreditCard, Loader2, AlertCircle, LogIn, Truck, Store, Archive, Clock, Tag, X, CheckCircle2 } from 'lucide-react';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartSummary, loading: cartLoading } = useCart();

  const [fulfillmentMethod, setFulfillmentMethod] = useState('delivery'); // 'delivery' | 'pickup' | 'stockpile'
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    deliveryInstructions: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Phase 8: Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(null); // { couponCode, discountAmount, description }
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  useEffect(() => {
    if (user) {
      const fetchSavedAddresses = async () => {
        try {
          const res = await addressAPI.getAddresses();
          if (res.success && res.data?.addresses) {
            const list = res.data.addresses;
            setSavedAddresses(list);
            const def = list.find((a) => a.isDefault);
            if (def) {
              setSelectedAddressId(def._id);
              setShippingAddress({
                fullName: def.fullName,
                phone: def.phone,
                address: def.address,
                city: def.city,
                state: def.state,
                country: def.country || 'Nigeria',
                deliveryInstructions: def.deliveryInstructions || '',
              });
            } else if (list.length > 0) {
              setSelectedAddressId(list[0]._id);
              setShippingAddress({
                fullName: list[0].fullName,
                phone: list[0].phone,
                address: list[0].address,
                city: list[0].city,
                state: list[0].state,
                country: list[0].country || 'Nigeria',
                deliveryInstructions: list[0].deliveryInstructions || '',
              });
            } else {
              setSelectedAddressId('new');
            }
          } else {
            setSelectedAddressId('new');
          }
        } catch (err) {
          console.warn('Failed to load saved addresses', err.message);
          setSelectedAddressId('new');
        }
      };
      fetchSavedAddresses();
    }
  }, [user]);

  const handleSelectSavedAddress = (e) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    if (id === 'new') {
      setShippingAddress({
        fullName: user ? `${user.firstName} ${user.lastName}` : '',
        phone: user?.phone || '',
        address: '',
        city: '',
        state: '',
        country: 'Nigeria',
        deliveryInstructions: '',
      });
    } else {
      const found = savedAddresses.find((a) => a._id === id);
      if (found) {
        setShippingAddress({
          fullName: found.fullName,
          phone: found.phone,
          address: found.address,
          city: found.city,
          state: found.state,
          country: found.country || 'Nigeria',
          deliveryInstructions: found.deliveryInstructions || '',
        });
      }
    }
  };

  const handleChange = (e) => {
    setShippingAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await couponAPI.validateCoupon(couponInput.trim());
      if (res.success) {
        setCouponApplied(res.data);
        setCouponInput('');
      } else {
        setCouponError(res.message || 'Invalid coupon code');
      }
    } catch (err) {
      setCouponError(err.message || 'Could not validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await couponAPI.removeCoupon();
    } catch {}
    setCouponApplied(null);
    setCouponError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError('Please log in to complete your order checkout.');
      return;
    }

    if (!shippingAddress.fullName || !shippingAddress.phone) {
      setError('Please provide recipient name and contact phone number.');
      return;
    }

    if ((fulfillmentMethod === 'delivery' || fulfillmentMethod === 'stockpile') && (!shippingAddress.address || !shippingAddress.city || !shippingAddress.state)) {
      setError('Please complete street address, city, and state for delivery or stockpiling.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        shippingAddress,
        fulfillmentMethod,
      };

      const res = await orderAPI.createOrder(payload);

      if (res.success && res.data?.authorization_url) {
        // Redirect customer to Paystack authorization URL
        window.location.href = res.data.authorization_url;
      } else {
        throw new Error('Payment initialization failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Checkout failed. Please re-check stock or try again.');
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-700">
          <LogIn className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-slate-900">Sign In to Checkout</h1>
          <p className="text-sm text-slate-500">
            Please log in or create an account to process your luxury order and track delivery.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold py-3 rounded-xl shadow-md text-sm transition-all block"
          >
            Log In to Proceed
          </Link>
          <Link
            to="/register"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 rounded-xl text-sm transition-all block"
          >
            Create New Account
          </Link>
        </div>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Preparing checkout details...</p>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-slate-900">Your Shopping Bag is Empty</h1>
          <p className="text-sm text-slate-500">Add products to your cart before proceeding to checkout.</p>
        </div>
        <Link to="/shop" className="inline-block bg-slate-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-sm">
          Browse Boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link to="/cart" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-amber-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Shopping Bag</span>
      </Link>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">Express Checkout</h1>
        <p className="text-sm text-slate-500">Select your preferred fulfillment method and complete shipping details</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping & Fulfillment Options (Left 2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Customer Snapshot Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
              <span>Contact Information</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Customer Name</span>
                <span className="font-bold text-slate-900">{user.firstName} {user.lastName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Email Address</span>
                <span className="font-bold text-slate-900">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Method Selection Grid */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
              Fulfillment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Option 1: Delivery */}
              <div
                onClick={() => setFulfillmentMethod('delivery')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                  fulfillmentMethod === 'delivery'
                    ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillmentMethod === 'delivery'}
                    onChange={() => setFulfillmentMethod('delivery')}
                    className="accent-amber-600 w-4 h-4"
                  />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-sm">Doorstep Delivery</h3>
                  <p className="text-xs text-slate-500 pt-0.5">Express courier shipping to your address</p>
                </div>
              </div>

              {/* Option 2: Boutique Pickup */}
              <div
                onClick={() => setFulfillmentMethod('pickup')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                  fulfillmentMethod === 'pickup'
                    ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-300 flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillmentMethod === 'pickup'}
                    onChange={() => setFulfillmentMethod('pickup')}
                    className="accent-amber-600 w-4 h-4"
                  />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-sm">Boutique Pickup</h3>
                  <p className="text-xs text-slate-500 pt-0.5">Collect at VI Flagship Store in Lagos</p>
                </div>
              </div>

              {/* Option 3: Stockpile 7 Days */}
              <div
                onClick={() => setFulfillmentMethod('stockpile')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                  fulfillmentMethod === 'stockpile'
                    ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-300 flex items-center justify-center">
                    <Archive className="w-5 h-5" />
                  </div>
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillmentMethod === 'stockpile'}
                    onChange={() => setFulfillmentMethod('stockpile')}
                    className="accent-amber-600 w-4 h-4"
                  />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-sm">Stockpile (7 Days)</h3>
                  <p className="text-xs text-slate-500 pt-0.5">Hold items to accumulate & combine shipping</p>
                </div>
              </div>
            </div>

            {/* Dynamic Notice Banner */}
            {fulfillmentMethod === 'stockpile' && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 flex items-start gap-3">
                <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">7-Day Stockpile Reservation Active</p>
                  <p className="text-indigo-700 pt-0.5">
                    Your paid items will be held safely in our climate-controlled vault for 7 days starting today. You can keep adding new creations to your stockpile before consolidating shipment!
                  </p>
                </div>
              </div>
            )}

            {fulfillmentMethod === 'pickup' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-3">
                <Store className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Flagship Store Pickup Selected</p>
                  <p className="text-emerald-700 pt-0.5">
                    Pickup Location: <span className="font-semibold">Ayoola Signature Boutique, Victoria Island, Lagos</span>. We will notify you via SMS/Email as soon as your items are ready for collection.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Shipping Address Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
              {fulfillmentMethod === 'pickup' ? 'Recipient Pickup Details' : 'Shipping Address Details'}
            </h2>

            {savedAddresses.length > 0 && (
              <div className="space-y-1 pb-4 border-b border-slate-100">
                <label className="text-xs font-semibold text-slate-700">Select Saved Address</label>
                <select
                  value={selectedAddressId}
                  onChange={handleSelectSavedAddress}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all font-semibold"
                >
                  {savedAddresses.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.fullName} - {a.address}, {a.city} ({a.isDefault ? 'Default' : 'Secondary'})
                    </option>
                  ))}
                  <option value="new">+ Enter A New Shipping Address</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Recipient Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={shippingAddress.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Chief Ayoola Johnson"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  value={shippingAddress.phone}
                  onChange={handleChange}
                  placeholder="e.g. +234 801 234 5678"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                />
              </div>
            </div>

            {fulfillmentMethod !== 'pickup' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Street Delivery Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={shippingAddress.address}
                    onChange={handleChange}
                    placeholder="e.g. Plot 14, Victoria Island Close, Off Admiralty Way"
                    required={fulfillmentMethod !== 'pickup'}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">City / Town *</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleChange}
                      placeholder="e.g. Ikeja"
                      required={fulfillmentMethod !== 'pickup'}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleChange}
                      placeholder="e.g. Lagos"
                      required={fulfillmentMethod !== 'pickup'}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleChange}
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Delivery / Special Instructions (Optional)</label>
              <textarea
                name="deliveryInstructions"
                value={shippingAddress.deliveryInstructions}
                onChange={handleChange}
                rows="2"
                placeholder={fulfillmentMethod === 'stockpile' ? "Notes on when you plan to release stockpile..." : "Special notes for courier delivery..."}
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Order Summary & Paystack Action (Right 1 Col) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h2>

            {/* Item Mini List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100">
              {cartItems.map((item) => {
                const prod = item.product || {};
                return (
                  <div key={prod._id || prod.id} className="pt-2 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {prod.image || (prod.images && prod.images.length > 0) ? (
                        <img src={getImageUrl(prod.image || prod.images[0])} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-slate-900 line-clamp-1">{prod.name}</p>
                      <p className="text-slate-400">Qty: {item.quantity} × ₦{prod.finalPrice?.toLocaleString()}</p>
                    </div>
                    <span className="font-bold text-slate-900 text-xs">₦{item.itemTotal?.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-slate-200 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₦{cartSummary.subtotal?.toLocaleString()}</span>
              </div>

              {cartSummary.discount > 0 && (
                <div className="flex justify-between text-amber-700 font-medium">
                  <span>Product Savings</span>
                  <span>-₦{cartSummary.discount?.toLocaleString()}</span>
                </div>
              )}

              {/* Phase 8: Coupon Discount Row */}
              {couponApplied && couponApplied.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{couponApplied.couponCode}</span>
                  <span>-₦{couponApplied.discountAmount?.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Fulfillment ({fulfillmentMethod})</span>
                <span className="font-semibold text-emerald-700">COMPLIMENTARY</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span className="font-serif text-base font-bold text-slate-900">Order Total</span>
                <span className="font-serif text-2xl font-bold text-amber-700">
                  ₦{Math.max(0, (cartSummary.total || 0) - (couponApplied?.discountAmount || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Phase 8: Coupon Input Section */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              {couponApplied ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{couponApplied.couponCode} applied — saving ₦{couponApplied.discountAmount?.toLocaleString()}</span>
                  </div>
                  <button type="button" onClick={handleRemoveCoupon} className="text-emerald-600 hover:text-rose-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Promo / Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                      placeholder="Enter code..."
                      className="flex-1 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none transition-all uppercase placeholder:normal-case placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 text-amber-300 disabled:text-slate-500 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                      {couponLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-amber-300 font-bold py-4 px-6 rounded-xl shadow-md text-sm transition-all flex items-center justify-center gap-2 group"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Initializing Paystack...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₦{cartSummary.total?.toLocaleString()} with Paystack</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Paystack Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
export default CheckoutPage;
