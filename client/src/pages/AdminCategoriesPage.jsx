import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import { Plus, Edit, Trash2, Layers, Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoryAPI.getCategories(true);
      if (res.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate category '${name}'?`)) return;

    try {
      const res = await categoryAPI.deleteCategory(id);
      if (res.success) {
        setMessage(res.message);
        fetchCategories();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete category');
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
            <Layers className="w-7 h-7 text-amber-700" />
            <span>Category Management</span>
          </h1>
          <p className="text-sm text-slate-500">Manage boutique collections and catalogue categories</p>
        </div>

        <Link
          to="/admin/categories/new"
          className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold px-5 py-2.5 rounded-xl shadow-sm text-sm flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
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

      {/* Categories Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">No categories found in MongoDB</p>
            <Link
              to="/admin/categories/new"
              className="inline-block bg-slate-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-sm"
            >
              Create First Category
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="py-4 px-6">Image</th>
                  <th className="py-4 px-6">Category Name</th>
                  <th className="py-4 px-6">Slug</th>
                  <th className="py-4 px-6">Products</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400">
                        {cat.image ? (
                          <img src={getImageUrl(cat.image)} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <Layers className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">{cat.name}</td>
                    <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">{cat.slug}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-700">{cat.productCount || 0}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-block text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                          cat.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <Link
                        to={`/admin/categories/${cat._id}/edit`}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-amber-700 p-2 rounded-lg hover:bg-slate-100 font-medium text-xs"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(cat._id, cat.name)}
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
      </div>
    </div>
  );
};
export default AdminCategoriesPage;
