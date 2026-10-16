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
    <div className="space-y-6 max-w-4xl">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <Wrench className="w-3.5 h-3.5" /> Specialist Profile
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight m-0">My Technician Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal profile, credentials, and trade specialty
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0 active:scale-[0.99]"
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="bg-rose-50/80 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Update Failed</p>
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="flex-1">{successMessage}</span>
        </div>
      )}

      {/* Uniform Profile Form Card */}
      <div className="bg-white rounded-3xl shadow-xs p-6 sm:p-8 border border-slate-200/80 space-y-6">
        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 m-0">{user?.fullName}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-200/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Role: {user?.role || 'Technician'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full border border-blue-200/80">
                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                Specialty: {tradeSpecialtyName}
              </span>
            </div>
          </div>
        </div>

        {/* Clean 2-Column Grid of Fields */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border transition-all ${
                    isEditing
                      ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* 2. Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  disabled={!isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border transition-all ${
                    isEditing
                      ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* 3. Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Password {isEditing && <span className="text-slate-400 lowercase font-normal">(leave blank to keep current)</span>}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  disabled={!isEditing}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditing ? 'Enter new password...' : '••••••••'}
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border transition-all ${
                    isEditing
                      ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 placeholder:text-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* 4. Trade Specialty */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Trade Specialty
              </label>
              <div className="relative">
                <Wrench className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                {isEditing ? (
                  <select
                    value={tradeSpecialty}
                    onChange={(e) => setTradeSpecialty(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer text-slate-900 font-medium"
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
                  />
                )}
              </div>
            </div>

            {/* 5. Assigned Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assigned Role
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  disabled
                  value={user?.role || 'Technician'}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            {/* 6. Hourly Rate (Rs. / hr) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hourly Rate (Rs. / hr)
              </label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-400 absolute left-3.5 top-3.5">Rs.</span>
                <input
                  type="text"
                  disabled
                  value={`Rs. ${hourlyRateFormatted} / hr`}
                  className="w-full pl-11 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Save Button Bar when Editing */}
          {isEditing && (
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 active:scale-[0.99]"
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
