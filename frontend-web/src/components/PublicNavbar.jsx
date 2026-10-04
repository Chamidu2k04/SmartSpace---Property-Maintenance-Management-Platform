import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Menu, X, ArrowRight } from 'lucide-react';

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';

  const handleAnchorClick = (anchorId) => {
    setMobileMenuOpen(false);
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
    <nav className="sticky top-0 z-50 bg-[#080d1a]/85 backdrop-blur-xl border-b border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.35)] border border-blue-400/30 transition-transform duration-200 group-hover:scale-105">
              <Building2 className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block leading-tight">
                Smart<span className="text-cyan-400">Space</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block -mt-0.5">
                Property Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              type="button"
              onClick={() => handleAnchorClick('features')}
              className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => handleAnchorClick('solutions')}
              className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <Link
              to="/about"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/about'
                  ? 'text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-300 hover:text-cyan-400'
              }`}
            >
              About Us
            </Link>
            <Link
              to="/privacy"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/privacy'
                  ? 'text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-300 hover:text-cyan-400'
              }`}
            >
              Privacy
            </Link>
          </div>

          {/* Desktop Action (Single CTA button, removed duplicate Sign In) */}
          <div className="hidden md:flex items-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_28px_rgba(6,182,212,0.5)] border border-cyan-400/30 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Access Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Responsive & Clean) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-[#080d1a]/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2 shadow-2xl">
          <button
            type="button"
            onClick={() => handleAnchorClick('features')}
            className="w-full text-left block px-3 py-2.5 text-base font-medium text-slate-200 hover:text-cyan-400 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => handleAnchorClick('solutions')}
            className="w-full text-left block px-3 py-2.5 text-base font-medium text-slate-200 hover:text-cyan-400 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 text-base font-medium text-slate-200 hover:text-cyan-400 hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            About Us
          </Link>
          <Link
            to="/privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 text-base font-medium text-slate-200 hover:text-cyan-400 hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            Privacy
          </Link>
          <div className="pt-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-xl shadow-lg border border-cyan-400/30 transition-all"
            >
              <span>Access Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
