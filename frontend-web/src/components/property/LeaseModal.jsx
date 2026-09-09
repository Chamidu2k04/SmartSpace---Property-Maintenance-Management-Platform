import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, FileSignature, X } from 'lucide-react';

const EMPTY_FORM = { unitId: '', tenantId: '', startDate: '', endDate: '', monthlyRent: '' };

export default function LeaseModal({ isOpen, onClose, onSubmit, units, tenants, isSaving, lease = null }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(lease ? {
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        startDate: lease.startDate.slice(0, 10),
        endDate: lease.endDate.slice(0, 10),
        monthlyRent: String(lease.monthlyRent),
      } : EMPTY_FORM);
      setErrors({});
      setServerError('');
    }
  }, [isOpen, lease]);

  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => `${a.propertyName} ${a.unitNumber}`.localeCompare(`${b.propertyName} ${b.unitNumber}`)),
    [units],
  );

  if (!isOpen) return null;

  const validate = () => {
    const next = {};
    if (!form.unitId) next.unitId = 'Select an available unit.';
    if (!form.tenantId) next.tenantId = 'Select a tenant.';
    if (!form.startDate) next.startDate = 'Start date is required.';
    if (!form.endDate) next.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      next.endDate = 'End date must be after the start date.';
    }
    if (!form.monthlyRent || Number(form.monthlyRent) <= 0) {
      next.monthlyRent = 'Enter a monthly rent greater than zero.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setServerError('');
    try {
      await onSubmit({ ...form, monthlyRent: Number(form.monthlyRent) });
      onClose();
    } catch (error) {
      setServerError(error.message || 'Unable to create the lease.');
    }
  };

  const inputClass = (invalid) => `w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 transition-all ${
    invalid
      ? 'border-red-300 bg-red-50/30 focus:ring-red-100'
      : 'border-gray-200 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]/15'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{lease ? 'Edit Lease' : 'Create Lease'}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{lease ? 'Update the lease period and monthly rent' : 'Assign an available unit to an existing tenant'}</p>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          {serverError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {serverError}
            </div>
          )}

          {!lease && <Field label="Available Unit" error={errors.unitId}>
            <select name="unitId" value={form.unitId} onChange={handleChange} className={inputClass(errors.unitId)}>
              <option value="">Choose a vacant unit</option>
              {sortedUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.propertyName} - Unit {unit.unitNumber} (Floor {unit.floor})</option>
              ))}
            </select>
            {!units.length && <p className="text-xs text-amber-600 mt-1">There are no vacant units available.</p>}
          </Field>}

          {!lease && <Field label="Tenant" error={errors.tenantId}>
            <select name="tenantId" value={form.tenantId} onChange={handleChange} className={inputClass(errors.tenantId)}>
              <option value="">Choose a tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.fullName} ({tenant.email})</option>
              ))}
            </select>
            {!tenants.length && <p className="text-xs text-amber-600 mt-1">No tenant accounts are available.</p>}
          </Field>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start Date" error={errors.startDate}>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputClass(errors.startDate)} />
            </Field>
            <Field label="End Date" error={errors.endDate}>
              <input type="date" name="endDate" min={form.startDate || undefined} value={form.endDate} onChange={handleChange} className={inputClass(errors.endDate)} />
            </Field>
          </div>

          <Field label="Monthly Rent (Rs.)" error={errors.monthlyRent}>
            <input type="number" name="monthlyRent" min="0.01" step="0.01" value={form.monthlyRent} onChange={handleChange} className={inputClass(errors.monthlyRent)} placeholder="e.g. 75000.00" />
          </Field>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSaving || (!lease && (!units.length || !tenants.length))} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg shadow-sm disabled:opacity-50">
              <Check className="w-4 h-4 text-emerald-300" /> {isSaving ? 'Saving...' : lease ? 'Save Changes' : 'Create Lease'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label} <span className="text-red-500">*</span></label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
    </div>
  );
}
