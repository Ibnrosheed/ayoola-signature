import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryProductsPage } from './pages/CategoryProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentCallbackPage } from './pages/PaymentCallbackPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { PaymentFailedPage } from './pages/PaymentFailedPage';

// Customer Dashboard Components
import { CustomerLayout } from './layouts/CustomerLayout';
import { CustomerDashboardOverview } from './pages/CustomerDashboardOverview';
import { CustomerOrdersPage } from './pages/CustomerOrdersPage';
import { CustomerOrderDetailPage } from './pages/CustomerOrderDetailPage';
import { CustomerAddressesPage } from './pages/CustomerAddressesPage';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import { CustomerSecurityPage } from './pages/CustomerSecurityPage';
import { CustomerReviewsPage } from './pages/CustomerReviewsPage';

// Phase 7 Admin Pages
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/AdminOrderDetailPage';
import { AdminInventoryPage } from './pages/AdminInventoryPage';
import { AdminInventoryHistoryPage } from './pages/AdminInventoryHistoryPage';
import { AdminCustomersPage } from './pages/AdminCustomersPage';
import { AdminCustomerDetailPage } from './pages/AdminCustomerDetailPage';
import { AdminPaymentsPage } from './pages/AdminPaymentsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';

// Existing Admin Pages (Phase 3)
import { AdminCategoriesPage } from './pages/AdminCategoriesPage';
import { AdminAddCategoryPage } from './pages/AdminAddCategoryPage';
import { AdminEditCategoryPage } from './pages/AdminEditCategoryPage';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { AdminAddProductPage } from './pages/AdminAddProductPage';
import { AdminEditProductPage } from './pages/AdminEditProductPage';

// Phase 8 Admin Pages
import { AdminReviewsPage } from './pages/AdminReviewsPage';
import { AdminCouponsPage } from './pages/AdminCouponsPage';

// Phase 9 Pages
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { AccountNotifications } from './pages/AccountNotifications';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminQuestionsPage } from './pages/admin/AdminQuestionsPage';


// Helper: wrap page in AdminRoute + AdminLayout
const AdminPage = ({ children }) => (
  <AdminRoute>
    <AdminLayout>
      {children}
    </AdminLayout>
  </AdminRoute>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
              {/* ── Storefront routes (inside MainLayout) ── */}
              <Route
                path="/*"
                element={
                  <MainLayout>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/category/:slug" element={<CategoryProductsPage />} />
                      <Route path="/product/:slug" element={<ProductDetailPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password/:token" element={<ResetPassword />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/payment/callback" element={<PaymentCallbackPage />} />
                      <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
                      <Route path="/payment/failed" element={<PaymentFailedPage />} />

                      {/* Protected Customer Routes */}
                      <Route path="/account" element={
                        <ProtectedRoute><CustomerLayout><CustomerDashboardOverview /></CustomerLayout></ProtectedRoute>
                      } />
                      <Route path="/account/orders" element={
                        <ProtectedRoute><CustomerLayout><CustomerOrdersPage /></CustomerLayout></ProtectedRoute>
                      } />
                      <Route path="/account/orders/:id" element={
                        <ProtectedRoute><CustomerLayout><CustomerOrderDetailPage /></CustomerLayout></ProtectedRoute>
                      } />
                      <Route path="/account/notifications" element={
                        <ProtectedRoute><CustomerLayout><AccountNotifications /></CustomerLayout></ProtectedRoute>
                      } />
                      <Route path="/account/addresses" element={
                        <ProtectedRoute><CustomerLayout><CustomerAddressesPage /></CustomerLayout></ProtectedRoute>
                      } />
                      <Route path="/account/profile" element={
                        <ProtectedRoute><CustomerLayout><CustomerProfilePage /></CustomerLayout></ProtectedRoute>
                      } />
                      <Route path="/account/security" element={
                        <ProtectedRoute><CustomerLayout><CustomerSecurityPage /></CustomerLayout></ProtectedRoute>
                      } />
                      <Route path="/account/reviews" element={
                        <ProtectedRoute><CustomerLayout><CustomerReviewsPage /></CustomerLayout></ProtectedRoute>
                      } />
                    </Routes>
                  </MainLayout>
                }
              />

              {/* ── Admin Portal routes (inside AdminLayout, NO MainLayout) ── */}
              <Route path="/admin" element={<AdminPage><AdminDashboardPage /></AdminPage>} />
              <Route path="/admin/orders" element={<AdminPage><AdminOrdersPage /></AdminPage>} />
              <Route path="/admin/orders/:id" element={<AdminPage><AdminOrderDetailPage /></AdminPage>} />
              <Route path="/admin/products" element={<AdminPage><AdminProductsPage /></AdminPage>} />
              <Route path="/admin/products/new" element={<AdminPage><AdminAddProductPage /></AdminPage>} />
              <Route path="/admin/products/:id/edit" element={<AdminPage><AdminEditProductPage /></AdminPage>} />
              <Route path="/admin/categories" element={<AdminPage><AdminCategoriesPage /></AdminPage>} />
              <Route path="/admin/categories/new" element={<AdminPage><AdminAddCategoryPage /></AdminPage>} />
              <Route path="/admin/categories/:id/edit" element={<AdminPage><AdminEditCategoryPage /></AdminPage>} />
              <Route path="/admin/inventory" element={<AdminPage><AdminInventoryPage /></AdminPage>} />
              <Route path="/admin/inventory/:productId/history" element={<AdminPage><AdminInventoryHistoryPage /></AdminPage>} />
              <Route path="/admin/customers" element={<AdminPage><AdminCustomersPage /></AdminPage>} />
              <Route path="/admin/customers/:id" element={<AdminPage><AdminCustomerDetailPage /></AdminPage>} />
              <Route path="/admin/payments" element={<AdminPage><AdminPaymentsPage /></AdminPage>} />
              <Route path="/admin/users" element={<AdminPage><AdminUsersPage /></AdminPage>} />
              <Route path="/admin/audit-logs" element={<AdminPage><AdminAuditLogsPage /></AdminPage>} />
              <Route path="/admin/reviews" element={<AdminPage><AdminReviewsPage /></AdminPage>} />
              <Route path="/admin/questions" element={<AdminPage><AdminQuestionsPage /></AdminPage>} />
              <Route path="/admin/coupons" element={<AdminPage><AdminCouponsPage /></AdminPage>} />
              <Route path="/admin/notifications" element={<AdminPage><AdminNotifications /></AdminPage>} />

            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
