import React, { useState, useEffect, useMemo } from 'react';
import { X, Ticket, DollarSign, Calculator, CheckCircle2, AlertCircle, Send } from 'lucide-react';

export default function QuotationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
  isPropertyManager = true,
  onApprove = null,
  isApproving = false,
  appointments = [],
  tickets = [],
  quotations = [],
}) {
  const [formData, setFormData] = useState({
    ticketId: '',
    laborCost: '',
    partsCost: '',
  });

  const [errors, setErrors] = useState({});

  // Filter tickets that currently have an active scheduled appointment AND no existing quotation
  const scheduledTickets = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];

    // Set of ticket IDs that already have a quotation submitted
    const existingQuotationTicketIds = new Set(
      (quotations || []).map((q) => (q.ticketId || '').toLowerCase())
    );

    const activeApps = appointments.filter(
      (app) =>
        app.status !== 'Cancelled' &&
        app.status !== 3 &&
        !existingQuotationTicketIds.has((app.ticketId || '').toLowerCase())
    );

    const ticketsMap = new Map((tickets || []).map((t) => [(t.id || '').toLowerCase(), t]));

    return activeApps.map((app) => {
      const matchingTicket = ticketsMap.get((app.ticketId || '').toLowerCase());
      return {
        id: app.ticketId,
        unitNumber: matchingTicket?.unitNumber || 'N/A',
        description: matchingTicket?.description || 'Scheduled Maintenance Job',
        scheduledDate: app.scheduledDate,
      };
    });
  }, [appointments, tickets, quotations]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ticketId: initialData.ticketId || '',
        laborCost: initialData.laborCost !== undefined ? String(initialData.laborCost) : '',
        partsCost: initialData.partsCost !== undefined ? String(initialData.partsCost) : '',
      });
    } else {
      const defaultTicketId = scheduledTickets.length > 0 ? scheduledTickets[0].id : '';
      setFormData({
        ticketId: defaultTicketId,
        laborCost: '',
        partsCost: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen, scheduledTickets]);

  if (!isOpen) return null;

  const isViewOnly = Boolean(initialData);

  const laborNum = parseFloat(formData.laborCost) || 0;
  const partsNum = parseFloat(formData.partsCost) || 0;
  const calculatedTotal = laborNum + partsNum;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ticketId.trim()) {
      newErrors.ticketId = 'Ticket ID is required.';
    } else if (
      !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        formData.ticketId.trim()
      )
    ) {
      newErrors.ticketId = 'Ticket ID must be a valid GUID format.';
    }

    if (formData.laborCost === '') {
      newErrors.laborCost = 'Labor cost is required.';
    } else if (isNaN(laborNum) || laborNum < 0) {
      newErrors.laborCost = 'Value must be greater than or equal to 0.';
    }

    if (formData.partsCost === '') {
      newErrors.partsCost = 'Parts cost is required.';
    } else if (isNaN(partsNum) || partsNum < 0) {
      newErrors.partsCost = 'Value must be greater than or equal to 0.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'laborCost') {
      const num = parseFloat(value);
      if (value !== '' && (isNaN(num) || num < 0)) {
        setErrors((prev) => ({ ...prev, laborCost: 'Value must be greater than or equal to 0.' }));
      } else {
        setErrors((prev) => ({ ...prev, laborCost: null }));
      }
    } else if (name === 'partsCost') {
      const num = parseFloat(value);
      if (value !== '' && (isNaN(num) || num < 0)) {
        setErrors((prev) => ({ ...prev, partsCost: 'Value must be greater than or equal to 0.' }));
      } else {
        setErrors((prev) => ({ ...prev, partsCost: null }));
      }
    } else if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isViewOnly ? 'Quotation Cost Breakdown' : 'Create Maintenance Quotation'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isViewOnly
                ? 'Review itemized labor & parts estimate before authorizing approval'
                : 'Submit estimated labor and parts costs for maintenance ticket approval'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ticket Selection / ID */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Scheduled Maintenance Ticket <span className="text-red-500">*</span>
            </label>
            {isViewOnly ? (
              <div className="relative">
                <input
                  type="text"
                  name="ticketId"
                  disabled
                  value={formData.ticketId}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-gray-50 text-gray-700 font-mono text-xs cursor-not-allowed border-gray-200"
                />
                <Ticket className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            ) : scheduledTickets.length > 0 ? (
              <div className="relative">
                <select
                  name="ticketId"
                  value={formData.ticketId}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white cursor-pointer ${errors.ticketId
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                    }`}
                >
                  <option value="" disabled>
                    Select a scheduled ticket...
                  </option>
                  {scheduledTickets.map((t, idx) => (
                    <option key={`${t.id}-${idx}`} value={t.id}>
                      Unit {t.unitNumber} - {t.description.length > 35 ? t.description.substring(0, 35) + '...' : t.description} (Date: {t.scheduledDate})
                    </option>
                  ))}
                </select>
                <Ticket className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            ) : (
              <div>
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mb-1.5 font-medium">
                  Notice: No active scheduled appointments found. You may type a Ticket GUID manually:
                </p>
                <div className="relative">
                  <input
                    type="text"
                    name="ticketId"
                    value={formData.ticketId}
                    onChange={handleChange}
                    placeholder="Enter Maintenance Ticket GUID..."
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.ticketId
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                      }`}
                  />
                  <Ticket className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}
            {errors.ticketId && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                <AlertCircle className="w-3 h-3" /> {errors.ticketId}
              </p>
            )}
          </div>

          {/* Labor Cost & Parts Cost Inputs */}
          <div className="grid grid-cols-2 gap-4">
            {/* Labor Cost */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Labor Cost (Rs.) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  name="laborCost"
                  disabled={isViewOnly}
                  value={formData.laborCost}
                  onChange={handleChange}
                  placeholder="120.00"
                  className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${isViewOnly ? 'bg-gray-50 text-gray-700 font-semibold' : ''
                    } ${errors.laborCost
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                    }`}
                />
                <span className="text-xs font-bold text-gray-400 absolute left-3 top-2.5">Rs.</span>
              </div>
              {errors.laborCost && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.laborCost}
                </p>
              )}
            </div>

            {/* Parts Cost */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Parts & Materials (Rs.) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  name="partsCost"
                  disabled={isViewOnly}
                  value={formData.partsCost}
                  onChange={handleChange}
                  placeholder="45.50"
                  className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${isViewOnly ? 'bg-gray-50 text-gray-700 font-semibold' : ''
                    } ${errors.partsCost
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                    }`}
                />
                <span className="text-xs font-bold text-gray-400 absolute left-3 top-2.5">Rs.</span>
              </div>
              {errors.partsCost && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.partsCost}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Total Calculation Summary Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Estimated Labor Cost:</span>
              <span className="font-semibold text-gray-900">Rs. {laborNum.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Parts & Materials Cost:</span>
              <span className="font-semibold text-gray-900">Rs. {partsNum.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#1E3A8A]" /> Total Estimated Cost:
              </span>
              <span className="text-base font-extrabold text-[#1E3A8A]">
                Rs. {calculatedTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* View-Only Approval Status Banner */}
          {isViewOnly && (
            <div className="pt-2">
              {initialData.isApproved ? (
                <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] p-3 rounded-lg flex items-center gap-2 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Approved & Booking Confirmation Email Dispatched to Tenant & Technician</span>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Pending Property Manager Cost Approval</span>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Close
            </button>

            {isViewOnly ? (
              !initialData.isApproved && isPropertyManager && onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(initialData.id)}
                  disabled={isApproving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#10B981] hover:bg-[#10B981]/90 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isApproving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Approving & Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Approve Quotation</span>
                    </>
                  )}
                </button>
              )
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Quotation</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
