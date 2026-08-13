import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Heart, User, Search, ShieldCheck, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';

export const Header = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const { cartItemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop All', path: '/shop' },
    { name: 'Categories', path: '/categories' },
  ];

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user) return '';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-sm">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-amber-200 py-2 px-4 text-center text-xs tracking-wider font-medium">
        ✨ COMPLIMENTARY EXPRESS SHIPPING ON ORDERS OVER ₦250,000 | AYOOLA SIGNATURE LUXURY
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-amber-400/40 flex items-center justify-center text-amber-300 font-serif font-bold text-lg shadow-sm group-hover:scale-105 transition-transform duration-300">
              AS
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-widest text-slate-900">
                AYOOLA
              </span>
              <span className="text-[10px] uppercase tracking-[0.35em] text-amber-700 -mt-1 font-semibold">
                Signature
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-amber-700 font-semibold border-b-2 border-amber-600 pb-1' : 'text-slate-700 hover:text-amber-700'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Icons Navigation */}
          <div className="flex items-center space-x-4 sm:space-x-5">
            <Link 
              to="/shop" 
              className="text-slate-700 hover:text-amber-700 transition-colors p-2 rounded-full hover:bg-slate-100"
              title="Search Products"
            >
              <Search className="w-5 h-5" />
            </Link>

            <Link 
              to="/wishlist" 
              className="text-slate-700 hover:text-rose-600 transition-colors p-2 rounded-full hover:bg-slate-100 relative"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link 
              to="/cart" 
              className="text-slate-700 hover:text-amber-700 transition-colors p-2 rounded-full hover:bg-slate-100 relative"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 bg-amber-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Authenticated User Menu Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 flex items-center justify-center text-xs font-bold border border-amber-400/30 shadow-sm"
                  title="My Account"
                >
                  {getUserInitials()}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-white border border-slate-200 rounded-2xl shadow-lg py-2 z-50 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-950 truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-slate-750 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-455" />
                      <span>Dashboard Overview</span>
                    </Link>

                    <Link
                      to="/account/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-slate-750 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-455" />
                      <span>My Orders</span>
                    </Link>

                    {['admin', 'superadmin'].includes(user.role) && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-slate-750 hover:bg-slate-50 hover:text-slate-900 border-t border-slate-100"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-700" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50 border-t border-slate-100 text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login" 
                className="text-slate-700 hover:text-amber-700 transition-colors p-2 rounded-full hover:bg-slate-100"
                title="Log In"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-800 hover:text-amber-700 p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 space-y-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-800 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg"
              >
                {link.name}
              </NavLink>
            ))}
            <Link
              to="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-800 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between"
            >
              <span>Wishlist</span>
              <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">{wishlistCount}</span>
            </Link>
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-800 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between"
            >
              <span>Shopping Cart</span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">{cartItemCount}</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
export default Header;
