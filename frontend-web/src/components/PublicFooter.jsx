import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="sm:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                  Smart<span className="text-[#1E3A8A]">Space</span>
                </span>
                <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase block -mt-0.5">
                  Property Platform
                </span>
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md leading-relaxed">
              A simple platform for residents, property managers, and technicians to report maintenance issues, book repairs, and track spare parts together.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-[11px] font-medium text-[#10B981] border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure Data Protection
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-[11px] font-medium text-[#1E3A8A] border border-indigo-100">
                <Lock className="w-3.5 h-3.5" />
                Safe & Private
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              Explore
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="/#features" className="text-gray-600 hover:text-[#1E3A8A] transition-colors">
                  Key Features
                </a>
              </li>
              <li>
                <a href="/#solutions" className="text-gray-600 hover:text-[#1E3A8A] transition-colors">
                  Who It Is For
                </a>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-[#1E3A8A] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-600 hover:text-[#1E3A8A] transition-colors">
                  Access Platform
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Terms */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              Information
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-[#1E3A8A] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <span className="text-gray-500 text-xs block leading-relaxed">
                  Fast support for tenants, property managers, and technicians.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>
            &copy; {currentYear} SmartSpace. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-[#1E3A8A] transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link to="/about" className="hover:text-[#1E3A8A] transition-colors">
              About
            </Link>
            <span>&bull;</span>
            <Link to="/login" className="hover:text-[#1E3A8A] transition-colors">
              Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
