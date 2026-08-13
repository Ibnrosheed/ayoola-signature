import React, { useEffect, useState } from 'react';
import { notificationAPI } from '../services/api';
import { Bell, Check, CheckCheck, RefreshCw, AlertCircle, ShieldAlert, Sliders, Mail, ShoppingBag } from 'lucide-react';

export const AccountNotifications = () => {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'preferences'

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [errorNotifications, setErrorNotifications] = useState('');

  // Preferences State
  const [preferences, setPreferences] = useState({
    orderUpdates: true,
    promotionalEmails: true,
    recommendations: true,
    newsletter: false,
  });
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState('');
  const [prefError, setPrefError] = useState('');

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await notificationAPI.getMyNotifications();
      if (res.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      setErrorNotifications(err.message || 'Failed to load notifications');
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch Preferences
  const fetchPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const res = await notificationAPI.getUserPreferences();
      if (res.success) {
        setPreferences(res.data.preferences);
      }
    } catch (err) {
      setPrefError(err.message || 'Failed to load notification preferences');
    } finally {
      setLoadingPreferences(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  };

  const handleTogglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSavingPreferences(true);
      setPrefSuccess('');
      setPrefError('');
      const res = await notificationAPI.updateUserPreferences(preferences);
      if (res.success) {
        setPrefSuccess('Notification preferences updated successfully!');
        setPreferences(res.data.preferences);
      }
    } catch (err) {
      setPrefError(err.message || 'Failed to update preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Bell className="w-6 h-6 mr-2.5 text-amber-600" />
            Notifications & Communication
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your in-app alerts and email notification preferences.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Notification History
            {unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-600 text-white rounded-full font-extrabold text-[10px]">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center ${
              activeTab === 'preferences'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5" />
            Preferences
          </button>
        </div>
      </div>

      {/* Tab Content: Notification History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Your Recent Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center hover:underline"
              >
                <CheckCheck className="w-4 h-4 mr-1" /> Mark All as Read
              </button>
            )}
          </div>

          {loadingNotifications ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-600" />
              Loading your notifications...
            </div>
          ) : errorNotifications ? (
            <div className="p-6 text-center text-rose-600 text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              {errorNotifications}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600 mb-1">No Notifications Yet</p>
              <p className="text-xs text-slate-400">Updates about your orders and account will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                    n.isRead ? 'bg-white' : 'bg-amber-50/40'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className={`p-2 rounded-xl mt-0.5 ${n.isRead ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-800'}`}>
                      {n.type?.includes('order') ? <ShoppingBag className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-sm font-semibold ${n.isRead ? 'text-slate-800' : 'text-slate-900'}`}>
                          {n.subject}
                        </h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.body}</p>
                      <p className="text-[11px] text-slate-400 mt-2">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      title="Mark as read"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Preferences */}
      {activeTab === 'preferences' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Email & Notification Preferences</h2>
          <p className="text-xs text-slate-500 mb-6">
            Choose which marketing and operational updates you would like to receive.
          </p>

          {prefSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center">
              <Check className="w-4 h-4 mr-2" />
              <span>{prefSuccess}</span>
            </div>
          )}

          {prefError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>{prefError}</span>
            </div>
          )}

          {loadingPreferences ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
              Loading preferences...
            </div>
          ) : (
            <form onSubmit={handleSavePreferences} className="space-y-6">
              <div className="space-y-4">
                {/* Order Updates */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Order & Shipping Updates</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Receive emails when your order status changes (processing, shipped, delivered).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.orderUpdates}
                    onChange={() => handleTogglePreference('orderUpdates')}
                    className="w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                {/* Promotional Emails */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Promotions & Discount Codes</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Be the first to hear about seasonal sales, exclusive luxury discount codes, and special offers.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.promotionalEmails}
                    onChange={() => handleTogglePreference('promotionalEmails')}
                    className="w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                {/* Recommendations */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Product Recommendations</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Receive personalized recommendations based on your wishlist and browsing history.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.recommendations}
                    onChange={() => handleTogglePreference('recommendations')}
                    className="w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                {/* Newsletter */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Ayoola Signature Newsletter</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Monthly luxury style guides, brand stories, and upcoming collection drops.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.newsletter}
                    onChange={() => handleTogglePreference('newsletter')}
                    className="w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Transactional Note */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start">
                <ShieldAlert className="w-4 h-4 mr-2.5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Important Note: </span>
                  Transactional emails (such as order confirmations, payment receipts, email verification, and password reset requests) are mandatory security & business functions and cannot be turned off.
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingPreferences}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center disabled:opacity-50"
                >
                  {savingPreferences && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Save Preferences
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
