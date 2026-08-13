import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/imageUrl';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle, Plus, Minus } from 'lucide-react';

export const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartSummary, updateCartItem, removeFromCart, clearCart, loading, notification } = useCart();

  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading your shopping bag...</p>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-700">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-slate-900">Your Shopping Bag is Empty</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Discover bespoke luxury fashion, handcrafted footwear, and signature accessories in our boutique.
          </p>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold px-8 py-3.5 rounded-xl shadow-md text-sm transition-all"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">Shopping Bag</h1>
          <p className="text-sm text-slate-500">Review selected luxury creations before proceeding</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Shopping Bag</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-2 ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const prod = item.product || {};
            const isOutOfStock = prod.quantityAvailable === 0 || prod.status !== 'active';

            return (
              <div
                key={prod._id || prod.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-6 shadow-sm hover:border-slate-300 transition-all"
              >
                {/* Product Thumbnail */}
                <div className="w-full sm:w-28 h-28 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                  {prod.image || (prod.images && prod.images.length > 0) ? (
                    <img
                      src={getImageUrl(prod.image || prod.images[0])}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link
                        to={`/product/${prod.slug}`}
                        className="font-serif text-lg font-bold text-slate-900 hover:text-amber-700 transition-colors line-clamp-1"
                      >
                        {prod.name}
                      </Link>
                      <span className="text-xs text-slate-400 font-mono">SKU: {prod.sku}</span>
                    </div>
                    <button
                      onClick={() => removeFromCart(prod._id || prod.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pricing Display */}
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-900">₦{prod.finalPrice?.toLocaleString()}</span>
                    {prod.discount > 0 && (
                      <span className="text-xs text-slate-400 line-through">₦{prod.price?.toLocaleString()}</span>
                    )}
                    {prod.discount > 0 && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        {prod.discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Stock Status & Quantity Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    {isOutOfStock ? (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                        Out of Stock
                      </span>
                    ) : item.isStockAdjusted ? (
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                        Quantity capped at stock ({prod.quantityAvailable})
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-700">In Stock ({prod.quantityAvailable} available)</span>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50">
                      <button
                        onClick={() => updateCartItem(prod._id || prod.id, item.quantity - 1)}
                        className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-l-xl transition-colors"
                        title="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItem(prod._id || prod.id, item.quantity + 1)}
                        disabled={item.quantity >= prod.quantityAvailable}
                        className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-r-xl disabled:opacity-40 transition-colors"
                        title="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtotal Item Total */}
                <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <span className="text-xs text-slate-400 block sm:hidden">Item Subtotal:</span>
                  <span className="font-serif text-lg font-bold text-amber-700">
                    ₦{item.itemTotal?.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="pt-4">
            <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-amber-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm h-fit">
          <h2 className="font-serif text-2xl font-bold text-slate-900 border-b border-slate-100 pb-4">
            Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({cartSummary.itemCount} items)</span>
              <span className="font-semibold text-slate-900">₦{cartSummary.subtotal?.toLocaleString()}</span>
            </div>

            {cartSummary.discount > 0 && (
              <div className="flex justify-between text-amber-700 font-medium">
                <span>Product Savings</span>
                <span>-₦{cartSummary.discount?.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-xs text-slate-500">
              <span>Estimated Shipping</span>
              <span>Calculated at checkout</span>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
              <span className="font-serif text-lg font-bold text-slate-900">Total</span>
              <span className="font-serif text-2xl font-bold text-amber-700">₦{cartSummary.total?.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handleCheckoutClick}
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold py-4 px-6 rounded-xl shadow-md text-sm transition-all flex items-center justify-center gap-2 group"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure 256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CartPage;
