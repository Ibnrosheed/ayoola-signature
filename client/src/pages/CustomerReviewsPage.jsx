import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reviewAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import {
  Star, Loader2, AlertCircle, MessageSquare, Pencil, Trash2,
  X, CheckCircle2, Clock, XCircle,
} from 'lucide-react';

const STATUS_BADGE = {
  pending: { class: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending Moderation' },
  approved: { class: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Published' },
  published: { class: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Published' },
  rejected: { class: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Rejected' },
  hidden: { class: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Hidden' },
};

const StarDisplay = ({ rating, size = 'sm' }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${s <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
      />
    ))}
  </div>
);

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onChange(s)}
        className="focus:outline-none"
      >
        <Star className={`w-7 h-7 transition-all ${s <= value ? 'text-amber-500 fill-amber-500' : 'text-slate-300 hover:text-amber-400'}`} />
      </button>
    ))}
  </div>
);

export const CustomerReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editModal, setEditModal] = useState(null); // review object
  const [editForm, setEditForm] = useState({ rating: 5, title: '', comment: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchMyReviews = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewAPI.getMyReviews({ page, limit: 10 });
      if (res.success) {
        setReviews(res.data.reviews);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyReviews(1); }, [fetchMyReviews]);

  const openEdit = (review) => {
    setEditModal(review);
    setEditForm({ rating: review.rating, title: review.title, comment: review.comment });
    setEditError(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError(null);
    try {
      await reviewAPI.updateReview(editModal._id, editForm);
      setEditModal(null);
      fetchMyReviews(pagination.page);
    } catch (err) {
      setEditError(err.message || 'Failed to update review');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    setDeleting(reviewId);
    try {
      await reviewAPI.deleteReview(reviewId);
      fetchMyReviews(pagination.page);
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">My Reviews</h1>
        <p className="text-sm text-slate-500 mt-0.5">Reviews you have submitted for products you purchased</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-serif text-lg text-slate-700 font-bold mb-1">No Reviews Yet</p>
          <p className="text-sm text-slate-500 mb-4">
            Once you purchase and receive products, you'll be able to share your thoughts here.
          </p>
          <Link to="/shop" className="inline-block bg-slate-900 text-amber-300 font-bold px-5 py-2 rounded-xl text-sm">
            Browse Collection
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const badge = STATUS_BADGE[review.status] || STATUS_BADGE.pending;
            const productImg = review.product?.images?.[0];
            return (
              <div key={review._id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Product image */}
                  <Link to={`/product/${review.product?.slug}`} className="shrink-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      {productImg ? (
                        <img src={getImageUrl(productImg)} alt={review.product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StarDisplay rating={review.rating} />
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${badge.class}`}>
                        {badge.label}
                      </span>
                    </div>

                    <Link to={`/product/${review.product?.slug}`} className="text-xs font-semibold text-amber-700 hover:underline block">
                      {review.product?.name}
                    </Link>

                    <p className="text-sm font-bold text-slate-900">{review.title}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{review.comment}</p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</span>
                      <div className="flex items-center gap-2">
                        {review.status !== 'rejected' && (
                          <button
                            onClick={() => openEdit(review)}
                            className="flex items-center gap-1 text-xs text-slate-600 hover:text-amber-700 font-semibold transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review._id)}
                          disabled={deleting === review._id}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 font-semibold transition-all disabled:opacity-50"
                        >
                          {deleting === review._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchMyReviews(p)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                p === pagination.page
                  ? 'bg-slate-900 text-amber-300'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-amber-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Edit Review Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h3 className="font-serif text-lg font-bold text-slate-900">Edit Your Review</h3>
              <button onClick={() => setEditModal(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{editError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Your Rating</label>
                <StarPicker value={editForm.rating} onChange={(r) => setEditForm((p) => ({ ...p, rating: r }))} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Review Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  maxLength={120}
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Your Review</label>
                <textarea
                  value={editForm.comment}
                  onChange={(e) => setEditForm((p) => ({ ...p, comment: e.target.value }))}
                  rows={4}
                  minLength={10}
                  maxLength={2000}
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"
                />
                <p className="text-right text-xs text-slate-400 mt-0.5">{editForm.comment.length}/2000</p>
              </div>

              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                ⚠️ After editing, your review will be resubmitted for moderation.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-amber-300 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Update Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReviewsPage;
