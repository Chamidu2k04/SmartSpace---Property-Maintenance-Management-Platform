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
import smartSpaceBuilding from '../assets/smart-space-building.jpg';

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
    <div className="min-h-screen bg-[#050811] text-slate-100 py-16 sm:py-20 md:py-24 relative overflow-hidden">
      {/* Fixed Full-Bleed Scrolling Architectural Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={smartSpaceBuilding}
          alt="Smart Space Building"
          className="w-full h-full object-cover object-center opacity-40 filter contrast-125 brightness-100"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050811]/85 via-[#050811]/80 to-[#050811]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#050811_90%)]" />
      </div>

      {/* Subtle Architectural Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Background Ambient Mesh Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[32rem] bg-gradient-to-b from-blue-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-cyan-300 shadow-[0_0_20px_rgba(0,0,0,0.6)] mb-5 backdrop-blur-xl">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>About SmartSpace Platform</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Making Property Living <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">Simple</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-300/90 leading-relaxed">
            We built SmartSpace to take the stress out of building maintenance and help tenants, managers, and technicians stay seamlessly synchronized.
          </p>
        </div>

        {/* Story / Problem */}
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-500/30">
              Our Vision
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-3">
              Why We Created This Platform
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Have you ever tried getting something fixed in an apartment, only to get stuck making multiple phone calls, sending emails back and forth, or waiting days just for someone to inspect it?
          </p>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            SmartSpace fixes that. It brings reporting issues, scheduling technicians, and checking spare parts into one unified web app. When a tenant reports a problem, the right person is assigned immediately, the required parts are reserved, and everyone knows when the job is done.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {points.map((pt, idx) => {
              const Icon = pt.icon;
              return (
                <div key={idx} className="bg-[#091122]/70 rounded-2xl p-5 border border-slate-800/80 hover:border-cyan-500/40 hover:shadow-[0_8px_30px_-5px_rgba(6,182,212,0.15)] transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 text-cyan-400 flex items-center justify-center mb-3 border border-slate-700/60 shadow-[0_0_12px_rgba(6,182,212,0.15)] group-hover:scale-105 group-hover:border-cyan-500/50 transition-all">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1.5 group-hover:text-cyan-200 transition-colors">
                    {pt.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How We Keep It Reliable */}
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-500/30">
            Reliability & Trust
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">
            Fast, Simple, and Secure
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            SmartSpace is engineered to be lightweight, responsive, and blazing-fast on any device. Your personal information and account details are safely encrypted, and each user only accesses the data strictly necessary for their role.
          </p>
          <div className="pt-3 flex flex-wrap gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 bg-emerald-950/40 text-emerald-300 px-3.5 py-1.5 rounded-full border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Secure Login Protection
            </span>
            <span className="flex items-center gap-1.5 bg-blue-950/40 text-cyan-300 px-3.5 py-1.5 rounded-full border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Real-Time Updates
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800/80 text-slate-300 px-3.5 py-1.5 rounded-full border border-slate-700/70">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              Mobile Friendly
            </span>
          </div>
        </div>

        {/* Friendly CTA Box */}
        <div className="bg-gradient-to-br from-[#0c1630] via-[#091124] to-[#050811] text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/15 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Ready to see your dashboard?</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
              Sign in to manage your tickets, inspect assigned jobs, or browse inventory.
            </p>
          </div>
          <Link
            to="/login"
            className="relative z-10 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all shrink-0 active:scale-[0.99] cursor-pointer"
          >
            <span>Access Platform</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
