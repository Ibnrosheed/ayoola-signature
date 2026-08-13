import React, { useEffect, useState } from 'react';
import { notificationAPI } from '../../services/api';
import {
  Bell,
  Mail,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sliders,
  ShieldCheck,
  RotateCcw,
  Filter,
} from 'lucide-react';

export const AdminNotifications = () => {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'settings'

  // Feed State
  const [notifications, setNotifications] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [errorFeed, setErrorFeed] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [retryingId, setRetryingId] = useState(null);

  // Settings State
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [testRecipient, setTestRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testError, setTestError] = useState('');

  const fetchFeed = async () => {
    try {
      setLoadingFeed(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await notificationAPI.getAdminNotifications(params);
      if (res.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      setErrorFeed(err.message || 'Failed to load notifications feed');
    } finally {
      setLoadingFeed(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await notificationAPI.getAdminEmailSettings();
      if (res.success) {
        setSettings(res.data);
        if (res.data.adminNotificationEmail) {
          setTestRecipient(res.data.adminNotificationEmail);
        }
      }
    } catch (err) {
      console.error('Failed to load email settings:', err.message);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchSettings();
  }, [statusFilter]);

  const handleRetry = async (id) => {
    try {
      setRetryingId(id);
      const res = await notificationAPI.retryNotification(id);
      if (res.success) {
        fetchFeed();
      }
    } catch (err) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testRecipient) return;

    try {
      setSendingTest(true);
      setTestResult('');
      setTestError('');
      const res = await notificationAPI.sendTestEmail(testRecipient.trim());
      if (res.success) {
        setTestResult(res.message || 'Test email dispatched successfully.');
      } else {
        setTestError(res.message || 'Failed to send test email.');
      }
    } catch (err) {
      setTestError(err.message || 'Test email sending failed.');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Bell className="w-6 h-6 mr-2.5 text-amber-600" />
            Communication & Notification Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor system emails, low stock warnings, order notifications, and email transport health.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center ${
              activeTab === 'feed'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Operational Log
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5" />
            Email Settings & Testing
          </button>
        </div>
      </div>

      {/* Tab 1: Operational Notification Feed */}
      {activeTab === 'feed' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Statuses</option>
                <option value="sent">Sent / Simulated</option>
                <option value="failed">Failed Delivery</option>
                <option value="pending">Pending Queue</option>
              </select>
            </div>

            <button
              onClick={fetchFeed}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center font-medium bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Log
            </button>
          </div>

          {loadingFeed ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-600" />
              Loading operational notification logs...
            </div>
          ) : errorFeed ? (
            <div className="p-6 text-center text-rose-600 text-sm">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              {errorFeed}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600 mb-1">No Notification Logs Found</p>
              <p className="text-xs text-slate-400">System email attempts and alerts will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[11px] font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-6">Type & Subject</th>
                    <th className="p-3.5">Recipient</th>
                    <th className="p-3.5">Channel / Status</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <tr key={n._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-6">
                        <div className="font-bold text-slate-900 text-sm">{n.subject}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Type: {n.type} {n.relatedOrder ? `• Order: ${n.relatedOrder.orderNumber}` : ''}
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">{n.recipientEmail}</td>
                      <td className="p-3.5">
                        {n.status === 'sent' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                            {n.metadata?.simulated ? 'Simulated (Dev)' : 'Delivered'}
                          </span>
                        ) : n.status === 'failed' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800" title={n.errorMessage || ''}>
                            <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 pr-6 text-right">
                        {n.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(n._id)}
                            disabled={retryingId === n._id}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                          >
                            {retryingId === n._id ? (
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3 mr-1" />
                            )}
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Settings & Testing */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Overview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mr-2" />
              Email Service Configuration
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Safe runtime overview of configured SMTP transports and notification settings.
            </p>

            {loadingSettings ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                Loading service settings...
              </div>
            ) : settings ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Mode:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${settings.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {settings.mode}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">SMTP Host:</span>
                  <span className="font-mono text-slate-900">{settings.host}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">SMTP Port / SSL:</span>
                  <span className="font-mono text-slate-900">{settings.port} ({settings.secure ? 'SSL' : 'STARTTLS'})</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Sender Address:</span>
                  <span className="font-mono text-slate-900">{settings.fromName} &lt;{settings.fromEmail}&gt;</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Admin Alert Recipient:</span>
                  <span className="font-mono text-slate-900">{settings.adminNotificationEmail}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Frontend Client URL:</span>
                  <span className="font-mono text-slate-900">{settings.clientUrl}</span>
                </div>

                <div className="p-3 bg-amber-50 text-amber-800 text-[11px] rounded-lg border border-amber-200">
                  🔒 SMTP passwords and private secrets are omitted for security compliance.
                </div>
              </div>
            ) : null}
          </div>

          {/* Superadmin Test Email Tool */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center">
              <Send className="w-5 h-5 text-amber-600 mr-2" />
              Send Test Email
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Dispatch a test email notification to verify transport delivery. (Superadmin access required)
            </p>

            {testResult && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
                <span>{testResult}</span>
              </div>
            )}

            {testError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center">
                <XCircle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
                <span>{testError}</span>
              </div>
            )}

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Recipient Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sendingTest || !testRecipient}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {sendingTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Dispatching Test Email...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Send Test Email
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
