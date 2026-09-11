import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import UrgencyBadge from './UrgencyBadge';
import { updateTicketStatus, deleteTicket } from '../services/ticketService';
import { ChevronDown, Loader2, CheckCircle2, AlertTriangle, Image as ImageIcon, X, Trash2 } from 'lucide-react';

/** Backend stores status as string names — these are the valid values */
const STATUS_OPTIONS = [
  { value: 0, label: 'Submitted' },
  { value: 1, label: 'Analyzing' },
  { value: 2, label: 'PendingApproval' },
  { value: 3, label: 'Scheduled' },
  { value: 4, label: 'Completed' },
];

/** Maps status string name → enum int value for the PATCH request */
const STATUS_NAME_TO_INT = {
  Submitted: 0,
  Analyzing: 1,
  PendingApproval: 2,
  Scheduled: 3,
  Completed: 4,
};

/** Maps enum int value → status string name for display */
const STATUS_INT_TO_NAME = {
  0: 'Submitted',
  1: 'Analyzing',
  2: 'PendingApproval',
  3: 'Scheduled',
  4: 'Completed',
};

export default function TicketsTable({ tickets, onTicketUpdated, onTicketDeleted }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, unitNumber }
  const [toast, setToast] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `http://localhost:5030${url}`;
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (ticketId, newStatusInt) => {
    setUpdatingId(ticketId);
    try {
      await updateTicketStatus(ticketId, newStatusInt);
      // Optimistic local update via callback
      onTicketUpdated(ticketId, STATUS_INT_TO_NAME[newStatusInt]);
      showToast('success', `Status updated to "${STATUS_INT_TO_NAME[newStatusInt]}"`);
    } catch (err) {
      showToast('error', err.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteClick = (ticket) => {
    setConfirmDelete({ id: ticket.id, unitNumber: ticket.unitNumber });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const { id, unitNumber } = confirmDelete;
    setConfirmDelete(null);
    setDeletingId(id);
    try {
      await deleteTicket(id);
      onTicketDeleted(id);
      showToast('success', `Ticket for Unit ${unitNumber || ''} deleted successfully.`);
    } catch (err) {
      showToast('error', err.message || 'Failed to delete ticket.');
    } finally {
      setDeletingId(null);
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No tickets found</h3>
        <p className="text-sm text-gray-500">There are no maintenance requests matching your current filter.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-white border-[#10B981]/30 text-[#10B981]'
              : 'bg-white border-[#EF4444]/30 text-[#EF4444]'
          }`}
          style={{ animation: 'slideInRight 0.3s ease-out' }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 m-0">Delete Ticket</h4>
                <p className="text-xs text-gray-500 m-0 mt-0.5">
                  Unit {confirmDelete.unitNumber || '—'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete this maintenance ticket? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#EF4444] text-white text-sm font-medium hover:bg-red-600 transition-all focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 truncate m-0 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#1E3A8A]" />
                {selectedImage.title}
              </h4>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center p-2">
              <img
                src={selectedImage.url}
                alt="Ticket Attachment Full Preview"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Photo</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted By</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[240px]">Description</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Urgency</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted Date</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Update Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map((ticket, index) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-blue-50/30 transition-colors duration-150"
                >
                  {/* Row Number */}
                  <td className="px-5 py-4 text-gray-400 font-medium text-xs">
                    {index + 1}
                  </td>

                  {/* Unit Number */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
                      <span className="w-2 h-2 rounded-full bg-[#1E3A8A]/30 shrink-0" />
                      {ticket.unitNumber || '—'}
                    </span>
                  </td>

                  {/* Photo Thumbnail */}
                  <td className="px-5 py-4">
                    {ticket.thumbnailUrl ? (
                      <button
                        onClick={() =>
                          setSelectedImage({
                            url: getFullImageUrl(ticket.thumbnailUrl),
                            title: `Unit ${ticket.unitNumber || ''} Attachment`,
                          })
                        }
                        className="group flex items-center gap-1.5 p-1 rounded-lg border border-gray-200 hover:border-[#1E3A8A] bg-gray-50 hover:bg-blue-50/60 transition-all cursor-pointer"
                        title="Click to view full photo"
                      >
                        <img
                          src={getFullImageUrl(ticket.thumbnailUrl)}
                          alt="Ticket attachment"
                          className="w-8 h-8 rounded-md object-cover shrink-0 border border-gray-200"
                        />
                        <span className="text-[11px] font-medium text-gray-600 group-hover:text-[#1E3A8A] pr-1 hidden sm:inline">
                          View
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No Photo</span>
                    )}
                  </td>

                  {/* Submitted By (Tenant Name) */}
                  <td className="px-5 py-4">
                    <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                      {ticket.tenantName || '—'}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="px-5 py-4">
                    <p className="text-gray-700 leading-relaxed line-clamp-2 m-0" title={ticket.description}>
                      {ticket.description}
                    </p>
                  </td>

                  {/* Urgency Badge */}
                  <td className="px-5 py-4">
                    <UrgencyBadge urgency={ticket.urgencyLevel} />
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-4">
                    <StatusBadge status={ticket.status} />
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-5 py-4">
                    <div className="relative">
                      {updatingId === ticket.id ? (
                        <div className="flex items-center gap-2 text-[#3B82F6] text-xs font-medium py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating…
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={STATUS_NAME_TO_INT[ticket.status] ?? 0}
                            onChange={(e) =>
                              handleStatusChange(ticket.id, parseInt(e.target.value, 10))
                            }
                            className="appearance-none w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg pl-3 pr-8 py-2 cursor-pointer hover:border-[#1E3A8A]/40 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/50 transition-all"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label === 'PendingApproval' ? 'Pending Approval' : opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Delete Action */}
                  <td className="px-5 py-4">
                    {deletingId === ticket.id ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-[#EF4444]" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(ticket)}
                        title="Delete ticket"
                        className="p-2 rounded-lg text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
