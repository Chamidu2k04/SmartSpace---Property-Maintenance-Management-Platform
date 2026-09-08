import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Wrench, AlertCircle } from 'lucide-react';
import { TRADE_SPECIALTIES, TRADE_SPECIALTY_MAP } from '../../services/technicianService';

export default function TechnicianModal({ isOpen, onClose, onSubmit, initialData = null, isLoading = false }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    tradeSpecialty: 'Handyman',
    hourlyRate: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      const rawSpecialty = initialData.tradeSpecialty;
      const mappedSpecialty = TRADE_SPECIALTY_MAP[rawSpecialty] || 'Handyman';

      setFormData({
        fullName: initialData.fullName || initialData.name || '',
        email: initialData.email || '',
        password: '', // Leave blank unless updating
        tradeSpecialty: mappedSpecialty,
        hourlyRate: initialData.hourlyRate !== undefined ? String(initialData.hourlyRate) : '',
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        password: '',
        tradeSpecialty: 'Handyman',
        hourlyRate: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!initialData && !formData.password) {
      newErrors.password = 'Account password is required.';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.hourlyRate) {
      newErrors.hourlyRate = 'Hourly rate is required.';
    } else {
      const rate = parseFloat(formData.hourlyRate);
      if (isNaN(rate) || rate <= 0) {
        newErrors.hourlyRate = 'Hourly rate must be a positive decimal number (Rs. XX.00/hr).';
      }
    }

    if (!formData.tradeSpecialty) {
      newErrors.tradeSpecialty = 'Trade specialty is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const isEditing = Boolean(initialData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEditing ? 'Edit Technician Profile' : 'Add New Technician'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEditing
                ? 'Update technician user account and specialty details'
                : 'Register a technician user account and configure profile details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* SECTION 1: User Account Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <User className="w-4 h-4 text-[#1E3A8A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Section 1: User Account Data
              </h3>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Marcus Vance"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.fullName
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                  }`}
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              {errors.fullName && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.fullName}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="technician@smartspace.edu"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                  }`}
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Account Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {isEditing ? (
                  'New Password (Optional)'
                ) : (
                  <>
                    Account Password <span className="text-red-500">*</span>
                  </>
                )}
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEditing ? 'Leave empty to keep current password' : 'Enter account password'}
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                  }`}
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* SECTION 2: Profile Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <Wrench className="w-4 h-4 text-[#1E3A8A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Section 2: Technician Profile Data
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Trade Specialty */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Trade Specialty <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="tradeSpecialty"
                    value={formData.tradeSpecialty}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white ${
                      errors.tradeSpecialty
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                    }`}
                  >
                    {TRADE_SPECIALTIES.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                  <Wrench className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.tradeSpecialty && (
                  <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.tradeSpecialty}
                  </p>
                )}
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Hourly Rate (Rs./hr) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    placeholder="65.00"
                    className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.hourlyRate
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                    }`}
                  />
                  <span className="text-xs font-bold text-gray-400 absolute left-3 top-2.5">Rs.</span>
                </div>
                {errors.hourlyRate && (
                  <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.hourlyRate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Update Technician' : 'Add Technician'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
