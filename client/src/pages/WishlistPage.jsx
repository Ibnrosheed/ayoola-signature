import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import { Heart, Trash2, ShoppingBag, ArrowRight, AlertCircle, LogIn } from 'lucide-react';

export const WishlistPage = () => {
  const { user } = useAuth();
  const { wishlistItems, removeFromWishlist, clearWishlist, loading, notification } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = async (product) => {
    const success = await addToCart(product, 1);
    if (success) {
      await removeFromWishlist(product.id || product._id);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-700">
          <Heart className="w-8 h-8 fill-amber-400" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-slate-900">Wishlist Requires Sign In</h1>
          <p className="text-sm text-slate-500">
            Log in to save your favorite Ayoola Signature luxury items across all devices.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold px-6 py-3 rounded-xl shadow-md text-sm transition-all"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to View Wishlist</span>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading your wishlist...</p>
      </div>
    );
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
          <Heart className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-slate-900">Your Wishlist is Empty</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Save items you love by clicking the heart icon on any product card or details page.
          </p>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold px-8 py-3.5 rounded-xl shadow-md text-sm transition-all"
        >
          <span>Explore Products</span>
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
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            <span>My Wishlist</span>
          </h1>
          <p className="text-sm text-slate-500">Your saved luxury creations ({wishlistItems.length} items)</p>
        </div>
        <button
          onClick={clearWishlist}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Wishlist</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl text-sm font-medium border bg-amber-50 border-amber-200 text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((prod) => {
          const isOutOfStock = !prod.inStock;

          return (
            <div
              key={prod.id || prod._id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-400 shadow-sm transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="relative w-full h-52 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                  {prod.image || (prod.images && prod.images.length > 0) ? (
                    <img
                      src={getImageUrl(prod.image || prod.images[0])}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ShoppingBag className="w-10 h-10 text-slate-300" />
                  )}

                  <button
                    onClick={() => removeFromWishlist(prod.id || prod._id)}
                    className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-rose-50 text-rose-600 rounded-full shadow-sm transition-colors"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {prod.discount > 0 && (
                    <span className="absolute top-2 left-2 bg-amber-600 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
                      {prod.discount}% OFF
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-xs text-slate-400 font-mono">SKU: {prod.sku}</span>
                  {isOutOfStock ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Out of Stock
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      In Stock
                    </span>
                  )}
                </div>

                <Link
                  to={`/product/${prod.slug}`}
                  className="font-serif text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 block"
                >
                  {prod.name}
                </Link>

                <div className="flex items-baseline gap-2">
                  <span className="text-amber-700 font-bold text-lg">₦{prod.finalPrice?.toLocaleString()}</span>
                  {prod.discount > 0 && (
                    <span className="text-xs text-slate-400 line-through">₦{prod.price?.toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <button
                  onClick={() => handleMoveToCart(prod)}
                  disabled={isOutOfStock}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-amber-300 font-bold py-3 px-4 rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Out of Stock' : 'Move to Shopping Bag'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default WishlistPage;
