import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Send,
  Eye,
  Ticket,
  MailCheck,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { technicianService } from '../../services/technicianService';
import { useAuthStore } from '../../store/useAuthStore';
import QuotationModal from './QuotationModal';

export default function QuotationDashboard() {
  const { user } = useAuthStore();
  const isPropertyManager = user?.role === 'PropertyManager';
  const isTechnician = user?.role === 'Technician';

  const [quotations, setQuotations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Approved'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    if (!isTechnician) {
      fetchQuotations();
    }
  }, [isTechnician]);

  if (isTechnician) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center space-y-4 max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Technicians do not have access to Quotation Management or Cost Approvals. Only Property Managers are authorized to review and approve quotations.
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">
            <Lock className="w-3.5 h-3.5" />
            Property Manager Access Required
          </span>
        </div>
      </div>
    );
  }

  const fetchQuotations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [quotData, appData, tickData] = await Promise.all([
        technicianService.getQuotations(),
        technicianService.getAppointments().catch(() => []),
        technicianService.getTickets().catch(() => []),
      ]);
      setQuotations(Array.isArray(quotData) ? quotData : []);
      setAppointments(Array.isArray(appData) ? appData : []);
      setTickets(Array.isArray(tickData) ? tickData : []);
    } catch (err) {
      setError(err.message || 'Failed to load maintenance cost quotations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuotation = async (formData) => {
    setIsSaving(true);
    setError(null);
    try {
      await technicianService.createQuotation(formData);
      setSuccessToast({
        title: 'Quotation Submitted',
        message: 'New maintenance quotation submitted successfully for approval.',
      });
      setIsModalOpen(false);
      setSelectedQuotation(null);
      await fetchQuotations();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to create quotation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveQuotation = async (id) => {
    setApprovingId(id);
    setError(null);
    try {
      await technicianService.approveQuotation(id);
      setSuccessToast({
        title: 'Quotation Approved & Booking Confirmed',
        message:
          'Cost quotation approved successfully. Automated booking confirmation emails have been dispatched to both the Tenant and assigned Technician.',
      });
      if (selectedQuotation && selectedQuotation.id === id) {
        setIsModalOpen(false);
        setSelectedQuotation(null);
      }
      await fetchQuotations();
      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err) {
      setError(err.message || 'Failed to approve quotation.');
    } finally {
      setApprovingId(null);
    }
  };

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Approved'
            ? q.isApproved
            : !q.isApproved;

      const matchesSearch =
        !searchQuery || q.ticketId.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [quotations, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Alert Banners & Toast */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Action Failed</p>
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            &times;
          </button>
        </div>
      )}

      {successToast && (
        <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] p-4 rounded-xl flex items-start gap-3 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
          <MailCheck className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-[#10B981]">{successToast.title}</p>
            <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{successToast.message}</p>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
      )}

      {/* Section Title Heading (Clean text without white box container) */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1E3A8A]" />
            Maintenance Quotations & Cost Approvals
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Review itemized labor and parts cost estimates. Property Managers can authorize approvals to trigger automated booking confirmation emails.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedQuotation(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-semibold text-sm rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ticket ID..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <label className="text-xs font-semibold text-gray-600">Approval State:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white cursor-pointer"
            >
              <option value="All">All Quotations</option>
              <option value="Pending">Pending Approval</option>
              <option value="Approved">Approved & Email Dispatched</option>
            </select>
          </div>

          <button
            onClick={fetchQuotations}
            title="Refresh Quotations"
            className="p-2 text-gray-500 hover:text-[#1E3A8A] rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ml-auto sm:ml-0 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quotation Table / Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <div className="w-8 h-8 border-3 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Fetching maintenance quotations...</p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-700">No Cost Quotations Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'All'
                ? 'No quotations match your current filter parameters.'
                : 'No cost quotations have been created yet. Click "New Quotation" to submit an estimate for a ticket.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Ticket ID</th>
                  <th className="py-3.5 px-5">Estimated Labor Cost</th>
                  <th className="py-3.5 px-5">Parts Cost</th>
                  <th className="py-3.5 px-5">Total Cost</th>
                  <th className="py-3.5 px-5">Approval Status</th>
                  <th className="py-3.5 px-5 text-right">Action / Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredQuotations.map((q) => {
                  const labor = parseFloat(q.laborCost || 0).toFixed(2);
                  const parts = parseFloat(q.partsCost || 0).toFixed(2);
                  const total = parseFloat(q.totalCost || 0).toFixed(2);

                  return (
                    <tr key={q.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Ticket ID */}
                      <td className="py-4 px-5 font-mono text-xs font-semibold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          <span>{q.ticketId}</span>
                        </div>
                      </td>

                      {/* Labor Cost */}
                      <td className="py-4 px-5 text-gray-700 font-medium">Rs. {labor}</td>

                      {/* Parts Cost */}
                      <td className="py-4 px-5 text-gray-700 font-medium">Rs. {parts}</td>

                      {/* Total Cost */}
                      <td className="py-4 px-5 font-extrabold text-[#1E3A8A] text-base">
                        Rs. {total}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5">
                        {q.isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            Approved & Email Dispatched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pending Approval
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Detail Button */}
                          <button
                            onClick={() => {
                              setSelectedQuotation(q);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                            title="View Cost Breakdown"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            <span>Details</span>
                          </button>

                          {/* Approve Action Button */}
                          {!q.isApproved && (
                            <button
                              onClick={() => handleApproveQuotation(q.id)}
                              disabled={approvingId === q.id || !isPropertyManager}
                              title={
                                !isPropertyManager
                                  ? 'Only Property Managers are authorized to approve quotations.'
                                  : 'Approve cost quotation and send emails'
                              }
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer ${isPropertyManager
                                  ? 'bg-[#10B981] hover:bg-[#10B981]/90 text-white'
                                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                } disabled:opacity-50`}
                            >
                              {approvingId === q.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Sending Email...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Approve Quotation</span>
                                </>
                              )}
                            </button>
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

      {/* Detail / Create Modal */}
      <QuotationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedQuotation(null);
        }}
        onSubmit={handleCreateQuotation}
        initialData={selectedQuotation}
        isLoading={isSaving}
        isPropertyManager={isPropertyManager}
        onApprove={handleApproveQuotation}
        isApproving={approvingId === selectedQuotation?.id}
        appointments={appointments}
        tickets={tickets}
        quotations={quotations}
      />
    </div>
  );
}
