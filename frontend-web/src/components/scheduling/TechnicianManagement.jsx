import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Wrench,
  Mail,
  Phone,
  DollarSign,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  Zap,
  Hammer,
  Droplet,
  CheckCircle2,
} from 'lucide-react';
import {
  technicianService,
  TRADE_SPECIALTIES,
  TRADE_SPECIALTY_MAP,
} from '../../services/technicianService';
import { useAuthStore } from '../../store/useAuthStore';
import TechnicianModal from './TechnicianModal';
import { ShieldAlert, Lock } from 'lucide-react';

export default function TechnicianManagement() {
  const { user } = useAuthStore();
  const isPropertyManager = user?.role === 'PropertyManager';
  const isTechnician = user?.role === 'Technician';

  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters & Search
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Deactivate Confirmation
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!isTechnician) {
      fetchTechnicians();
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
            Technicians are restricted from browsing other technicians' profiles. You can view and edit your own personal profile parameters under <span className="font-semibold text-gray-900">My Profile</span>.
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">
            <Lock className="w-3.5 h-3.5" />
            Isolated Technician Role Permissions Enforced
          </span>
        </div>
      </div>
    );
  }

  const fetchTechnicians = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await technicianService.getTechnicians();
      setTechnicians(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load technician profiles.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async (formData) => {
    setIsSaving(true);
    setError(null);
    try {
      if (editingTechnician) {
        await technicianService.updateTechnician(editingTechnician.id, formData);
        setSuccessMessage(`Technician profile for "${formData.fullName}" updated successfully.`);
      } else {
        await technicianService.createTechnician(formData);
        setSuccessMessage(`New technician "${formData.fullName}" registered successfully.`);
      }
      setIsModalOpen(false);
      setEditingTechnician(null);
      await fetchTechnicians();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save technician profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate technician profile for "${name}"?`)) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      await technicianService.deactivateTechnician(id);
      setSuccessMessage(`Technician "${name}" deactivated successfully.`);
      await fetchTechnicians();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to deactivate technician.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Technicians
  const filteredTechnicians = useMemo(() => {
    return technicians.filter((tech) => {
      const mappedSpecialty = TRADE_SPECIALTY_MAP[tech.tradeSpecialty] || tech.tradeSpecialty;
      const matchesSpecialty =
        specialtyFilter === 'All' || mappedSpecialty === specialtyFilter;

      const fullName = tech.fullName || tech.name || '';
      const email = tech.email || '';
      const matchesSearch =
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSpecialty && matchesSearch;
    });
  }, [technicians, specialtyFilter, searchQuery]);

  const getSpecialtyBadge = (specialty) => {
    const name = TRADE_SPECIALTY_MAP[specialty] || specialty;
    switch (name) {
      case 'Plumber':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Droplet className="w-3.5 h-3.5 text-blue-500" />
            Plumber
          </span>
        );
      case 'Electrician':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
            <Zap className="w-3.5 h-3.5 text-[#10B981]" />
            Electrician
          </span>
        );
      case 'Handyman':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Hammer className="w-3.5 h-3.5 text-amber-600" />
            Handyman
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

      {/* Header Controls & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Stats */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#1E3A8A]" />
            Technician Profiles Directory
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage user accounts, trade specialties (Plumber, Electrician, Handyman), and hourly billing rates.
          </p>
        </div>

        {/* Primary Action Button */}
        {isPropertyManager ? (
          <button
            onClick={() => {
              setEditingTechnician(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-semibold text-sm rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Technician</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Read-Only Mode (Property Manager required to edit)</span>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all"
          />
        </div>

        {/* Specialty Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Specialty:</label>
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white cursor-pointer"
          >
            <option value="All">All Specialties</option>
            {TRADE_SPECIALTIES.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>

          <button
            onClick={fetchTechnicians}
            title="Refresh Directory"
            className="p-2 text-gray-500 hover:text-[#1E3A8A] rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ml-auto sm:ml-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <div className="w-8 h-8 border-3 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Fetching technician profiles...</p>
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-700">No Technicians Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {searchQuery || specialtyFilter !== 'All'
                ? 'No technician matches your filter criteria. Try clearing search filters.'
                : 'No technician profiles registered in the system yet. Click "Add New Technician" to register.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Technician Name</th>
                  <th className="py-3.5 px-5">Email Address</th>
                  <th className="py-3.5 px-5">Trade Specialty</th>
                  <th className="py-3.5 px-5">Hourly Rate</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredTechnicians.map((tech) => {
                  const techName = tech.fullName || tech.name || 'Unnamed Technician';
                  const techEmail = tech.email || 'No email provided';
                  const rateFormatted = parseFloat(tech.hourlyRate || 0).toFixed(2);

                  return (
                    <tr key={tech.id} className="hover:bg-gray-50/60 transition-colors group">
                      {/* Name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] font-bold text-sm flex items-center justify-center border border-[#1E3A8A]/20">
                            {techName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{techName}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-gray-700 text-xs font-medium">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{techEmail}</span>
                        </div>
                      </td>

                      {/* Specialty */}
                      <td className="py-4 px-5">{getSpecialtyBadge(tech.tradeSpecialty)}</td>

                      {/* Rate */}
                      <td className="py-4 px-5">
                        <div className="inline-flex items-center gap-1 font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-xs">
                          <span className="text-xs font-bold text-[#10B981]">Rs.</span>
                          <span>{rateFormatted} / hr</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              if (isPropertyManager) {
                                setEditingTechnician(tech);
                                setIsModalOpen(true);
                              }
                            }}
                            disabled={!isPropertyManager}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isPropertyManager
                                ? 'text-gray-600 hover:text-[#1E3A8A] hover:bg-gray-100 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={
                              isPropertyManager
                                ? 'Edit Profile'
                                : 'Property Manager access required to edit profiles'
                            }
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => isPropertyManager && handleDeactivate(tech.id, techName)}
                            disabled={!isPropertyManager || deletingId === tech.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isPropertyManager
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={
                              isPropertyManager
                                ? 'Deactivate Profile'
                                : 'Property Manager access required to deactivate profiles'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Technician Modal */}
      <TechnicianModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTechnician(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingTechnician}
        isLoading={isSaving}
      />
    </div>
  );
}
