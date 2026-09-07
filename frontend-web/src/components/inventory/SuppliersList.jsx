import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Search, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import AccessDenied from './AccessDenied';

export default function SuppliersList() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Supplier Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', contactEmail: '', phone: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formServerError, setFormServerError] = useState(null);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsAccessDenied(false);
      const data = await inventoryService.getSuppliers();
      setSuppliers(data || []);
    } catch (err) {
      if (err.status === 403 || err.message?.includes('403') || err.message?.includes('Access Denied')) {
        setIsAccessDenied(true);
      }
      setError(err.message || 'Failed to load suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contactEmail: '', phone: '' });
    setFormErrors({});
    setFormServerError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contactEmail: supplier.contactEmail || '',
      phone: supplier.phone || '',
    });
    setFormErrors({});
    setFormServerError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) return;

    try {
      await inventoryService.deleteSupplier(supplier.id);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
    } catch (err) {
      alert(err.message || 'Failed to delete supplier');
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Supplier name is required.';
    if (!formData.contactEmail.trim()) {
      errs.contactEmail = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.contactEmail)) {
      errs.contactEmail = 'Invalid email address format.';
    }

    const cleanPhone = (formData.phone || '').trim();
    if (!cleanPhone) {
      errs.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(cleanPhone)) {
      errs.phone = 'Phone number must be exactly 10 digits (e.g. 0771234567).';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setFormSubmitting(true);
    setFormServerError(null);

    const payload = {
      name: formData.name.trim(),
      contactEmail: formData.contactEmail.trim().toLowerCase(),
      phone: formData.phone.trim(),
    };

    try {
      if (editingSupplier) {
        const updated = await inventoryService.updateSupplier(editingSupplier.id, payload);
        setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await inventoryService.createSupplier(payload);
        setSuppliers((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormServerError(err.message || 'Error saving supplier details.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.contactEmail && s.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.phone && s.phone.includes(searchTerm))
  );

  if (isAccessDenied) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Supplier Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Maintain authorized vendor contacts for spare parts procurement.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-medium text-sm rounded-xl shadow-sm transition-all focus:outline-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Supplier</span>
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search suppliers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#F3F4F6] border border-transparent rounded-lg focus:bg-white focus:border-[#1E3A8A] focus:outline-none transition-all"
          />
        </div>

        <button
          onClick={loadSuppliers}
          title="Refresh"
          className="p-2 text-gray-500 hover:text-gray-800 bg-[#F3F4F6] hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-white rounded-xl shadow-sm">Loading suppliers...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 bg-white rounded-xl shadow-sm">
          <p className="font-semibold">{error}</p>
          <button onClick={loadSuppliers} className="mt-3 px-4 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 cursor-pointer">
            Retry
          </button>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-white rounded-xl shadow-sm">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-base font-medium text-gray-600">No suppliers found</p>
          <p className="text-xs text-gray-400 mt-1">Register a new vendor to link with inventory spare parts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base leading-tight">
                        {supplier.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#10B981] font-medium mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                        Verified Partner
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(supplier)}
                      title="Edit Supplier"
                      className="p-1 text-gray-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier)}
                      title="Delete Supplier"
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <a
                      href={`mailto:${supplier.contactEmail}`}
                      className="hover:text-[#1E3A8A] truncate"
                    >
                      {supplier.contactEmail}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{supplier.phone || 'No phone provided'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Supplier ID</span>
                <span className="font-mono text-[10px] text-gray-500">{supplier.id.slice(0, 8)}...</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register/Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
                </h3>
                <p className="text-xs text-gray-500">Contact specifications for procurement</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formServerError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formServerError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Industrial Supplies Ltd."
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                    formErrors.name ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-[#1E3A8A]'
                  } focus:outline-none`}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="orders@apexsupplies.com"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                    formErrors.contactEmail ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-[#1E3A8A]'
                  } focus:outline-none`}
                />
                {formErrors.contactEmail && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.contactEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Phone Number (10 Digits) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => {
                    const numericVal = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, phone: numericVal });
                    if (formErrors.phone) {
                      setFormErrors((prev) => ({ ...prev, phone: null }));
                    }
                  }}
                  placeholder="0771234567"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                    formErrors.phone ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-[#1E3A8A]'
                  } focus:outline-none transition-colors`}
                />
                {formErrors.phone && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.phone}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">Sri Lankan format: exactly 10 digits (e.g. 0771234567, 0112345678)</p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-[#F3F4F6] hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#10B981]" />
                  <span>{editingSupplier ? 'Save Changes' : 'Register'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
