import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { categoryAPI } from '../services/api';
import { ArrowLeft, Loader2, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

export const AdminEditCategoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
  });
  const [currentImage, setCurrentImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await categoryAPI.getCategoryById(id);
        if (res.success && res.data.category) {
          const cat = res.data.category;
          setFormData({
            name: cat.name || '',
            description: cat.description || '',
            status: cat.status || 'active',
          });
          setCurrentImage(cat.image || '');
        }
      } catch (err) {
        setError(err.message || 'Failed to load category details');
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('status', formData.status);
      if (imageFile) {
        data.append('categoryImage', imageFile);
      }

      const res = await categoryAPI.updateCategory(id, data);
      if (res.success) {
        navigate('/admin/categories');
      }
    } catch (err) {
      setError(err.message || 'Failed to update category.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
        <p className="text-sm text-slate-500">Loading category data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
        <Link to="/admin/categories" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">Edit Category</h1>
          <p className="text-sm text-slate-500">Update category details and banner image</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-semibold">Category Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-semibold">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-700 font-semibold">Category Image</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : currentImage ? (
                <img src={currentImage} alt="Current" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-300 flex items-center gap-2 transition-colors">
              <Upload className="w-4 h-4 text-amber-700" />
              <span>Change Image</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-semibold">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
          >
            <option value="active">Active (Visible to Customers)</option>
            <option value="inactive">Inactive (Hidden)</option>
          </select>
        </div>

        <div className="pt-4 flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-amber-300 font-bold py-3 rounded-xl shadow-sm text-sm transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> : null}
            <span>Update Category</span>
          </button>
          <Link
            to="/admin/categories"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};
export default AdminEditCategoryPage;
