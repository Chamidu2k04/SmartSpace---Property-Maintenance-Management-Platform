import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  Shield,
  Smartphone,
  Sparkles,
  HeartHandshake,
  Clock,
  Layers,
  Sparkle
} from 'lucide-react';

export default function AboutUs() {
  const points = [
    {
      title: 'Easy for Residents',
      desc: 'No more confusing paperwork or waiting on hold. Snap a picture of what needs fixing and track it in real time on your phone or laptop.',
      icon: Smartphone,
    },
    {
      title: 'Smarter Scheduling',
      desc: 'Our AI looks at technician availability and skills so repairs are scheduled without delay.',
      icon: Sparkles,
    },
    {
      title: 'Parts Ready Ahead of Time',
      desc: 'We connect repairs with our spare parts inventory so technicians have the right materials ready before they arrive.',
      icon: Layers,
    },
    {
      title: 'Clear Communication',
      desc: 'Everyone stays on the same page with automatic updates and status badges at each step.',
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 py-12 sm:py-16 md:py-20 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-xs mb-4">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>About SmartSpace Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Making Property Living <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Simple</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            We built SmartSpace to take the stress out of building maintenance and help tenants, managers, and technicians stay seamlessly synchronized.
          </p>
        </div>

        {/* Story / Problem */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Our Vision
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Why We Created This Platform
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Have you ever tried getting something fixed in an apartment, only to get stuck making multiple phone calls, sending emails back and forth, or waiting days just for someone to inspect it?
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            SmartSpace fixes that. It brings reporting issues, scheduling technicians, and checking spare parts into one unified web app. When a tenant reports a problem, the right person is assigned immediately, the required parts are reserved, and everyone knows when the job is done.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {points.map((pt, idx) => {
              const Icon = pt.icon;
              return (
                <div key={idx} className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/60 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100/60 shadow-xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                    {pt.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How We Keep It Reliable */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Reliability & Trust
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Fast, Simple, and Secure
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            SmartSpace is engineered to be lightweight, responsive, and blazing-fast on any device. Your personal information and account details are safely encrypted, and each user only accesses the data strictly necessary for their role.
          </p>
          <div className="pt-3 flex flex-wrap gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full border border-emerald-200/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Secure Login Protection
            </span>
            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full border border-blue-200/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Real-Time Updates
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-full border border-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              Mobile Friendly
            </span>
          </div>
        </div>

        {/* Friendly CTA Box */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Ready to see your dashboard?</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
              Sign in to manage your tickets, inspect assigned jobs, or browse inventory.
            </p>
          </div>
          <Link
            to="/login"
            className="relative z-10 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-xs hover:shadow-md transition-all shrink-0 active:scale-[0.99]"
          >
            <span>Access Platform</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
