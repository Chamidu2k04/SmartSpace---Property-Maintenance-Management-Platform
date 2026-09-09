import React, { useEffect, useState } from 'react';
import { AlertCircle, Building2, Check, Plus, Trash2, X } from 'lucide-react';

const emptyUnit = () => ({ unitNumber: '', floor: '0' });

export default function PropertyModal({ isOpen, onClose, onSubmit, isSaving }) {
  const [form, setForm] = useState({ name: '', address: '', city: '', initialUnits: [emptyUnit()] });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', address: '', city: '', initialUnits: [emptyUnit()] });
      setErrors({});
      setServerError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateUnit = (index, field, value) => {
    setForm((current) => ({
      ...current,
      initialUnits: current.initialUnits.map((unit, unitIndex) =>
        unitIndex === index ? { ...unit, [field]: value } : unit),
    }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Property name is required.';
    if (!form.address.trim()) next.address = 'Address is required.';
    if (!form.city.trim()) next.city = 'City is required.';
    form.initialUnits.forEach((unit, index) => {
      if (!unit.unitNumber.trim()) next[`unit-${index}`] = 'Unit number is required.';
      if (Number(unit.floor) < 0) next[`floor-${index}`] = 'Floor cannot be negative.';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setServerError('');
    try {
      await onSubmit({
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        initialUnits: form.initialUnits.map((unit) => ({ unitNumber: unit.unitNumber.trim(), floor: Number(unit.floor) })),
      });
      onClose();
    } catch (error) {
      setServerError(error.message || 'Unable to create the property.');
    }
  };

  const inputClass = (invalid) => `w-full px-3.5 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all ${
    invalid
      ? 'border-red-300 bg-red-50/30 focus:ring-red-100'
      : 'border-gray-200 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]/15'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center"><Building2 className="w-5 h-5" /></div>
            <div><h2 className="text-lg font-bold text-gray-900">Add New Property</h2><p className="text-xs text-gray-500 mt-0.5">Register a property and its initial units</p></div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto" noValidate>
          {serverError && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"><AlertCircle className="w-4 h-4 shrink-0" /> {serverError}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Property Name" error={errors.name} className="sm:col-span-2">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass(errors.name)} placeholder="e.g. Lakeview Residences" />
            </Field>
            <Field label="Street Address" error={errors.address}>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass(errors.address)} placeholder="24 Lake Road" />
            </Field>
            <Field label="City" error={errors.city}>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass(errors.city)} placeholder="Colombo" />
            </Field>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div><h3 className="text-sm font-bold text-gray-900">Initial Units</h3><p className="text-xs text-gray-500">Each unit starts with Vacant status</p></div>
              <button type="button" onClick={() => setForm({ ...form, initialUnits: [...form.initialUnits, emptyUnit()] })} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:bg-blue-50 px-3 py-2 rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Unit</button>
            </div>
            <div className="space-y-3">
              {form.initialUnits.map((unit, index) => (
                <div key={index} className="grid grid-cols-[1fr_110px_36px] gap-3 items-start">
                  <Field label={`Unit ${index + 1} Number`} error={errors[`unit-${index}`]}>
                    <input value={unit.unitNumber} onChange={(e) => updateUnit(index, 'unitNumber', e.target.value)} className={inputClass(errors[`unit-${index}`])} placeholder="e.g. A-101" />
                  </Field>
                  <Field label="Floor" error={errors[`floor-${index}`]}>
                    <input type="number" min="0" value={unit.floor} onChange={(e) => updateUnit(index, 'floor', e.target.value)} className={inputClass(errors[`floor-${index}`])} />
                  </Field>
                  <button type="button" aria-label={`Remove unit ${index + 1}`} disabled={form.initialUnits.length === 1} onClick={() => setForm({ ...form, initialUnits: form.initialUnits.filter((_, unitIndex) => unitIndex !== index) })} className="mt-6 p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg shadow-sm disabled:opacity-50"><Check className="w-4 h-4 text-emerald-300" /> {isSaving ? 'Creating...' : 'Create Property'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, className = '', children }) {
  return <div className={className}><label className="block text-xs font-semibold text-gray-700 mb-1.5">{label} <span className="text-red-500">*</span></label>{children}{error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}</div>;
}
