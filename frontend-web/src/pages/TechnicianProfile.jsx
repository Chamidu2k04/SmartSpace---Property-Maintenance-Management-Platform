import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import {
  technicianService,
  TRADE_SPECIALTIES,
  TRADE_SPECIALTY_MAP,
} from '../services/technicianService';
import {
  Mail,
  Shield,
  User,
  DollarSign,
  Lock,
  Edit2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Wrench,
  KeyRound,
} from 'lucide-react';

export default function TechnicianProfile() {
  const { user, fetchProfile } = useAuthStore();
  const [techProfile, setTechProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Editable Form State for Technician
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [tradeSpecialty, setTradeSpecialty] = useState('Plumber');

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    fetchTechnicianDetails();
  }, []);

  const fetchTechnicianDetails = async () => {
    try {
      const data = await technicianService.getTechnicians();
      if (Array.isArray(data)) {
        const found = data.find(
          (t) =>
            t.id === user?.id ||
            t.userId === user?.id ||
            (t.email && user?.email && t.email.toLowerCase() === user.email.toLowerCase())
        );
        if (found) {
          setTechProfile(found);
          const mappedSpec = TRADE_SPECIALTY_MAP[found.tradeSpecialty] || found.tradeSpecialty || 'Plumber';
          setTradeSpecialty(mappedSpec);
        }
      }
    } catch (err) {
      console.error('Failed to load technician profile details:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Full Name and Email Address are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (techProfile) {
        await technicianService.updateTechnician(techProfile.id, {
          fullName,
          email,
          ...(password.trim() ? { password } : {}),
          tradeSpecialty,
          hourlyRate: techProfile.hourlyRate,
        });
      }

      await fetchProfile();
      await fetchTechnicianDetails();

      setPassword('');
      setSuccessMessage('Profile updated successfully.');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const tradeSpecialtyName = TRADE_SPECIALTY_MAP[tradeSpecialty] || tradeSpecialty;

  const hourlyRateFormatted = techProfile?.hourlyRate
    ? parseFloat(techProfile.hourlyRate).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal profile, credentials, and trade specialty
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setIsEditing(false);
              setFullName(user?.fullName || '');
              setEmail(user?.email || '');
              setPassword('');
              if (techProfile) {
                setTradeSpecialty(TRADE_SPECIALTY_MAP[techProfile.tradeSpecialty] || techProfile.tradeSpecialty || 'Plumber');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Update Failed</p>
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981]" />
          <span className="flex-1">{successMessage}</span>
        </div>
      )}

      {/* Uniform Profile Form Card */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 space-y-6">
        {/* User Identity Header */}
        <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A] text-white font-bold text-2xl flex items-center justify-center shadow-sm shrink-0">
            {user?.fullName?.charAt(0)?.toLowerCase() || 'u'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 m-0">{user?.fullName}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#10B981]/10 text-[#10B981] font-semibold text-xs rounded-full border border-[#10B981]/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Role: {user?.role || 'Technician'}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full border border-blue-200">
                <Wrench className="w-3.5 h-3.5" />
                Trade Specialty: {tradeSpecialtyName}
              </span>
            </div>
          </div>
        </div>

        {/* Clean 2-Column Grid of Fields */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Full Name (Editable in edit mode) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border transition-all ${
                    isEditing
                      ? 'border-gray-300 bg-white focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                      : 'border-gray-200 bg-gray-50 text-gray-900 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* 2. Email Address (Editable in edit mode) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  disabled={!isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border transition-all ${
                    isEditing
                      ? 'border-gray-300 bg-white focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                      : 'border-gray-200 bg-gray-50 text-gray-900 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* 3. Password / Change Password (Editable in edit mode) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Password {isEditing && <span className="text-gray-400 lowercase font-normal">(leave blank to keep current)</span>}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  disabled={!isEditing}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditing ? 'Enter new password...' : '••••••••'}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border transition-all ${
                    isEditing
                      ? 'border-gray-300 bg-white focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]'
                      : 'border-gray-200 bg-gray-50 text-gray-900 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* 4. Trade Specialty (Editable dropdown in edit mode) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Trade Specialty
              </label>
              <div className="relative">
                <Wrench className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                {isEditing ? (
                  <select
                    value={tradeSpecialty}
                    onChange={(e) => setTradeSpecialty(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all cursor-pointer"
                  >
                    {TRADE_SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={tradeSpecialtyName}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-medium cursor-not-allowed"
                  />
                )}
              </div>
            </div>

            {/* 5. Assigned Role */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Assigned Role
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  disabled
                  value={user?.role || 'Technician'}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* 6. Hourly Rate (Rs. / hr) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Hourly Rate (Rs. / hr)
              </label>
              <div className="relative">
                <span className="text-xs font-bold text-gray-400 absolute left-3 top-3.5">Rs.</span>
                <input
                  type="text"
                  disabled
                  value={`Rs. ${hourlyRateFormatted} / hr`}
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-medium cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Save Button Bar when Editing */}
          {isEditing && (
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
