import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getImageUrl } from '../utils/imageUrl';
import { Sparkles, ArrowRight, ShieldCheck, Truck, Clock, ShoppingBag, Star, Award, Layers, Heart, Loader2 } from 'lucide-react';

export const HomePage = () => {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [featRes, bestRes, catRes] = await Promise.all([
          productAPI.getProducts({ featured: true, limit: 4 }),
          productAPI.getProducts({ bestSeller: true, limit: 4 }),
          categoryAPI.getCategories(false),
        ]);

        if (featRes.success) setFeaturedProducts(featRes.data.products || []);
        if (bestRes.success) setBestSellers(bestRes.data.products || []);
        if (catRes.success) setCategories(catRes.data.categories || []);
      } catch (err) {
        console.warn('Error fetching homepage catalogue data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleAddToCart = async (product) => {
    const pId = product._id || product.id;
    setAddingId(pId);
    await addToCart(product, 1);
    setAddingId(null);
  };

  const handleWishlistToggle = async (product) => {
    const pId = product._id || product.id;
    if (isInWishlist(pId)) {
      await removeFromWishlist(pId);
    } else {
      await addToWishlist(pId);
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 sm:p-16 text-center md:text-left shadow-xl border border-amber-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 opacity-90"></div>
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-amber-400/10 border border-amber-400/30 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EXCLUSIVITY REDEFINED</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
            Elevate Your Style With <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">Ayoola Signature</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Discover bespoke luxury fashion, handcrafted accessories, and timeless signature collections designed for royalty and connoisseurs of fine style.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
            <Link
              to="/shop"
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-all flex items-center gap-2 group"
            >
              <span>Explore Boutique</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/categories"
              className="bg-slate-800/80 hover:bg-slate-800 text-amber-200 border border-amber-400/30 font-semibold px-8 py-3.5 rounded-xl transition-colors"
            >
              Browse Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      {categories.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-6 h-6 text-amber-700" />
                <span>Signature Collections</span>
              </h2>
              <p className="text-xs text-slate-500">Curated categories tailored for elegance</p>
            </div>
            <Link to="/categories" className="text-xs font-semibold text-amber-700 hover:underline">
              View All Categories →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat._id}
                to={`/category/${cat.slug}`}
                className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-full h-32 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden mb-3 flex items-center justify-center">
                  {cat.image ? (
                    <img src={getImageUrl(cat.image)} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Layers className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <h3 className="font-serif font-bold text-slate-900 group-hover:text-amber-700 transition-colors text-center">{cat.name}</h3>
                <span className="text-[11px] text-slate-400 text-center">{cat.productCount || 0} Products</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-600 fill-amber-400" />
                <span>Featured Luxury Items</span>
              </h2>
              <p className="text-xs text-slate-500">Handpicked items highlighted for exceptional design</p>
            </div>
            <Link to="/shop?featured=true" className="text-xs font-semibold text-amber-700 hover:underline">
              Explore Featured →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => {
              const pId = prod._id || prod.id;
              const inWishlist = isInWishlist(pId);
              const isOutOfStock = prod.quantity === 0;

              return (
                <div key={pId} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-400 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="relative w-full h-52 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                      {prod.images && prod.images.length > 0 ? (
                        <img src={getImageUrl(prod.images[0])} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <ShoppingBag className="w-10 h-10 text-slate-300" />
                      )}

                      <button
                        onClick={() => handleWishlistToggle(prod)}
                        className={`absolute top-2 right-2 p-2 rounded-full shadow-sm transition-all ${
                          inWishlist ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-white/90 text-slate-400 hover:text-rose-500'
                        }`}
                        title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500' : ''}`} />
                      </button>

                      {prod.discount > 0 && (
                        <span className="absolute top-2 left-2 bg-amber-600 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
                          {prod.discount}% OFF
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {prod.category?.name || 'Luxury'}
                    </span>
                    <Link to={`/product/${prod.slug}`} className="font-serif text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 block">
                      {prod.name}
                    </Link>
                    <div className="flex items-baseline gap-2">
                      <span className="text-amber-700 font-bold text-lg">₦{prod.finalPrice?.toLocaleString()}</span>
                      {prod.discount > 0 && <span className="text-xs text-slate-400 line-through">₦{prod.price?.toLocaleString()}</span>}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => handleAddToCart(prod)}
                      disabled={isOutOfStock || addingId === pId}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-amber-300 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-2"
                    >
                      {addingId === pId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                      <span>{isOutOfStock ? 'Out of Stock' : 'Add to Shopping Bag'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-indigo-600" />
                <span>Best Selling Creations</span>
              </h2>
              <p className="text-xs text-slate-500">Most coveted signature pieces chosen by clients</p>
            </div>
            <Link to="/shop?bestSeller=true" className="text-xs font-semibold text-amber-700 hover:underline">
              View Best Sellers →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((prod) => {
              const pId = prod._id || prod.id;
              const inWishlist = isInWishlist(pId);
              const isOutOfStock = prod.quantity === 0;

              return (
                <div key={pId} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-400 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="relative w-full h-52 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                      {prod.images && prod.images.length > 0 ? (
                        <img src={getImageUrl(prod.images[0])} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <ShoppingBag className="w-10 h-10 text-slate-300" />
                      )}

                      <button
                        onClick={() => handleWishlistToggle(prod)}
                        className={`absolute top-2 right-2 p-2 rounded-full shadow-sm transition-all ${
                          inWishlist ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-white/90 text-slate-400 hover:text-rose-500'
                        }`}
                        title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500' : ''}`} />
                      </button>
                    </div>

                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {prod.category?.name || 'Luxury'}
                    </span>
                    <Link to={`/product/${prod.slug}`} className="font-serif text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 block">
                      {prod.name}
                    </Link>
                    <div className="flex items-baseline gap-2">
                      <span className="text-amber-700 font-bold text-lg">₦{prod.finalPrice?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => handleAddToCart(prod)}
                      disabled={isOutOfStock || addingId === pId}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-amber-300 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-2"
                    >
                      {addingId === pId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                      <span>{isOutOfStock ? 'Out of Stock' : 'Add to Shopping Bag'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Value Proposition Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-slate-900">100% Authentic Luxury</h3>
          <p className="text-sm text-slate-600 leading-relaxed">Every piece is verified for craftsmanship, premium materials, and authentic heritage.</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-slate-900">Express Global Delivery</h3>
          <p className="text-sm text-slate-600 leading-relaxed">Dispatched in custom protective packaging with priority white-glove courier service.</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-slate-900">24/7 Dedicated Concierge</h3>
          <p className="text-sm text-slate-600 leading-relaxed">Personal stylists and advisors available round-the-clock to assist your shopping experience.</p>
        </div>
      </section>
    </div>
  );
};
