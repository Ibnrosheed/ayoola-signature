import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Package, MapPin, Loader2, AlertCircle, CheckCircle, Lock, ShoppingBag, Heart } from 'lucide-react';

export const AccountPage = () => {
  const { user, logout, updateProfile } = useAuth();
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password' | 'orders'

  const handleProfileChange = (e) => {
    setProfileData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (profileError) setProfileError(null);
    if (profileSuccess) setProfileSuccess(null);
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (passwordError) setPasswordError(null);
    if (passwordSuccess) setPasswordSuccess(null);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const data = await updateProfile(profileData);
      if (data.success) {
        setProfileSuccess('Profile updated successfully.');
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const data = await authAPI.changePassword(passwordData);
      if (data.success) {
        setPasswordSuccess('Password changed successfully.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-sm text-slate-500">Manage your profile, shopping bag, wishlist, and account settings</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            {user?.role}
          </span>
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            {user?.status}
          </span>
          <button
            onClick={logout}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold px-4 py-1.5 rounded-lg shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Account Portals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/cart"
          className="bg-white border border-slate-200 hover:border-amber-400 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">My Shopping Bag</h3>
              <p className="text-xs text-slate-500">View and update items in your cart</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">View →</span>
        </Link>

        <Link
          to="/wishlist"
          className="bg-white border border-slate-200 hover:border-amber-400 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">My Wishlist</h3>
              <p className="text-xs text-slate-500">Saved creations and favorites</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">View →</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 font-semibold transition-all ${
            activeTab === 'profile'
              ? 'text-amber-700 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`pb-3 font-semibold transition-all ${
            activeTab === 'password'
              ? 'text-amber-700 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Security & Password
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 font-semibold transition-all ${
            activeTab === 'orders'
              ? 'text-amber-700 border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Orders
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-700" />
              <span>Personal Details</span>
            </h2>

            {profileError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-semibold">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-semibold">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-semibold">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-amber-300 font-bold px-6 py-2.5 rounded-xl shadow-sm text-sm transition-all flex items-center gap-2"
              >
                {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Save Profile Changes</span>
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-700" />
              <span>Update Password</span>
            </h2>

            {passwordError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-semibold">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-semibold">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-amber-300 font-bold px-6 py-2.5 rounded-xl shadow-sm text-sm transition-all flex items-center gap-2"
              >
                {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Change Password</span>
              </button>
            </form>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 text-center py-8">
            <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-700">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-slate-900">No Orders Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                You haven't placed any luxury orders on our platform. The shopping and checkout catalog will launch in a later phase.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AccountPage;
