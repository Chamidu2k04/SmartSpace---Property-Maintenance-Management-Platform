import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit2,
  XCircle,
  Ticket,
  User,
  Wrench,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  technicianService,
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_MAP,
  TRADE_SPECIALTY_MAP,
} from '../../services/technicianService';
import { useAuthStore } from '../../store/useAuthStore';
import AppointmentModal from './AppointmentModal';

export default function AppointmentCalendar({ isTechnicianView = false }) {
  const { user } = useAuthStore();
  const isTechnician = isTechnicianView || user?.role === 'Technician';

  const [appointments, setAppointments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [preselectedTicketId, setPreselectedTicketId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Cancelling State
  const [cancellingId, setCancellingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [appRes, techRes, tickRes] = await Promise.all([
        technicianService.getAppointments(),
        technicianService.getTechnicians(),
        technicianService.getTickets().catch(() => []),
      ]);
      setAppointments(Array.isArray(appRes) ? appRes : []);
      setTechnicians(Array.isArray(techRes) ? techRes : []);
      setTickets(Array.isArray(tickRes) ? tickRes : []);
    } catch (err) {
      setError(err.message || 'Failed to load maintenance appointments.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tickets that do not have any appointment record (active or cancelled)
  const unscheduledTickets = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    const scheduledTicketIds = new Set(
      (appointments || []).map((app) => (app.ticketId || '').toLowerCase())
    );
    return tickets.filter((t) => !scheduledTicketIds.has((t.id || '').toLowerCase()));
  }, [tickets, appointments]);

  const handleCreateOrUpdate = async (formData) => {
    if (isTechnician) return;
    setIsSaving(true);
    setError(null);
    try {
      if (editingAppointment) {
        await technicianService.updateAppointment(editingAppointment.id, formData);
        setSuccessMessage('Appointment rescheduled successfully.');
      } else {
        await technicianService.createAppointment(formData);
        setSuccessMessage('Maintenance appointment scheduled successfully.');
      }
      setIsModalOpen(false);
      setEditingAppointment(null);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save appointment schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAppointment = async (id, ticketId) => {
    if (isTechnician) return;
    if (
      !window.confirm(
        `Are you sure you want to cancel the maintenance appointment for Ticket ID ${ticketId.substring(0, 8)}...?`
      )
    ) {
      return;
    }
    setCancellingId(id);
    setError(null);
    try {
      await technicianService.cancelAppointment(id);
      setSuccessMessage('Appointment status set to Cancelled.');
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleTechnicianStatusChange = async (appointment, newStatus) => {
    setUpdatingStatusId(appointment.id);
    setError(null);
    try {
      await technicianService.updateAppointment(appointment.id, {
        scheduledDate: appointment.scheduledDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        technicianId: appointment.technicianId,
        status: newStatus,
      });
      setSuccessMessage(`Appointment status updated to "${APPOINTMENT_STATUS_MAP[newStatus] || newStatus}".`);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update appointment status.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Build technician lookup map
  const techMap = useMemo(() => {
    const map = {};
    technicians.forEach((tech) => {
      map[tech.id] = tech;
    });
    return map;
  }, [technicians]);

  // Current logged in technician profile (if any)
  const currentTechProfile = useMemo(() => {
    if (!user) return null;
    return technicians.find(
      (t) =>
        t.id === user.id ||
        t.userId === user.id ||
        (t.email && user.email && t.email.toLowerCase() === user.email.toLowerCase())
    );
  }, [technicians, user]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Strict Technician Role Isolation: Only view appointments where TechnicianId matches profile ID
      if (isTechnician) {
        const isMyAppointment =
          app.technicianId === user?.id ||
          (currentTechProfile && app.technicianId === currentTechProfile.id) ||
          (currentTechProfile && app.technicianId === currentTechProfile.userId);

        if (!isMyAppointment) {
          return false;
        }
      }

      const rawStatus = app.status;
      const mappedStatus = APPOINTMENT_STATUS_MAP[rawStatus] || rawStatus;
      const matchesStatus = statusFilter === 'All' || mappedStatus === statusFilter;

      const matchesDate = !dateFilter || app.scheduledDate === dateFilter;

      const tech = techMap[app.technicianId];
      const techName = tech ? tech.fullName || tech.name : '';
      const matchesSearch =
        !searchQuery ||
        app.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        techName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [appointments, statusFilter, dateFilter, searchQuery, techMap, isTechnician, user, currentTechProfile]);

  const getStatusBadge = (status) => {
    const name = APPOINTMENT_STATUS_MAP[status] || status;
    switch (name) {
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-500" />
            Scheduled
          </span>
        );
      case 'InProgress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
            In Progress
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
            Completed
          </span>
        );
      case 'Cancelled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3 text-red-500" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="flex-1">{successMessage}</span>
        </div>
      )}

      {/* Section Title Heading (Clean text without white box container) */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#1E3A8A]" />
            {isTechnician ? 'My Assigned Job Schedule' : 'Maintenance Appointment Management'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isTechnician
              ? 'View maintenance appointments assigned specifically to your technician profile.'
              : 'Schedule maintenance jobs, assign technicians by trade specialty, and manage appointment time slots.'}
          </p>
        </div>
        {isTechnician && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981]/10 text-[#10B981] rounded-full font-semibold text-xs border border-[#10B981]/20">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            Technician View
          </span>
        )}
      </div>

      {/* Unscheduled Maintenance Tickets Quick Action Banner */}
      {!isTechnician && unscheduledTickets.length > 0 && (
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#1E3A8A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                Unscheduled Tickets ({unscheduledTickets.length} Pending Appointment)
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-medium">Click any ticket to schedule an appointment slot</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unscheduledTickets.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-blue-100 hover:border-[#1E3A8A] rounded-lg p-3 transition-all shadow-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 truncate">
                      Unit {t.unitNumber || 'N/A'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                      {t.urgencyLevel || 'Normal'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate mt-0.5">
                    {t.description || 'No description provided'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingAppointment(null);
                    setPreselectedTicketId(t.id);
                    setIsModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-semibold text-xs rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ticket..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <label className="text-xs font-semibold text-gray-600">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {APPOINTMENT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white cursor-pointer"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                Clear Date
              </button>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={loadData}
            title="Refresh Appointments"
            className="p-2 text-gray-500 hover:text-[#1E3A8A] rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ml-auto md:ml-0 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Appointments List / Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <div className="w-8 h-8 border-3 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Loading scheduled appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-700">No Appointments Assigned</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {isTechnician
                ? 'You currently have no maintenance job appointments assigned to your profile.'
                : statusFilter !== 'All' || dateFilter || searchQuery
                ? 'No maintenance appointments match your active filter criteria.'
                : 'There are no active maintenance appointments recorded in the system. Click "Schedule Appointment" to assign one.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Ticket ID</th>
                  <th className="py-3.5 px-5">Assigned Technician</th>
                  <th className="py-3.5 px-5">Trade Specialty</th>
                  <th className="py-3.5 px-5">Scheduled Window</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredAppointments.map((app) => {
                  const tech = techMap[app.technicianId];
                  const techName = tech ? tech.fullName || tech.name : (user?.fullName || 'Assigned Technician');
                  const techSpecialty = tech
                    ? TRADE_SPECIALTY_MAP[tech.tradeSpecialty] || tech.tradeSpecialty
                    : 'Maintenance';
                  const startTimeStr = app.startTime ? app.startTime.substring(0, 5) : '--:--';
                  const endTimeStr = app.endTime ? app.endTime.substring(0, 5) : '--:--';
                  const isCancelled =
                    APPOINTMENT_STATUS_MAP[app.status] === 'Cancelled' || app.status === 'Cancelled';

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-gray-50/60 transition-colors ${
                        isCancelled ? 'bg-gray-50/30 text-gray-400' : ''
                      }`}
                    >
                      {/* Ticket ID */}
                      <td className="py-4 px-5 font-mono text-xs font-semibold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          <span>{app.ticketId}</span>
                        </div>
                      </td>

                      {/* Technician */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">{techName}</span>
                        </div>
                      </td>

                      {/* Trade Specialty */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          <Wrench className="w-3 h-3 text-gray-500" />
                          {techSpecialty}
                        </span>
                      </td>

                      {/* Scheduled Window */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-gray-900 text-xs">
                            {app.scheduledDate}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>
                              {startTimeStr} - {endTimeStr}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">{getStatusBadge(app.status)}</td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isTechnician && !isCancelled && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingAppointment(app);
                                  setIsModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                title="Reschedule Date/Time"
                              >
                                <Edit2 className="w-3 h-3 text-gray-500" />
                                <span>Reschedule</span>
                              </button>

                              <button
                                onClick={() => handleCancelAppointment(app.id, app.ticketId)}
                                disabled={cancellingId === app.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Cancel Appointment"
                              >
                                <XCircle className="w-3 h-3 text-red-500" />
                                <span>Cancel</span>
                              </button>
                            </>
                          )}
                          {isTechnician && (
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={APPOINTMENT_STATUS_MAP[app.status] || app.status}
                                onChange={(e) => handleTechnicianStatusChange(app, e.target.value)}
                                disabled={updatingStatusId === app.id}
                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] cursor-pointer shadow-xs"
                              >
                                <option value="Scheduled">Scheduled</option>
                                <option value="InProgress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          )}
                          {!isTechnician && isCancelled && (
                            <span className="text-xs text-gray-400 italic">Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment Modal */}
      {!isTechnician && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAppointment(null);
            setPreselectedTicketId('');
          }}
          onSubmit={handleCreateOrUpdate}
          initialData={editingAppointment}
          technicians={technicians}
          tickets={tickets}
          existingAppointments={appointments}
          preselectedTicketId={preselectedTicketId}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
