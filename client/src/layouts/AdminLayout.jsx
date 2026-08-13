import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Boxes,
  CreditCard,
  ShieldCheck,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Star,
  MessageSquare,
  Tag,
  Bell,
  HelpCircle,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Layers },
  { name: 'Inventory', href: '/admin/inventory', icon: Boxes },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { name: 'Q&A', href: '/admin/questions', icon: HelpCircle },
  { name: 'Coupons', href: '/admin/coupons', icon: Tag },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
];

const superAdminItems = [
  { name: 'Admin Users', href: '/admin/users', icon: ShieldCheck },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
];

export const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperadmin = user?.role === 'superadmin';

  const isActive = (href, exact = false) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavLink = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.href, item.exact);
    return (
      <Link
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-300' : ''}`} />
        <span>{item.name}</span>
        {active && <ChevronRight className="w-3 h-3 ml-auto text-amber-400" />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/10">
        <Link to="/admin" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-slate-900 fill-slate-900" />
          </div>
          <div>
            <p className="font-serif text-sm font-bold text-white leading-tight">Ayoola Signature</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Admin Portal</p>
          </div>
        </Link>
      </div>

      {/* User Badge */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 bg-amber-400/20 border border-amber-400/30 rounded-full flex items-center justify-center shrink-0">
            <span className="text-amber-300 font-bold text-xs">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-slate-400 text-[10px] capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-2">Management</p>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {isSuperadmin && (
          <>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-2 pt-4">Superadmin</p>
            {superAdminItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* Footer Actions */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
        <Link
          to="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View Storefront</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-900 fixed inset-y-0 left-0 z-30 border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/5 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top Bar (Mobile) */}
        <header className="lg:hidden bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/admin" className="font-serif text-sm font-bold text-white">
            Ayoola Admin
          </Link>
          <div className="w-8 h-8 bg-amber-400/20 border border-amber-400/30 rounded-full flex items-center justify-center">
            <span className="text-amber-300 font-bold text-xs">
              {user?.firstName?.[0]}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
