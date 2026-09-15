import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import UrgencyBadge from './UrgencyBadge';
import { updateTicketStatus, deleteTicket } from '../services/ticketService';
import { ChevronDown, Loader2, CheckCircle2, AlertTriangle, Image as ImageIcon, X, Trash2, Search } from 'lucide-react';

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
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getShortId = (id) => {
    if (!id) return '';
    return `#T-${id.substring(0, 8).toUpperCase()}`;
  };

  const getFullImageUrl = (relativePath) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `http://localhost:5030${cleanPath}`;
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

  // Apply search filter (on top of the status-filtered tickets prop)
  const searchedTickets = (() => {
    if (!searchQuery.trim()) return tickets;
    const query = searchQuery.toLowerCase().replace('#', '');
    return tickets.filter((ticket) => {
      const shortId = ticket.id ? `t-${ticket.id.substring(0, 8)}`.toLowerCase() : '';
      const tenantName = (ticket.tenantName || '').toLowerCase();
      return shortId.includes(query) || tenantName.includes(query);
    });
  })();

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

      {/* Attachment Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 truncate m-0 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#1E3A8A]" />
                Unit {selectedTicket.unitNumber || ''} Attachments
              </h4>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto rounded-xl bg-gray-50 p-4">
              {(() => {
                const imagesToDisplay = selectedTicket.imageUrls && selectedTicket.imageUrls.length > 0 
                  ? selectedTicket.imageUrls 
                  : (selectedTicket.thumbnailUrl ? [selectedTicket.thumbnailUrl] : []);
                
                if (imagesToDisplay.length > 0) {
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {imagesToDisplay.map((url, index) => (
                        <div 
                          key={index}
                          className="aspect-square rounded-lg overflow-hidden bg-gray-200 cursor-pointer hover:ring-2 hover:ring-[#1E3A8A] transition-all relative group"
                          onClick={() => setFullScreenImage(getFullImageUrl(url))}
                        >
                          <img
                            src={getFullImageUrl(url)}
                            alt={`Ticket attachment ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full items-center justify-center bg-gray-100 text-gray-400 absolute inset-0">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <ImageIcon className="w-12 h-12 mb-3 text-gray-300" />
                    <p>No attachments available</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Photo Viewer */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-[61]"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullScreenImage}
            alt="Full screen preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-md relative z-[60]"
            onClick={(e) => e.stopPropagation()}
          />
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

      {/* Search Bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Ticket ID or Tenant Name..."
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
            {searchedTickets.length} result{searchedTickets.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 hidden sm:table-cell">#</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket ID</th>
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
              {searchedTickets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="w-10 h-10 text-gray-200" />
                      <p className="text-sm font-medium text-gray-500">
                        No tickets match <span className="font-semibold text-gray-700">&quot;{searchQuery}&quot;</span>
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-[#1E3A8A] hover:underline"
                      >
                        Clear search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                searchedTickets.map((ticket, index) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-blue-50/30 transition-colors duration-150"
                >
                  {/* Row Number */}
                  <td className="px-5 py-4 text-gray-400 font-medium text-xs hidden sm:table-cell">
                    {index + 1}
                  </td>

                  {/* Ticket ID */}
                  <td className="px-5 py-4">
                    <span className="inline-block px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono font-semibold">
                      {getShortId(ticket.id)}
                    </span>
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
                        onClick={() => setSelectedTicket(ticket)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
