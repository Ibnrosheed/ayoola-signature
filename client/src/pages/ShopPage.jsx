import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getImageUrl } from '../utils/imageUrl';
import { ShoppingBag, Heart, Search, Loader2 } from 'lucide-react';

export const ShopPage = () => {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  // Filter & Search Controls
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getCategories(false);
      if (res.success) setCategories(res.data.categories || []);
    } catch (err) {
      console.warn('Failed to fetch categories:', err.message);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        sort,
        category: selectedCategory || undefined,
        search: search.trim() || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
      };

      const res = await productAPI.getProducts(params);
      if (res.success) {
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
      }
    } catch (err) {
      console.warn('Failed to fetch boutique catalogue:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory, sort]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

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
    <div className="space-y-8">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">Boutique Collection</h1>
          <p className="text-sm text-slate-500">Explore our signature luxury catalogue and bespoke collections</p>
        </div>
        <span className="text-xs bg-amber-50 border border-amber-200 text-amber-800 font-semibold px-3.5 py-1.5 rounded-full">
          {pagination.total} Products Available
        </span>
      </div>

      {/* Toolbar: Search, Filters & Sort */}
      <form onSubmit={handleFilterSubmit} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, details..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>

          {/* Min & Max Price */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="number"
              placeholder="Min ₦"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max ₦"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
            />
          </div>

          <button type="submit" className="bg-slate-900 text-amber-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800">
            Filter
          </button>

          {/* Sorting */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="oldest">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
          </select>
        </div>
      </form>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Fetching catalogue items...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-slate-900">No Products Found</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or price filter parameters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => {
            const pId = prod._id || prod.id;
            const inWishlist = isInWishlist(pId);
            const isOutOfStock = prod.quantity === 0;

            return (
              <div key={pId} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-400 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="relative w-full h-52 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 group-hover:border-amber-300 transition-colors">
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
                      <span className="absolute top-2 left-2 bg-amber-600 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm">
                        {prod.discount}% OFF
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="absolute bottom-2 left-2 bg-slate-900/90 text-rose-300 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {prod.category?.name || 'Luxury'}
                    </span>
                    {prod.quantity > 0 && prod.quantity <= 5 && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                        Only {prod.quantity} Left
                      </span>
                    )}
                  </div>

                  <Link to={`/product/${prod.slug}`} className="font-serif text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 block">
                    {prod.name}
                  </Link>
                  <p className="text-xs text-slate-500 line-clamp-2">{prod.shortDescription}</p>

                  <div className="pt-1 flex items-baseline gap-2">
                    <span className="text-amber-700 font-bold text-lg">₦{prod.finalPrice?.toLocaleString()}</span>
                    {prod.discount > 0 && (
                      <span className="text-xs text-slate-400 line-through">₦{prod.price?.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <button
                    onClick={() => handleAddToCart(prod)}
                    disabled={isOutOfStock || addingId === pId}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-amber-300 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-2"
                  >
                    {addingId === pId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShoppingBag className="w-3.5 h-3.5" />
                    )}
                    <span>{isOutOfStock ? 'Out of Stock' : 'Add to Shopping Bag'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center text-xs text-slate-500 pt-6 border-t border-slate-200">
          <span>Showing Page {pagination.page} of {pagination.pages} ({pagination.total} total items)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl disabled:opacity-50 hover:bg-slate-100 font-semibold"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl disabled:opacity-50 hover:bg-slate-100 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ShopPage;
