import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import { Search, ShoppingBag, Filter, Loader2, ArrowLeft } from 'lucide-react';

export const CategoryProductsPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  const fetchCategoryDetails = async () => {
    try {
      const res = await categoryAPI.getCategoryBySlug(slug);
      if (res.success) {
        setCategory(res.data.category);
      }
    } catch (err) {
      console.warn('Category fetch error:', err.message);
    }
  };

  const fetchCategoryProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        category: slug,
        page,
        limit: 12,
        sort,
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
      setError(err.message || 'Failed to load category products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryDetails();
  }, [slug]);

  useEffect(() => {
    fetchCategoryProducts();
  }, [slug, page, sort]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCategoryProducts();
  };

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link to="/categories" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>All Categories</span>
      </Link>

      {/* Category Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-amber-500/20 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
            Signature Collection
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white capitalize">
            {category ? category.name : slug.replace(/-/g, ' ')}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            {category?.description || 'Explore our exclusive luxury items tailored for sophistication and elegance.'}
          </p>
          <p className="text-xs text-amber-300 font-semibold pt-1">
            {pagination.total} Items Available
          </p>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <form onSubmit={handleFilterSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search in ${category?.name || 'category'}...`}
            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
          />
        </div>

        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
          {/* Price Range inputs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Price:</span>
            <input
              type="number"
              placeholder="Min ₦"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max ₦"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
            />
          </div>

          <button type="submit" className="bg-slate-900 text-amber-300 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800">
            Filter
          </button>

          {/* Sort Selector */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </form>

      {/* Products Grid */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Fetching catalogue items...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-slate-900">No Items Found</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            There are currently no active products available in this category matching your search or price criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <div key={prod._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-400 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
              <div className="space-y-3">
                <div className="relative w-full h-52 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 group-hover:border-amber-300 transition-colors">
                  {prod.images && prod.images.length > 0 ? (
                    <img src={getImageUrl(prod.images[0])} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <ShoppingBag className="w-10 h-10 text-slate-300" />
                  )}
                  {prod.discount > 0 && (
                    <span className="absolute top-2 left-2 bg-amber-600 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm">
                      {prod.discount}% OFF
                    </span>
                  )}
                  {prod.quantity === 0 && (
                    <span className="absolute top-2 right-2 bg-slate-900/90 text-rose-300 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
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

                <h3 className="font-serif text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                  {prod.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">{prod.shortDescription}</p>

                <div className="pt-1 flex items-baseline gap-2">
                  <span className="text-amber-700 font-bold text-lg">₦{prod.finalPrice?.toLocaleString()}</span>
                  {prod.discount > 0 && (
                    <span className="text-xs text-slate-400 line-through">₦{prod.price?.toLocaleString()}</span>
                  )}
                </div>
              </div>

              <Link
                to={`/product/${prod.slug}`}
                className="mt-5 w-full block text-center bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all text-sm"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-200">
          <span>Page {pagination.page} of {pagination.pages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 font-semibold"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default CategoryProductsPage;
