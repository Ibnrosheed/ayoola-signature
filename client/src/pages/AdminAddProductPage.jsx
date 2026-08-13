import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api';
import { ArrowLeft, Loader2, AlertCircle, Upload, X, Star, Award } from 'lucide-react';

export const AdminAddProductPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    discount: '0',
    quantity: '10',
    shortDescription: '',
    description: '',
    featured: false,
    bestSeller: false,
    status: 'active',
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryAPI.getCategories(true);
        if (res.success) {
          setCategories(res.data.categories || []);
          if (res.data.categories.length > 0) {
            setFormData((prev) => ({ ...prev, category: res.data.categories[0]._id }));
          }
        }
      } catch (err) {
        setError('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCats();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError(null);
  };

  const handleImageFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const updatedFiles = [...imageFiles, ...files].slice(0, 5); // Max 5 images
      setImageFiles(updatedFiles);

      const updatedPreviews = updatedFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews(updatedPreviews);
    }
  };

  const removeImage = (index) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  // Calculated final price preview
  const numPrice = Number(formData.price) || 0;
  const numDiscount = Number(formData.discount) || 0;
  const calculatedFinalPrice = Math.max(0, Math.round(numPrice * (1 - numDiscount / 100)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.category || !formData.price || !formData.description) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      imageFiles.forEach((file) => {
        data.append('images', file);
      });

      const res = await productAPI.createProduct(data);
      if (res.success) {
        navigate('/admin/products');
      }
    } catch (err) {
      setError(err.message || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
        <Link to="/admin/products" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">Add New Product</h1>
          <p className="text-sm text-slate-500">Catalogue a new luxury item in the Ayoola Signature collection</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 space-y-8 shadow-sm">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Basic Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-semibold">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Royal Velvet Agbada Set"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-semibold">SKU (Stock Keeping Unit) *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. AYS-BAG-0005"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-semibold">Category *</label>
              {loadingCategories ? (
                <div className="text-xs text-slate-400 py-2">Loading categories...</div>
              ) : (
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-semibold">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
              >
                <option value="active">Active (Published)</option>
                <option value="inactive">Inactive (Draft / Hidden)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-semibold">Short Description</label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="Brief summary line for product cards..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-semibold">Full Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Detailed product story, craftsmanship, materials..."
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Pricing & Inventory</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-semibold">Price (₦) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="250000"
                min="0"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-semibold">Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                placeholder="10"
                min="0"
                max="100"
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-semibold">Final Price Preview</label>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm font-bold text-amber-800">
                ₦{calculatedFinalPrice.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-1/3 space-y-1">
            <label className="text-xs text-slate-700 font-semibold">Stock Quantity *</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Multi Image Upload */}
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Product Gallery Images</h2>

          <div className="space-y-3">
            <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-300 transition-colors">
              <Upload className="w-4 h-4 text-amber-700" />
              <span>Select Images (Max 5)</span>
              <input type="file" accept="image/*" multiple onChange={handleImageFiles} className="hidden" />
            </label>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative w-full h-28 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden group">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-amber-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Primary</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Showcase Badges */}
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Showcase Settings</h2>
          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <Star className="w-4 h-4 text-amber-600 fill-amber-400" />
              <span>Featured Product (Showcase on Homepage)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                name="bestSeller"
                checked={formData.bestSeller}
                onChange={handleChange}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Best Seller</span>
            </label>
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-amber-300 font-bold py-3.5 rounded-xl shadow-sm text-sm transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> : null}
            <span>Save & Publish Product</span>
          </button>
          <Link
            to="/admin/products"
            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};
export default AdminAddProductPage;
