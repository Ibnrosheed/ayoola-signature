import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  ShoppingBag,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Bell,
} from 'lucide-react';

export const CustomerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard Overview', href: '/account', icon: LayoutDashboard },
    { name: 'My Orders', href: '/account/orders', icon: Package },
    { name: 'Notifications', href: '/account/notifications', icon: Bell },
    { name: 'Delivery Addresses', href: '/account/addresses', icon: MapPin },
    { name: 'My Reviews', href: '/account/reviews', icon: MessageSquare },
    { name: 'Saved Wishlist', href: '/wishlist', icon: Heart },
    { name: 'Shopping Bag', href: '/cart', icon: ShoppingBag },
    { name: 'Profile Information', href: '/account/profile', icon: User },
    { name: 'Security & Password', href: '/account/security', icon: ShieldCheck },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (href) => {
    if (href === '/account') {
      return location.pathname === '/account';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Title & User Greeting */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">My Account</h1>
          <p className="text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-amber-700">{user?.firstName || 'Valued Client'}</span>
          </p>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block lg:col-span-1 space-y-1">
          <nav className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-slate-900 text-amber-300 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all text-left mt-2 border-t border-slate-100 pt-3"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Mobile Dropdown Menu / Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden col-span-1 bg-white border border-slate-200 rounded-3xl p-4 shadow-md space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-slate-900 text-amber-300'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all text-left border-t border-slate-100 mt-2 pt-2"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="lg:col-span-3 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
export default CustomerLayout;
