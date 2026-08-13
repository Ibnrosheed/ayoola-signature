import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import { Plus, Edit, Trash2, Package, Search, Filter, Loader2, AlertCircle, ArrowLeft, CheckCircle, Star, Award } from 'lucide-react';

export const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getCategories(true);
      if (res.success) setCategories(res.data.categories || []);
    } catch (err) {
      console.warn('Failed to load categories for filter:', err.message);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        sort,
        status: selectedStatus || undefined,
        category: selectedCategory || undefined,
        search: search.trim() || undefined,
      };
      const res = await productAPI.getProducts(params);
      if (res.success) {
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory, selectedStatus, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate product '${name}'?`)) return;
    try {
      const res = await productAPI.deleteProduct(id);
      if (res.success) {
        setMessage(res.message);
        fetchProducts();
      }
    } catch (err) {
      setError(err.message || 'Failed to deactivate product');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-amber-700" />
            <span>Product Management</span>
          </h1>
          <p className="text-sm text-slate-500">Manage catalogue products, stock levels, pricing, and showcase flags</p>
        </div>

        <Link
          to="/admin/products/new"
          className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold px-5 py-2.5 rounded-xl shadow-sm text-sm flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-auto flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
            />
          </div>
          <button type="submit" className="bg-slate-900 text-amber-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Sorting */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">No products found matching criteria</p>
            <Link
              to="/admin/products/new"
              className="inline-block bg-slate-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-sm"
            >
              Add First Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6">SKU</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6">Badges</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                          {prod.images && prod.images.length > 0 ? (
                            <img src={getImageUrl(prod.images[0])} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{prod.name}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{prod.shortDescription}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs font-semibold text-slate-700">{prod.sku}</td>
                    <td className="py-3.5 px-6 font-medium text-slate-700">{prod.category?.name || 'Uncategorized'}</td>
                    <td className="py-3.5 px-6">
                      <div>
                        <span className="font-bold text-slate-900">₦{prod.finalPrice?.toLocaleString()}</span>
                        {prod.discount > 0 && (
                          <div className="text-[11px] text-slate-400 line-through">₦{prod.price?.toLocaleString()} (-{prod.discount}%)</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      {prod.quantity === 0 ? (
                        <span className="inline-block text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">Out of Stock</span>
                      ) : prod.quantity <= 5 ? (
                        <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Low Stock ({prod.quantity})</span>
                      ) : (
                        <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">In Stock ({prod.quantity})</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex gap-1.5">
                        {prod.featured && (
                          <span title="Featured" className="p-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                          </span>
                        )}
                        {prod.bestSeller && (
                          <span title="Best Seller" className="p-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                            <Award className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-block text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                          prod.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {prod.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <Link
                        to={`/admin/products/${prod._id}/edit`}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-amber-700 p-2 rounded-lg hover:bg-slate-100 font-medium text-xs"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(prod._id, prod.name)}
                        className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 p-2 rounded-lg hover:bg-rose-50 font-medium text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 bg-slate-50">
            <span>Showing Page {pagination.page} of {pagination.pages} ({pagination.total} total products)</span>
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
    </div>
  );
};
export default AdminProductsPage;
