import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import { Layers, Loader2, ArrowRight } from 'lucide-react';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      setLoading(true);
      try {
        const res = await categoryAPI.getCategories(false);
        if (res.success) {
          setCategories(res.data.categories || []);
        }
      } catch (err) {
        console.warn('Failed to load categories:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">Boutique Collections</h1>
          <p className="text-sm text-slate-500">Explore signature collections curated for luxury and elegance</p>
        </div>
        <span className="text-xs bg-amber-50 border border-amber-200 text-amber-800 font-semibold px-3 py-1 rounded-full">
          {categories.length} Collections
        </span>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading luxury categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-slate-900">No Categories Found</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/category/${cat.slug}`}
              className="bg-white border border-slate-200 hover:border-amber-400 p-5 rounded-3xl space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="w-full h-44 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {cat.image ? (
                    <img src={getImageUrl(cat.image)} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Layers className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{cat.name}</h3>
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold border border-slate-200 shrink-0">
                    {cat.productCount || 0} Products
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
              </div>

              <div className="pt-2 text-amber-700 font-semibold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Browse Collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
