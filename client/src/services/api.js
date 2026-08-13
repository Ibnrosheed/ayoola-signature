import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ayoola_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error response handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

/**
 * Authentication API Methods
 */
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },
  testAdminAccess: async () => {
    const response = await api.get('/auth/admin-test');
    return response.data;
  },
  testSuperadminAccess: async () => {
    const response = await api.get('/auth/superadmin-test');
    return response.data;
  },
  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
};

/**
 * Category API Methods
 */
export const categoryAPI = {
  getCategories: async (includeAll = false) => {
    const response = await api.get(`/categories${includeAll ? '?all=true' : ''}`);
    return response.data;
  },
  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
  getCategoryBySlug: async (slug) => {
    const response = await api.get(`/categories/slug/${slug}`);
    return response.data;
  },
  createCategory: async (formData) => {
    const response = await api.post('/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  updateCategory: async (id, formData) => {
    const response = await api.put(`/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

/**
 * Product API Methods
 */
export const productAPI = {
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  getProductBySlug: async (slug) => {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data;
  },
  createProduct: async (formData) => {
    const response = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  updateProduct: async (id, formData) => {
    const response = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

/**
 * Cart API Methods (Authenticated Server Cart)
 */
export const cartAPI = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },
  addToCart: async (productId, quantity = 1) => {
    const response = await api.post('/cart/items', { productId, quantity });
    return response.data;
  },
  updateCartItem: async (productId, quantity) => {
    const response = await api.put(`/cart/items/${productId}`, { quantity });
    return response.data;
  },
  removeFromCart: async (productId) => {
    const response = await api.delete(`/cart/items/${productId}`);
    return response.data;
  },
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
  mergeCart: async (guestItems = []) => {
    const response = await api.post('/cart/merge', { items: guestItems });
    return response.data;
  },
};

/**
 * Wishlist API Methods
 */
export const wishlistAPI = {
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },
  addToWishlist: async (productId) => {
    const response = await api.post(`/wishlist/${productId}`);
    return response.data;
  },
  removeFromWishlist: async (productId) => {
    const response = await api.delete(`/wishlist/${productId}`);
    return response.data;
  },
  clearWishlist: async () => {
    const response = await api.delete('/wishlist');
    return response.data;
  },
};

/**
 * Customer Order API Methods
 */
export const orderAPI = {
  createOrder: async (shippingData) => {
    const response = await api.post('/orders', shippingData);
    return response.data;
  },
  getUserOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
  getUserOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};

/**
 * Customer-Facing Coupon API Methods
 */
export const couponAPI = {
  validateCoupon: async (code) => {
    const response = await api.post('/coupons/validate', { code });
    return response.data;
  },
  removeCoupon: async () => {
    const response = await api.delete('/coupons/remove');
    return response.data;
  },
};

/**
 * Payment Verification API Methods
 */
export const paymentAPI = {
  verifyPayment: async (reference) => {
    const response = await api.get(`/payments/verify/${encodeURIComponent(reference)}`);
    return response.data;
  },
};

/**
 * Admin Order Management API Methods
 */
export const adminOrderAPI = {
  getAdminOrders: async (params = {}) => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },
  getAdminOrderById: async (id) => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },
  updateOrderStatus: async (id, orderStatus) => {
    const response = await api.put(`/admin/orders/${id}/status`, { orderStatus });
    return response.data;
  },
};

/**
 * Address Management API Methods
 */
export const addressAPI = {
  getAddresses: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },
  createAddress: async (addressData) => {
    const response = await api.post('/addresses', addressData);
    return response.data;
  },
  updateAddress: async (id, addressData) => {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data;
  },
  deleteAddress: async (id) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },
  setDefaultAddress: async (id) => {
    const response = await api.patch(`/addresses/${id}/default`);
    return response.data;
  },
};

/**
 * User Dashboard & Profile API Methods
 */
export const userAPI = {
  getDashboard: async () => {
    const response = await api.get('/users/dashboard');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await api.put('/users/change-password', passwordData);
    return response.data;
  },
};

/**
 * Phase 7 — Admin Dashboard API
 */
export const adminDashboardAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  getSalesOverview: async (range = '7days') => {
    const response = await api.get('/admin/dashboard/sales', { params: { range } });
    return response.data;
  },
};

/**
 * Phase 7 — Admin Inventory & Product Quick Actions API
 */
export const adminInventoryAPI = {
  getInventory: async (params = {}) => {
    const response = await api.get('/admin/inventory', { params });
    return response.data;
  },
  getInventoryHistory: async (productId, params = {}) => {
    const response = await api.get(`/admin/inventory/${productId}/history`, { params });
    return response.data;
  },
  updateStock: async (productId, data) => {
    const response = await api.patch(`/admin/products/${productId}/stock`, data);
    return response.data;
  },
  updateStatus: async (productId, status) => {
    const response = await api.patch(`/admin/products/${productId}/status`, { status });
    return response.data;
  },
  toggleFeatured: async (productId) => {
    const response = await api.patch(`/admin/products/${productId}/featured`);
    return response.data;
  },
  toggleBestSeller: async (productId) => {
    const response = await api.patch(`/admin/products/${productId}/bestseller`);
    return response.data;
  },
};

/**
 * Phase 7 — Admin Customer API
 */
export const adminCustomerAPI = {
  getCustomers: async (params = {}) => {
    const response = await api.get('/admin/customers', { params });
    return response.data;
  },
  getCustomerById: async (id) => {
    const response = await api.get(`/admin/customers/${id}`);
    return response.data;
  },
  updateCustomerStatus: async (id, status) => {
    const response = await api.patch(`/admin/customers/${id}/status`, { status });
    return response.data;
  },
};

/**
 * Phase 7 — Admin Payment API
 */
export const adminPaymentAPI = {
  getPayments: async (params = {}) => {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },
};

/**
 * Phase 7 — Admin Users API (Superadmin only)
 */
export const adminUsersAPI = {
  getAdminUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  createAdmin: async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },
  updateAdmin: async (id, data) => {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data;
  },
  deactivateAdmin: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
};

export const auditLogAPI = {
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },
};

/**
 * Phase 8 — Review API (Customer)
 */
export const reviewAPI = {
  getProductReviews: async (productId, params = {}) => {
    const response = await api.get(`/products/${productId}/reviews`, { params });
    return response.data;
  },
  getProductReviewSummary: async (productId) => {
    const response = await api.get(`/products/${productId}/reviews/summary`);
    return response.data;
  },
  checkEligibility: async (productId) => {
    const response = await api.get(`/products/${productId}/reviews/eligibility`);
    return response.data;
  },
  createReview: async (productId, data) => {
    const isFormData = data instanceof FormData;
    const response = await api.post(`/products/${productId}/reviews`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },
  getMyReviews: async (params = {}) => {
    const response = await api.get('/reviews/my', { params });
    return response.data;
  },
  updateReview: async (id, data) => {
    const isFormData = data instanceof FormData;
    const response = await api.put(`/reviews/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },
  deleteReview: async (id) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },
  toggleHelpfulVote: async (reviewId) => {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  },
  reportReview: async (reviewId, reportData) => {
    const response = await api.post(`/reviews/${reviewId}/report`, reportData);
    return response.data;
  },
};

/**
 * Phase 11 — Product Question & Answer API
 */
export const questionAPI = {
  getProductQuestions: async (productId, params = {}) => {
    const response = await api.get(`/products/${productId}/questions`, { params });
    return response.data;
  },
  createQuestion: async (productId, questionText) => {
    const response = await api.post(`/products/${productId}/questions`, { question: questionText });
    return response.data;
  },
  createAnswer: async (productId, questionId, answerText) => {
    const response = await api.post(`/products/${productId}/questions/${questionId}/answers`, { answer: answerText });
    return response.data;
  },
};

/**
 * Phase 8/11 — Admin Review API
 */
export const adminReviewAPI = {
  getAdminReviews: async (params = {}) => {
    const response = await api.get('/admin/reviews', { params });
    return response.data;
  },
  moderateReview: async (id, status, note = '') => {
    const response = await api.patch(`/admin/reviews/${id}/moderate`, { status, note });
    return response.data;
  },
  toggleFeatureReview: async (id) => {
    const response = await api.patch(`/admin/reviews/${id}/feature`);
    return response.data;
  },
  adminRespondReview: async (id, comment) => {
    const response = await api.post(`/admin/reviews/${id}/respond`, { comment });
    return response.data;
  },
  getReviewReports: async (params = {}) => {
    const response = await api.get('/admin/reviews/reports', { params });
    return response.data;
  },
  moderateReviewReport: async (reportId, action) => {
    const response = await api.patch(`/admin/reviews/reports/${reportId}`, { action });
    return response.data;
  },
  deleteReview: async (id) => {
    const response = await api.delete(`/admin/reviews/${id}`);
    return response.data;
  },
};

/**
 * Phase 11 — Admin Question & Answer API
 */
export const adminQuestionAPI = {
  getAdminQuestions: async (params = {}) => {
    const response = await api.get('/admin/questions', { params });
    return response.data;
  },
  answerQuestion: async (questionId, answer) => {
    const response = await api.post(`/admin/questions/${questionId}/answers`, { answer });
    return response.data;
  },
  moderateQuestionStatus: async (questionId, status) => {
    const response = await api.patch(`/admin/questions/${questionId}/status`, { status });
    return response.data;
  },
  deleteQuestion: async (questionId) => {
    const response = await api.delete(`/admin/questions/${questionId}`);
    return response.data;
  },
};

/**
 * Phase 8 — Admin Coupon API
 */
export const adminCouponAPI = {
  getCoupons: async (params = {}) => {
    const response = await api.get('/admin/coupons', { params });
    return response.data;
  },
  createCoupon: async (data) => {
    const response = await api.post('/admin/coupons', data);
    return response.data;
  },
  getCouponById: async (id) => {
    const response = await api.get(`/admin/coupons/${id}`);
    return response.data;
  },
  updateCoupon: async (id, data) => {
    const response = await api.put(`/admin/coupons/${id}`, data);
    return response.data;
  },
  toggleCoupon: async (id) => {
    const response = await api.patch(`/admin/coupons/${id}/toggle`);
    return response.data;
  },
  deleteCoupon: async (id) => {
    const response = await api.delete(`/admin/coupons/${id}`);
    return response.data;
  },
  getCouponUsage: async (id, params = {}) => {
    const response = await api.get(`/admin/coupons/${id}/usage`, { params });
    return response.data;
  },
};

/**
 * Phase 8 — Admin Variant API
 */
export const adminVariantAPI = {
  addVariant: async (productId, data) => {
    const response = await api.post(`/admin/products/${productId}/variants`, data);
    return response.data;
  },
  updateVariant: async (productId, variantId, data) => {
    const response = await api.put(`/admin/products/${productId}/variants/${variantId}`, data);
    return response.data;
  },
  deleteVariant: async (productId, variantId) => {
    const response = await api.delete(`/admin/products/${productId}/variants/${variantId}`);
    return response.data;
  },
};

/**
 * Phase 9 — Notification & Communication API
 */
export const notificationAPI = {
  getUserPreferences: async () => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },
  updateUserPreferences: async (preferences) => {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  },
  getMyNotifications: async (params = {}) => {
    const response = await api.get('/notifications/my', { params });
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
  getAdminNotifications: async (params = {}) => {
    const response = await api.get('/admin/notifications', { params });
    return response.data;
  },
  getAdminEmailSettings: async () => {
    const response = await api.get('/admin/notifications/settings');
    return response.data;
  },
  sendTestEmail: async (recipient) => {
    const response = await api.post('/admin/notifications/test-email', { recipient });
    return response.data;
  },
  retryNotification: async (id) => {
    const response = await api.post(`/admin/notifications/retry/${id}`);
    return response.data;
  },
};

export default api;


