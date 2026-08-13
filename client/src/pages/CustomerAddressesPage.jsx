import React, { useState, useEffect } from 'react';
import { addressAPI } from '../services/api';
import {
  MapPin,
  Plus,
  Loader2,
  AlertCircle,
  Check,
  Edit2,
  Trash2,
  X,
  Star,
} from 'lucide-react';

export const CustomerAddressesPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    deliveryInstructions: '',
    isDefault: false,
  });

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await addressAPI.getAddresses();
      if (res.success && res.data) {
        setAddresses(res.data.addresses || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load delivery addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setFormData({
      fullName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'Nigeria',
      deliveryInstructions: '',
      isDefault: false,
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddress(addr);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      country: addr.country || 'Nigeria',
      deliveryInstructions: addr.deliveryInstructions || '',
      isDefault: addr.isDefault,
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      if (editingAddress) {
        // Edit Mode
        const res = await addressAPI.updateAddress(editingAddress._id, formData);
        if (res.success) {
          setShowModal(false);
          await fetchAddresses();
        }
      } else {
        // Add Mode
        const res = await addressAPI.createAddress(formData);
        if (res.success) {
          setShowModal(false);
          await fetchAddresses();
        }
      }
    } catch (err) {
      setModalError(err.message || 'Fulfillment request failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await addressAPI.setDefaultAddress(id);
      if (res.success) {
        await fetchAddresses();
      }
    } catch (err) {
      setError(err.message || 'Failed to set default address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery address?')) return;
    try {
      const res = await addressAPI.deleteAddress(id);
      if (res.success) {
        await fetchAddresses();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete address');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-900">Delivery Addresses</h2>
          <p className="text-xs text-slate-500 font-medium">Manage default and secondary shipping addresses</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Address</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium font-serif">Loading saved addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-serif font-bold text-slate-900 text-lg">No Addresses Saved</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            You haven't saved any shipping addresses yet. Add one now to speed up checkout.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="bg-slate-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-xs"
          >
            Add New Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                addr.isDefault
                  ? 'border-amber-500 ring-1 ring-amber-500/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{addr.fullName}</h4>
                  {addr.isDefault && (
                    <span className="bg-amber-550/10 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 bg-amber-50">
                      <Star className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                      <span>Default</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p>{addr.address}</p>
                  <p>{addr.city}, {addr.state}</p>
                  <p>{addr.country}</p>
                  <p className="font-mono pt-1 text-slate-500">Contact: {addr.phone}</p>
                  {addr.deliveryInstructions && (
                    <p className="text-slate-400 italic pt-1 truncate">"{addr.deliveryInstructions}"</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 justify-between items-center text-xs">
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr._id)}
                    className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                  >
                    <span>Set Default</span>
                  </button>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Selected Default</span>
                  </span>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleOpenEditModal(addr)}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    title="Edit address"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr._id)}
                    className="text-rose-600 hover:text-rose-700 flex items-center gap-1"
                    title="Delete address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-serif font-bold text-slate-900 text-lg">
                {editingAddress ? 'Modify Shipping Address' : 'Add Delivery Address'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Recipient Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    required
                    placeholder="Chief Ayoola Johnson"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    required
                    placeholder="+234 801 234 5678"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Street Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  required
                  placeholder="Plot 14 Victoria Island Close, Off Admiralty Way"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    required
                    placeholder="Ikeja"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleFormChange}
                    required
                    placeholder="Lagos"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-500 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Delivery Instructions</label>
                <textarea
                  name="deliveryInstructions"
                  value={formData.deliveryInstructions}
                  onChange={handleFormChange}
                  rows="2"
                  placeholder="Special courier directives (optional)..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleFormChange}
                  className="accent-amber-600 w-4 h-4 rounded-md"
                />
                <label htmlFor="isDefault" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                  Set as my default delivery address
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-amber-300 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingAddress ? 'Save Changes' : 'Save Address'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerAddressesPage;
