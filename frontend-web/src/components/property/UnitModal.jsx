import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Home, X } from 'lucide-react';

const INPUT_CLASS = 'w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/15 focus:border-[#1E3A8A]';

export default function UnitModal({ isOpen, onClose, onSubmit, properties, unit, isSaving }) {
  const editing = Boolean(unit);
  const [form, setForm] = useState({ propertyId: '', unitNumber: '', floor: '0', status: 'Vacant' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(unit ? { propertyId: unit.propertyId, unitNumber: unit.unitNumber, floor: String(unit.floor), status: unit.status } : { propertyId: properties[0]?.id || '', unitNumber: '', floor: '0', status: 'Vacant' });
      setError('');
    }
  }, [isOpen, unit, properties]);

  if (!isOpen) return null;
  const submit = async (event) => {
    event.preventDefault();
    if (!form.propertyId || !form.unitNumber.trim() || Number(form.floor) < 0) { setError('Choose a property and enter a valid unit number and floor.'); return; }
    try { await onSubmit({ ...form, unitNumber: form.unitNumber.trim(), floor: Number(form.floor) }); onClose(); }
    catch (err) { setError(err.message || 'Unable to save the unit.'); }
  };

  return <ModalShell title={editing ? 'Edit Unit' : 'Add Unit'} subtitle={editing ? 'Update unit details and availability' : 'Register a unit under an existing property'} onClose={onClose}>
    <form onSubmit={submit} className="p-6 space-y-4">
      {error && <ErrorBanner message={error} />}
      <Field label="Property"><select disabled={editing} value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })} className={INPUT_CLASS}><option value="">Choose a property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label="Unit Number"><input value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} className={INPUT_CLASS} placeholder="e.g. A-101" /></Field><Field label="Floor"><input type="number" min="0" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} className={INPUT_CLASS} /></Field></div>
      {editing && <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={INPUT_CLASS}>{['Vacant', 'Occupied', 'Maintenance'].map((status) => <option key={status}>{status}</option>)}</select></Field>}
      <Actions onClose={onClose} saving={isSaving} label={editing ? 'Save Changes' : 'Add Unit'} />
    </form>
  </ModalShell>;
}

export function ModalShell({ title, subtitle, onClose, children }) { return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"><div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-xl overflow-hidden"><div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center"><Home className="w-5 h-5" /></div><div><h2 className="text-lg font-bold text-gray-900">{title}</h2><p className="text-xs text-gray-500 mt-0.5">{subtitle}</p></div></div><button aria-label="Close" onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>{children}</div></div>; }
export function Field({ label, children }) { return <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">{label} <span className="text-red-500">*</span></label>{children}</div>; }
export function ErrorBanner({ message }) { return <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"><AlertCircle className="w-4 h-4 shrink-0" />{message}</div>; }
export function Actions({ onClose, saving, label }) { return <div className="flex justify-end gap-3 pt-4 border-t border-gray-100"><button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] rounded-lg disabled:opacity-50"><Check className="w-4 h-4 text-emerald-300" />{saving ? 'Saving...' : label}</button></div>; }
