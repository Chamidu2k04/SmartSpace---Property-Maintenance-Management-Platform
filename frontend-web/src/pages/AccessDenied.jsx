import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * AccessDenied — Displayed when a logged-in user's role does not have
 * permission to view the requested page (e.g. Tenant accessing /maintenance).
 *
 * NOTE: Do NOT modify this file without coordinating with Member 2.
 */
export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-red-500" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>

      {/* Description */}
      <p className="text-gray-500 max-w-md mb-6">
        You do not have permission to access this page. This area is restricted
        to Property Managers only.
      </p>

      {/* Go Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Go Back
      </button>
    </div>
  );
}
