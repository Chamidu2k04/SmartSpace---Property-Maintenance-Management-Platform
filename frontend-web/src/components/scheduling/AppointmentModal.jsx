import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, Ticket, UserCheck, AlertCircle, Wrench } from 'lucide-react';
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_MAP,
  TRADE_SPECIALTY_MAP,
} from '../../services/technicianService';

export default function AppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  technicians = [],
  tickets = [],
  existingAppointments = [],
  preselectedTicketId = '',
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    ticketId: '',
    technicianId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    status: 'Scheduled',
  });

  const [errors, setErrors] = useState({});
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  // Filter unscheduled tickets (tickets without any existing appointment record)
  const unscheduledTickets = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    const scheduledTicketIds = new Set(
      (existingAppointments || []).map((app) => (app.ticketId || '').toLowerCase())
    );
    return tickets.filter((t) => !scheduledTicketIds.has((t.id || '').toLowerCase()));
  }, [tickets, existingAppointments]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ticketId: initialData.ticketId || '',
        technicianId: initialData.technicianId || '',
        scheduledDate: initialData.scheduledDate || new Date().toISOString().split('T')[0],
        startTime: initialData.startTime ? initialData.startTime.substring(0, 5) : '09:00',
        endTime: initialData.endTime ? initialData.endTime.substring(0, 5) : '11:00',
        status: APPOINTMENT_STATUS_MAP[initialData.status] || 'Scheduled',
      });
    } else {
      let defaultTicketId = preselectedTicketId || '';
      if (!defaultTicketId && unscheduledTickets.length > 0) {
        defaultTicketId = unscheduledTickets[0].id;
      }
      setFormData({
        ticketId: defaultTicketId,
        technicianId: technicians.length > 0 ? technicians[0].id : '',
        scheduledDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
        status: 'Scheduled',
      });
    }
    setErrors({});
  }, [initialData, isOpen, technicians, unscheduledTickets, preselectedTicketId]);

  if (!isOpen) return null;

  const isRescheduling = Boolean(initialData);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ticketId.trim()) {
      newErrors.ticketId = 'Maintenance Ticket is required.';
    } else if (
      !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        formData.ticketId.trim()
      )
    ) {
      newErrors.ticketId = 'Ticket ID must be a valid GUID format.';
    }

    if (!formData.technicianId) {
      newErrors.technicianId = 'Assigned Technician is required.';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required.';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required.';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required.';
    }

    if (formData.startTime && formData.endTime) {
      if (formData.endTime <= formData.startTime) {
        newErrors.endTime = 'End time must be chronologically AFTER start time.';
      }
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

  const filteredTechnicians = technicians.filter((tech) => {
    if (selectedSpecialty === 'All') return true;
    const spec = TRADE_SPECIALTY_MAP[tech.tradeSpecialty] || tech.tradeSpecialty;
    return spec === selectedSpecialty;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isRescheduling ? 'Reschedule Maintenance Appointment' : 'Schedule New Appointment'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isRescheduling
                ? 'Update appointment date, window, assigned technician, or lifecycle status'
                : 'Assign a qualified technician and set a scheduled maintenance slot'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ticket ID / Select Unscheduled Ticket */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Maintenance Ticket <span className="text-red-500">*</span>
            </label>
            {isRescheduling ? (
              <div className="relative">
                <input
                  type="text"
                  name="ticketId"
                  disabled
                  value={formData.ticketId}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200 font-mono"
                />
                <Ticket className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            ) : unscheduledTickets.length > 0 ? (
              <div className="relative">
                <select
                  name="ticketId"
                  value={formData.ticketId}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white cursor-pointer ${
                    errors.ticketId
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                  }`}
                >
                  <option value="" disabled>
                    Select an unscheduled ticket...
                  </option>
                  {unscheduledTickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      Unit {t.unitNumber || 'N/A'} - {t.description ? (t.description.length > 35 ? t.description.substring(0, 35) + '...' : t.description) : 'No Description'} ({t.urgencyLevel || 'Normal'})
                    </option>
                  ))}
                </select>
                <Ticket className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            ) : (
              <div>
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mb-1.5 font-medium">
                  Notice: All tickets currently have appointments or no open tickets found. You may type a Ticket GUID manually:
                </p>
                <div className="relative">
                  <input
                    type="text"
                    name="ticketId"
                    value={formData.ticketId}
                    onChange={handleChange}
                    placeholder="Enter Maintenance Ticket GUID..."
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.ticketId
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

          {/* Technician Selection & Specialty Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700">
                Assigned Technician <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Wrench className="w-3 h-3 text-gray-400" />
                <span>Filter by Specialty:</span>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Handyman">Handyman</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <select
                name="technicianId"
                value={formData.technicianId}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white cursor-pointer ${
                  errors.technicianId
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                    : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                }`}
              >
                <option value="" disabled>
                  Select a qualified technician...
                </option>
                {filteredTechnicians.map((tech) => {
                  const name = tech.fullName || tech.name;
                  const spec = TRADE_SPECIALTY_MAP[tech.tradeSpecialty] || tech.tradeSpecialty;
                  return (
                    <option key={tech.id} value={tech.id}>
                      {name} ({spec}) - Rs. {parseFloat(tech.hourlyRate || 0).toFixed(2)}/hr
                    </option>
                  );
                })}
              </select>
              <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            {errors.technicianId && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                <AlertCircle className="w-3 h-3" /> {errors.technicianId}
              </p>
            )}
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Scheduled Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                  errors.scheduledDate
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                    : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                }`}
              />
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            {errors.scheduledDate && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                <AlertCircle className="w-3 h-3" /> {errors.scheduledDate}
              </p>
            )}
          </div>

          {/* Time Window Grid: Start Time & End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                    errors.startTime
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                  }`}
                />
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              {errors.startTime && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.startTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                End Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                    errors.endTime
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                  }`}
                />
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              {errors.endTime && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Status Selection (only if rescheduling) */}
          {isRescheduling && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Appointment Lifecycle Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white cursor-pointer"
              >
                {APPOINTMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isRescheduling ? 'Save Schedule Changes' : 'Create Appointment'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
