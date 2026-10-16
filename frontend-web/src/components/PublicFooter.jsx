import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const handleAnchorClick = (anchorId) => {
    if (isHome) {
      const el = document.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/#${anchorId}`);
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <footer className="bg-[#03050a] border-t border-slate-800/80 mt-auto relative overflow-hidden">
      {/* Top subtle cyan accent rail */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="sm:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.35)] border border-blue-400/30 transition-transform duration-200 group-hover:scale-105">
                <Building2 className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">
                  Smart<span className="text-cyan-400">Space</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block -mt-0.5">
                  Property Platform
                </span>
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
              A simple platform for residents, property managers, and technicians to report maintenance issues, book repairs, and track spare parts together.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 text-[11px] font-medium text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure Data Protection
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/40 text-[11px] font-medium text-cyan-300 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]">
                <Lock className="w-3.5 h-3.5" />
                Safe & Private
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Explore
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => handleAnchorClick('features')}
                  className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  Key Features
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleAnchorClick('solutions')}
                  className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer text-left"
                >
                  Who It Is For
                </button>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Access Platform
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Terms */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Information
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <span className="text-slate-400 text-xs block leading-relaxed">
                  Fast support for tenants, property managers, and technicians.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
          <p>
            &copy; {currentYear} SmartSpace. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link to="/about" className="hover:text-cyan-400 transition-colors">
              About
            </Link>
            <span>&bull;</span>
            <Link to="/login" className="hover:text-cyan-400 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
