import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI, reviewAPI, questionAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import {
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Heart,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Plus,
  Minus,
  Star,
  MessageSquare,
  X,
  ThumbsUp,
  Flag,
  Image as ImageIcon,
  HelpCircle,
  Upload,
} from 'lucide-react';

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantityInput, setQuantityInput] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'photos' | 'questions'

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [reviewSort, setReviewSort] = useState('newest');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [reviewFiles, setReviewFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewFormError, setReviewFormError] = useState(null);

  // Report modal state
  const [reportModalReviewId, setReportModalReviewId] = useState(null);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);

  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState(null);

  // Q&A State
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionSuccess, setQuestionSuccess] = useState(false);
  const [answerInputMap, setAnswerInputMap] = useState({});

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productAPI.getProductBySlug(slug);
        if (res.success && res.data.product) {
          setProduct(res.data.product);
          setRelatedProducts(res.data.relatedProducts || []);
          setSelectedImageIndex(0);
          setQuantityInput(1);
          setReviews([]);
          setReviewPage(1);
          setReviewSuccess(false);
          setShowReviewForm(false);
        }
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const fetchReviews = useCallback(async (pid, page = 1) => {
    if (!pid) return;
    setReviewsLoading(true);
    try {
      const params = { page, limit: 5, sort: reviewSort };
      if (reviewRatingFilter) params.rating = reviewRatingFilter;
      const [revRes, summRes] = await Promise.all([
        reviewAPI.getProductReviews(pid, params),
        reviewAPI.getProductReviewSummary(pid),
      ]);
      if (revRes.success) {
        setReviews(revRes.data.reviews || []);
        setReviewPagination(revRes.data.pagination);
      }
      if (summRes.success) setReviewSummary(summRes.data);
    } catch (err) {
      console.warn('Reviews fetch error:', err.message);
    } finally {
      setReviewsLoading(false);
    }
  }, [reviewSort, reviewRatingFilter]);

  const fetchQuestions = useCallback(async (pid) => {
    if (!pid) return;
    setQuestionsLoading(true);
    try {
      const res = await questionAPI.getProductQuestions(pid);
      if (res.success) {
        setQuestions(res.data.questions || []);
      }
    } catch (err) {
      console.warn('Questions fetch error:', err.message);
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (product?._id) {
      fetchReviews(product._id, reviewPage);
      fetchQuestions(product._id);
    }
  }, [product?._id, reviewPage, fetchReviews, fetchQuestions]);

  useEffect(() => {
    if (product?._id && user) {
      reviewAPI
        .checkEligibility(product._id)
        .then((res) => {
          if (res.success) setEligibility(res.data);
        })
        .catch(() => {});
    } else {
      setEligibility(null);
    }
  }, [product?._id, user]);

  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setReviewFiles(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating || !reviewForm.title.trim() || !reviewForm.comment.trim()) {
      setReviewFormError('Please fill in all required fields.');
      return;
    }
    setSubmittingReview(true);
    setReviewFormError(null);

    try {
      const formData = new FormData();
      formData.append('rating', reviewForm.rating);
      formData.append('title', reviewForm.title.trim());
      formData.append('comment', reviewForm.comment.trim());
      if (eligibility?.orderId) {
        formData.append('orderId', eligibility.orderId);
      }
      reviewFiles.forEach((file) => {
        formData.append('images', file);
      });

      await reviewAPI.createReview(product._id, formData);
      setReviewSuccess(true);
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      setReviewFiles([]);
      setImagePreviews([]);
      fetchReviews(product._id, 1);

      reviewAPI.checkEligibility(product._id).then((res) => {
        if (res.success) setEligibility(res.data);
      });
    } catch (err) {
      setReviewFormError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleHelpfulClick = async (reviewId) => {
    if (!user) return alert('Please sign in to vote.');
    try {
      const res = await reviewAPI.toggleHelpfulVote(reviewId);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId
              ? { ...r, helpfulCount: res.data.helpfulCount, isUserHelpful: res.data.isHelpful }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Helpful vote error:', err.message);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportModalReviewId) return;
    setSubmittingReport(true);
    try {
      const res = await reviewAPI.reportReview(reportModalReviewId, {
        reason: reportReason,
        description: reportDescription,
      });
      if (res.success) {
        setReportSuccess('Thank you for reporting. Our moderation team will investigate.');
        setTimeout(() => {
          setReportModalReviewId(null);
          setReportSuccess(null);
          setReportDescription('');
        }, 1800);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setSubmittingQuestion(true);
    try {
      const res = await questionAPI.createQuestion(product._id, newQuestionText.trim());
      if (res.success) {
        setQuestionSuccess(true);
        setNewQuestionText('');
        setShowQuestionModal(false);
        fetchQuestions(product._id);
        setTimeout(() => setQuestionSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to post question');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAnswerSubmit = async (questionId) => {
    const text = answerInputMap[questionId];
    if (!text || !text.trim()) return;
    try {
      const res = await questionAPI.createAnswer(product._id, questionId, text.trim());
      if (res.success) {
        setAnswerInputMap((prev) => ({ ...prev, [questionId]: '' }));
        fetchQuestions(product._id);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit answer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading luxury product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-sm text-slate-500">The requested luxury item is no longer available in our catalogue.</p>
        <Link to="/shop" className="inline-block bg-slate-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-sm">
          Return to Boutique
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const productId = product._id || product.id;
  const inWishlist = isInWishlist(productId);
  const isOutOfStock = product.quantity <= 0 || product.status !== 'active';

  const handleAddToCartClick = async () => {
    if (isOutOfStock) return;
    setAddingToCart(true);
    await addToCart(product, quantityInput);
    setAddingToCart(false);
  };

  const handleWishlistToggle = async () => {
    if (inWishlist) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-amber-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Boutique</span>
      </Link>

      {/* Main Product Showcase */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 shadow-sm">
        {/* Gallery Section */}
        <div className="space-y-4">
          <div className="relative w-full h-96 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center">
            {images.length > 0 ? (
              <img
                src={getImageUrl(images[selectedImageIndex] || images[0])}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ShoppingBag className="w-16 h-16 text-slate-300" />
            )}

            {product.discount > 0 && (
              <span className="absolute top-4 left-4 bg-amber-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-md shadow-sm">
                {product.discount}% OFF
              </span>
            )}

            <button
              onClick={handleWishlistToggle}
              className={`absolute top-4 right-4 p-3 rounded-full shadow-md transition-all ${
                inWishlist ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-white/90 text-slate-400 hover:text-rose-500'
              }`}
              title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-5 h-5 ${inWishlist ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl bg-slate-50 border-2 overflow-hidden shrink-0 transition-all ${
                    selectedImageIndex === idx ? 'border-amber-600 scale-95' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to={`/category/${product.category?.slug}`}
                className="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 hover:bg-emerald-100"
              >
                {product.category?.name || 'Category'}
              </Link>
              <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Pricing & Rating Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-amber-700">₦{product.finalPrice?.toLocaleString()}</span>
                {product.discount > 0 && (
                  <span className="text-base text-slate-400 line-through">₦{product.price?.toLocaleString()}</span>
                )}
              </div>
              {reviewSummary && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-slate-900 text-sm">{(reviewSummary.averageRating || 0).toFixed(1)}</span>
                  <span className="text-xs text-slate-500">({reviewSummary.totalReviews})</span>
                </div>
              )}
            </div>

            {/* Stock Availability Badge */}
            <div className="pt-1">
              {product.quantity === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Out of Stock</span>
                </span>
              ) : product.quantity <= 5 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Low Stock ({product.quantity} remaining)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>In Stock ({product.quantity} available)</span>
                </span>
              )}
            </div>

            <p className="text-slate-600 text-sm leading-relaxed pt-2">
              {product.shortDescription || product.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">Select Quantity:</span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setQuantityInput((q) => Math.max(1, q - 1))}
                    className="p-2 text-slate-700 hover:bg-slate-200 rounded-l-xl transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 py-1.5 text-sm font-bold text-slate-900">{quantityInput}</span>
                  <button
                    type="button"
                    onClick={() => setQuantityInput((q) => Math.min(product.quantity, q + 1))}
                    disabled={quantityInput >= product.quantity}
                    className="p-2 text-slate-700 hover:bg-slate-200 rounded-r-xl disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleAddToCartClick}
                disabled={isOutOfStock || addingToCart}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-amber-300 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
              >
                {addingToCart ? <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> : <ShoppingBag className="w-5 h-5" />}
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Shopping Bag'}</span>
              </button>

              <button
                type="button"
                onClick={handleWishlistToggle}
                className={`w-full font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border transition-all ${
                  inWishlist
                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : 'text-rose-500'}`} />
                <span>{inWishlist ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Guaranteed Authentic Ayoola Signature Creation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Overview & Specifications */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-4 shadow-sm">
        <h2 className="font-serif text-2xl font-bold text-slate-900 border-b border-slate-100 pb-3">Product Overview & Craftsmanship</h2>
        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
          {product.description}
        </p>
      </div>

      {/* ── Phase 11: Feedback, Reviews & Q&A Section ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'reviews' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Customer Reviews ({reviewSummary?.totalReviews || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'photos' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Customer Photos ({reviewSummary?.customerPhotos?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'questions' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Questions & Answers ({questions.length})</span>
            </button>
          </div>

          {activeTab === 'reviews' && (
            user ? (
              eligibility?.eligible && !showReviewForm && !reviewSuccess ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-amber-300 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  <Star className="w-4 h-4" /> Write a Review
                </button>
              ) : !eligibility?.eligible && eligibility ? (
                <span className="text-xs text-slate-500 italic">{eligibility.reason || eligibility.message}</span>
              ) : null
            ) : (
              <Link to="/login" className="text-xs text-amber-700 font-semibold hover:underline shrink-0">
                Sign in to review →
              </Link>
            )
          )}

          {activeTab === 'questions' && (
            <button
              onClick={() => setShowQuestionModal(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-amber-300 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
            >
              <HelpCircle className="w-4 h-4" /> Ask a Question
            </button>
          )}
        </div>

        {/* Success Banners */}
        {reviewSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Thank you for your review! It will appear publicly after moderation.</span>
          </div>
        )}
        {questionSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Your question has been posted! Our team will respond shortly.</span>
          </div>
        )}

        {/* TAB 1: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Rating Breakdown & Stats */}
            {reviewSummary && reviewSummary.totalReviews > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="text-center sm:border-r border-slate-200 pr-4">
                    <p className="font-serif text-5xl font-bold text-slate-900">{(reviewSummary.averageRating || 0).toFixed(1)}</p>
                    <div className="flex justify-center gap-0.5 my-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-5 h-5 ${s <= Math.round(reviewSummary.averageRating || 0) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">Based on {reviewSummary.totalReviews} verified reviews</p>
                  </div>
                  <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const cnt = reviewSummary.distribution?.[star] || 0;
                      const pct = reviewSummary.totalReviews > 0 ? (cnt / reviewSummary.totalReviews) * 100 : 0;
                      return (
                        <button
                          key={star}
                          onClick={() => {
                            setReviewRatingFilter(reviewRatingFilter === star ? '' : star);
                            setReviewPage(1);
                          }}
                          className={`flex items-center gap-2 w-full group ${reviewRatingFilter === star ? 'opacity-100' : 'hover:opacity-80'}`}
                        >
                          <span className="text-xs text-slate-500 w-3 font-bold">{star}</span>
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 w-6 text-right font-mono">{cnt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Write Review Form */}
            {showReviewForm && (
              <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-slate-900">Write Your Product Review</h3>
                  <button onClick={() => setShowReviewForm(false)} className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {reviewFormError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {reviewFormError}
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-2">Overall Rating *</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setReviewForm((p) => ({ ...p, rating: s }))} className="focus:outline-none">
                          <Star className={`w-8 h-8 transition-all ${s <= reviewForm.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 hover:text-amber-400'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Review Title *</label>
                    <input
                      type="text"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm((p) => ({ ...p, title: e.target.value }))}
                      maxLength={120}
                      required
                      placeholder="e.g. Magnificent craftsmanship and fast delivery"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Review Comments *</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                      rows={4}
                      minLength={10}
                      maxLength={2000}
                      required
                      placeholder="Share detailed thoughts on quality, sizing, material, or fit..."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none bg-white"
                    />
                    <p className="text-right text-xs text-slate-400 mt-0.5">{reviewForm.comment.length}/2000</p>
                  </div>

                  {/* Photo Upload Input */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Attach Customer Photos (Optional, max 5)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-amber-300 hover:file:bg-slate-800"
                    />
                    {imagePreviews.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {imagePreviews.map((src, i) => (
                          <img key={i} src={src} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-300" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowReviewForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                      Cancel
                    </button>
                    <button type="submit" disabled={submittingReview} className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-amber-300 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                      {submittingReview ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Sort & Filter Controls */}
            {(reviews.length > 0 || reviewsLoading) && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Sort by:</span>
                  {[
                    ['newest', 'Newest'],
                    ['highest', 'Highest Rated'],
                    ['lowest', 'Lowest Rated'],
                    ['helpful', 'Most Helpful'],
                    ['verified', 'Verified First'],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => { setReviewSort(val); setReviewPage(1); }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        reviewSort === val ? 'bg-slate-900 text-amber-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {reviewRatingFilter && (
                  <button onClick={() => { setReviewRatingFilter(''); setReviewPage(1); }} className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear filter ({reviewRatingFilter} ★)
                  </button>
                )}
              </div>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="border border-slate-200 rounded-2xl p-10 text-center space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 text-sm font-medium">
                  {reviewRatingFilter ? 'No reviews found for this star rating.' : 'No reviews yet for this product.'}
                </p>
                <p className="text-xs text-slate-400">Be the first verified customer to share your experience!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="border border-slate-200 rounded-2xl p-5 space-y-3 hover:border-amber-300 transition-colors bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                            ))}
                          </div>
                          {review.isVerifiedPurchase && (
                            <span className="text-[11px] px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-bold">
                              ✓ Verified Purchase
                            </span>
                          )}
                          {review.isFeatured && (
                            <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">
                              ★ Featured Review
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{review.title}</h4>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(review.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{review.comment}</p>

                    {/* Attached Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 pt-1 overflow-x-auto">
                        {review.images.map((img, i) => (
                          <button key={i} onClick={() => setLightboxImage(img)} className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0 hover:opacity-80">
                            <img src={getImageUrl(img)} alt="Customer upload" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Official Admin Response Subdocument */}
                    {review.adminResponse?.comment && (
                      <div className="bg-amber-50 border-l-4 border-amber-600 p-3 rounded-r-xl space-y-1 text-xs">
                        <span className="font-bold text-amber-900">Response from Ayoola Signature:</span>
                        <p className="text-slate-700">{review.adminResponse.comment}</p>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="text-slate-400">
                        By <strong className="text-slate-700">{review.user?.firstName || 'Customer'} {review.user?.lastName ? review.user.lastName[0] + '.' : ''}</strong>
                      </span>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleHelpfulClick(review._id)}
                          className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                            review.isUserHelpful ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${review.isUserHelpful ? 'fill-amber-800' : ''}`} />
                          <span>Helpful ({review.helpfulCount || 0})</span>
                        </button>

                        <button
                          onClick={() => setReportModalReviewId(review._id)}
                          className="text-slate-400 hover:text-rose-600 flex items-center gap-1"
                          title="Report inappropriate review"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {reviewPagination.pages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                {Array.from({ length: reviewPagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setReviewPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                      p === reviewPagination.page ? 'bg-slate-900 text-amber-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CUSTOMER PHOTOS */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            {reviewSummary?.customerPhotos && reviewSummary.customerPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {reviewSummary.customerPhotos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxImage(photo.url)}
                    className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square hover:border-amber-500 shadow-sm"
                  >
                    <img src={getImageUrl(photo.url)} alt="Customer photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white text-left">
                      <p className="font-bold text-xs line-clamp-1">{photo.title}</p>
                      <p className="text-[10px] text-amber-300">By {photo.userName}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm">
                <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                No customer photos attached to reviews yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUESTIONS & ANSWERS */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {questionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              </div>
            ) : questions.length === 0 ? (
              <div className="border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 text-sm font-medium">Have a question about this product?</p>
                <button onClick={() => setShowQuestionModal(true)} className="bg-slate-900 text-amber-300 text-xs font-bold px-4 py-2 rounded-xl">
                  Ask the First Question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q._id} className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Question</span>
                        <h4 className="font-bold text-base text-slate-900">{q.question}</h4>
                        <p className="text-xs text-slate-400">
                          Asked by {q.user?.firstName || 'Customer'} on {new Date(q.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Answers List */}
                    <div className="space-y-2.5 pl-4 border-l-2 border-amber-300 pt-1">
                      {q.answers && q.answers.length > 0 ? (
                        q.answers.map((ans) => (
                          <div key={ans._id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900">{ans.user?.firstName} {ans.user?.lastName}</strong>
                              {ans.isAdmin && (
                                <span className="bg-amber-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                                  Ayoola Signature Official
                                </span>
                              )}
                              {ans.isVerifiedBuyer && !ans.isAdmin && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                  ✓ Verified Buyer
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 text-sm">{ans.answer}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No answers yet for this question.</p>
                      )}

                      {/* Reply Input */}
                      {user && (
                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="Add an answer..."
                            value={answerInputMap[q._id] || ''}
                            onChange={(e) => setAnswerInputMap((prev) => ({ ...prev, [q._id]: e.target.value }))}
                            className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleAnswerSubmit(q._id)}
                            className="bg-slate-900 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-slate-800"
                          >
                            Answer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal 1: Lightbox View */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-3xl w-full bg-black rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxImage(null)} className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black">
              <X className="w-5 h-5" />
            </button>
            <img src={getImageUrl(lightboxImage)} alt="Customer photo full" className="w-full max-h-[80vh] object-contain mx-auto" />
          </div>
        </div>
      )}

      {/* Modal 2: Report Review */}
      {reportModalReviewId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setReportModalReviewId(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                <Flag className="w-5 h-5 text-rose-600" /> Report Inappropriate Review
              </h3>
              <button onClick={() => setReportModalReviewId(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <p className="text-emerald-700 text-sm font-semibold text-center py-4">{reportSuccess}</p>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Reason *</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="spam">Spam or repeated content</option>
                    <option value="offensive">Offensive or abusive language</option>
                    <option value="false_information">False or misleading information</option>
                    <option value="personal_information">Exposes personal details</option>
                    <option value="advertisement">Promotional advertisement</option>
                    <option value="other">Other reason</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Additional Details (Optional)</label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Provide context for our moderators..."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setReportModalReviewId(null)} className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700">
                    Cancel
                  </button>
                  <button type="submit" disabled={submittingReport} className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50">
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 3: Ask Question */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowQuestionModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-600" /> Ask a Product Question
              </h3>
              <button onClick={() => setShowQuestionModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Your Question *</label>
                <textarea
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  rows={4}
                  minLength={5}
                  maxLength={500}
                  required
                  placeholder="e.g. Does this product come with a luxury protective storage box?"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowQuestionModal(false)} className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={submittingQuestion} className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold disabled:opacity-50">
                  {submittingQuestion ? 'Posting...' : 'Post Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-serif text-2xl font-bold text-slate-900">Related Signature Products</h2>
            <p className="text-xs text-slate-500">More luxury recommendations from {product.category?.name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <div key={rel._id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-amber-400 shadow-sm transition-all group flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-full h-44 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                    {rel.images && rel.images.length > 0 ? (
                      <img src={getImageUrl(rel.images[0])} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <h3 className="font-serif text-base font-bold text-slate-900 line-clamp-1">{rel.name}</h3>
                  <p className="text-amber-700 font-bold text-sm">₦{rel.finalPrice?.toLocaleString()}</p>
                </div>
                <Link
                  to={`/product/${rel.slug}`}
                  className="mt-3 w-full block text-center bg-slate-900 text-amber-300 font-semibold py-2 px-3 rounded-lg text-xs"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductDetailPage;
