import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminReviewAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import {
  Star, Search, CheckCircle, XCircle, Trash2, Loader2, AlertCircle,
  MessageSquare, Eye, EyeOff, Flag, Award, MessageCircle, X,
} from 'lucide-react';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  published: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 border border-rose-300',
  hidden: 'bg-slate-100 text-slate-700 border border-slate-300',
};

const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-3 h-3 ${s <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
    ))}
  </div>
);

export const AdminReviewsPage = () => {
  const [activeSubTab, setActiveSubTab] = useState('reviews'); // 'reviews' | 'reports'

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0, hidden: 0, reported: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState(false);

  const [moderating, setModerating] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Response modal
  const [responseModalReview, setResponseModalReview] = useState(null);
  const [responseComment, setResponseComment] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (ratingFilter) params.rating = ratingFilter;
      if (featuredFilter) params.featured = 'true';

      const res = await adminReviewAPI.getAdminReviews(params);
      if (res.success) {
        setReviews(res.data.reviews);
        setSummary(res.data.summary || {});
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, ratingFilter, featuredFilter]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await adminReviewAPI.getReviewReports();
      if (res.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.warn('Reports fetch error:', err.message);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSubTab === 'reviews') fetchReviews(1);
    else if (activeSubTab === 'reports') fetchReports();
  }, [activeSubTab, fetchReviews, fetchReports]);

  const handleModerate = async (reviewId, status, note = '') => {
    setModerating(reviewId);
    try {
      await adminReviewAPI.moderateReview(reviewId, status, note);
      fetchReviews(pagination.page);
    } catch (err) {
      alert(err.message || 'Moderation failed');
    } finally {
      setModerating(null);
    }
  };

  const handleToggleFeature = async (reviewId) => {
    try {
      const res = await adminReviewAPI.toggleFeatureReview(reviewId);
      if (res.success) fetchReviews(pagination.page);
    } catch (err) {
      alert(err.message || 'Toggle featured failed');
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!responseModalReview || !responseComment.trim()) return;
    setSubmittingResponse(true);
    try {
      const res = await adminReviewAPI.adminRespondReview(responseModalReview._id, responseComment.trim());
      if (res.success) {
        setResponseModalReview(null);
        setResponseComment('');
        fetchReviews(pagination.page);
      }
    } catch (err) {
      alert(err.message || 'Failed to post admin response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const res = await adminReviewAPI.moderateReviewReport(reportId, action);
      if (res.success) fetchReports();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Permanently delete this review? This action cannot be undone.')) return;
    setDeleting(reviewId);
    try {
      await adminReviewAPI.deleteReview(reviewId);
      fetchReviews(pagination.page);
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">Review Moderation Center</h1>
          <p className="text-sm text-slate-500 mt-1">Manage customer ratings, featured reviews, official responses & flagged content</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('reviews')}
          className={`pb-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'reviews' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Product Reviews ({summary.total || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`pb-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'reports' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Reported Content ({summary.reported || 0})</span>
        </button>
      </div>

      {activeSubTab === 'reviews' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: 'pending', label: 'Pending', count: summary.pending, color: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500' },
              { key: 'approved', label: 'Published', count: summary.approved, color: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500' },
              { key: 'rejected', label: 'Rejected', count: summary.rejected, color: 'bg-rose-50 border-rose-200 text-rose-800', dot: 'bg-rose-500' },
              { key: 'hidden', label: 'Hidden', count: summary.hidden, color: 'bg-slate-50 border-slate-200 text-slate-800', dot: 'bg-slate-500' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(statusFilter === s.key ? '' : s.key)}
                className={`${s.color} border rounded-2xl p-4 text-left transition-all hover:shadow-sm ${statusFilter === s.key ? 'ring-2 ring-offset-1 ring-current' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`}></span>
                  <span className="text-xs font-semibold uppercase tracking-wide">{s.label}</span>
                </div>
                <p className="text-3xl font-bold">{s.count ?? 0}</p>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or comment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>)}
            </select>
            <button
              onClick={() => setFeaturedFilter(!featuredFilter)}
              className={`text-xs px-3 py-2 rounded-xl font-bold border transition-all ${
                featuredFilter ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ★ Featured Only
            </button>
          </div>

          {/* Table */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">No reviews matching filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const productImg = review.product?.images?.[0];
                const isAct = moderating === review._id || deleting === review._id;
                return (
                  <div key={review._id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Product thumbnail */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border shrink-0">
                        {productImg ? (
                          <img src={getImageUrl(productImg)} alt={review.product?.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StarDisplay rating={review.rating} />
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_BADGE[review.status] || STATUS_BADGE.pending}`}>
                            {review.status}
                          </span>
                          {review.isVerifiedPurchase && (
                            <span className="text-[11px] px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-bold">
                              ✓ Verified Purchase
                            </span>
                          )}
                          {review.isFeatured && (
                            <span className="text-[11px] px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-full font-bold flex items-center gap-1">
                              <Award className="w-3 h-3" /> Featured
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-bold text-slate-900">{review.title}</p>
                        <p className="text-xs text-slate-700 leading-relaxed">{review.comment}</p>

                        {/* Customer Photos */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 pt-1">
                            {review.images.map((img, i) => (
                              <img key={i} src={getImageUrl(img)} alt="Upload" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span>
                            By <strong className="text-slate-700">{review.user?.firstName} {review.user?.lastName} ({review.user?.email})</strong>
                          </span>
                          <span>·</span>
                          <Link to={`/product/${review.product?.slug}`} className="text-amber-700 hover:underline font-semibold">
                            {review.product?.name}
                          </Link>
                          <span>·</span>
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Existing Admin Response */}
                        {review.adminResponse?.comment && (
                          <div className="bg-amber-50 border-l-2 border-amber-600 p-2.5 rounded-r-xl text-xs space-y-0.5">
                            <span className="font-bold text-amber-900">Official Admin Response:</span>
                            <p className="text-slate-700">{review.adminResponse.comment}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                        {review.status !== 'approved' && review.status !== 'published' && (
                          <button
                            onClick={() => handleModerate(review._id, 'approved')}
                            disabled={isAct}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button
                            onClick={() => handleModerate(review._id, 'rejected')}
                            disabled={isAct}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleFeature(review._id)}
                          className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            review.isFeatured ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" /> {review.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          onClick={() => { setResponseModalReview(review); setResponseComment(review.adminResponse?.comment || ''); }}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-semibold"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Response
                        </button>
                        <button
                          onClick={() => handleDelete(review._id)}
                          disabled={isAct}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 text-center transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
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
                  onClick={() => fetchReviews(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                    p === pagination.page ? 'bg-slate-900 text-amber-300' : 'bg-white border border-slate-200 text-slate-700 hover:border-amber-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REPORTS SUB-TAB */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          {reportsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
              <Flag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              No flagged review reports to investigate.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report._id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                        Reason: {report.reason.replace('_', ' ')}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        Reported by {report.user?.firstName} {report.user?.lastName} ({report.user?.email}) on {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      Status: {report.status}
                    </span>
                  </div>

                  {report.description && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg">
                      "{report.description}"
                    </p>
                  )}

                  {/* Targeted Review */}
                  {report.review && (
                    <div className="border-l-2 border-slate-300 pl-3 py-1 space-y-1 text-xs">
                      <p className="font-bold text-slate-900">Target Review: "{report.review.title}"</p>
                      <p className="text-slate-600">{report.review.comment}</p>
                    </div>
                  )}

                  {report.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleReportAction(report._id, 'resolve_hide_review')}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl"
                      >
                        Hide Review & Mark Resolved
                      </button>
                      <button
                        onClick={() => handleReportAction(report._id, 'dismiss')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-xl"
                      >
                        Dismiss Report
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Response Modal */}
      {responseModalReview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setResponseModalReview(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-amber-600" /> Add Official Response
              </h3>
              <button onClick={() => setResponseModalReview(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResponseSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Official Response Comment *</label>
                <textarea
                  value={responseComment}
                  onChange={(e) => setResponseComment(e.target.value)}
                  rows={4}
                  required
                  placeholder="e.g. Thank you for your feedback! We are thrilled that you love the quality..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setResponseModalReview(null)} className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={submittingResponse} className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold disabled:opacity-50">
                  {submittingResponse ? 'Submitting...' : 'Post Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
