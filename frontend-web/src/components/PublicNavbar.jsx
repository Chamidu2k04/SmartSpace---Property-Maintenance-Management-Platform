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
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-gray-900 block leading-tight">
                Smart<span className="text-[#1E3A8A]">Space</span>
              </span>
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase block -mt-0.5">
                Property Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              type="button"
              onClick={() => handleAnchorClick('features')}
              className="text-sm font-medium text-gray-600 hover:text-[#1E3A8A] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => handleAnchorClick('solutions')}
              className="text-sm font-medium text-gray-600 hover:text-[#1E3A8A] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <Link
              to="/about"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/about'
                  ? 'text-[#1E3A8A] font-semibold'
                  : 'text-gray-600 hover:text-[#1E3A8A]'
              }`}
            >
              About Us
            </Link>
            <Link
              to="/privacy"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/privacy'
                  ? 'text-[#1E3A8A] font-semibold'
                  : 'text-gray-600 hover:text-[#1E3A8A]'
              }`}
            >
              Privacy
            </Link>
          </div>

          {/* Desktop Action (Single CTA button, removed duplicate Sign In) */}
          <div className="hidden md:flex items-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#172c6a] rounded-xl shadow-sm transition-all duration-150 hover:shadow"
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
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Responsive & Clean) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <button
            type="button"
            onClick={() => handleAnchorClick('features')}
            className="w-full text-left block px-3 py-2.5 text-base font-medium text-gray-700 hover:text-[#1E3A8A] hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => handleAnchorClick('solutions')}
            className="w-full text-left block px-3 py-2.5 text-base font-medium text-gray-700 hover:text-[#1E3A8A] hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:text-[#1E3A8A] hover:bg-gray-50 rounded-xl transition-colors"
          >
            About Us
          </Link>
          <Link
            to="/privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:text-[#1E3A8A] hover:bg-gray-50 rounded-xl transition-colors"
          >
            Privacy
          </Link>
          <div className="pt-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#172c6a] rounded-xl shadow-sm transition-all"
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
