import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register(formData);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl font-bold text-slate-900">Join Ayoola Signature</h1>
        <p className="text-sm text-slate-500">Create an account for personalized luxury shopping</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-semibold">First Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-semibold">Last Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-semibold">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="client@ayoolasignature.com"
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-semibold">Phone Number</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="08012345678"
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-semibold">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-semibold">Confirm Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-amber-300 font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Client Account</span>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Already have an account?{' '}
        <Link to="/login" className="text-amber-700 font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};
