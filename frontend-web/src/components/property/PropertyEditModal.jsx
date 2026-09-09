import React, { useEffect, useState } from 'react';
import { Actions, ErrorBanner, Field, ModalShell } from './UnitModal';

const INPUT_CLASS = 'w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/15 focus:border-[#1E3A8A]';

export default function PropertyEditModal({ property, onClose, onSubmit, isSaving }) {
  const [form, setForm] = useState({ name: '', address: '', city: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (property) setForm({ name: property.name, address: property.address, city: property.city });
    setError('');
  }, [property]);

  if (!property) return null;
  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) { setError('Complete all property fields.'); return; }
    try { await onSubmit({ name: form.name.trim(), address: form.address.trim(), city: form.city.trim() }); onClose(); }
    catch (err) { setError(err.message || 'Unable to update the property.'); }
  };

  return <ModalShell title="Edit Property" subtitle="Update the property name and location" onClose={onClose}>
    <form onSubmit={submit} className="p-6 space-y-4">
      {error && <ErrorBanner message={error} />}
      <Field label="Property Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT_CLASS} /></Field>
      <Field label="Street Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={INPUT_CLASS} /></Field>
      <Field label="City"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={INPUT_CLASS} /></Field>
      <Actions onClose={onClose} saving={isSaving} label="Save Changes" />
    </form>
  </ModalShell>;
}
