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
  Layers
} from 'lucide-react';

export default function AboutUs() {
  const points = [
    {
      title: 'Easy for Residents',
      desc: 'No more confusing paperwork or waiting on hold. Snap a picture of what needs fixing and track it on your phone or laptop.',
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
    <div className="bg-[#F3F4F6] py-12 sm:py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm mb-4">
            <Building2 className="w-4 h-4 text-[#1E3A8A]" />
            <span>About SmartSpace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Making Property Living <span className="text-[#1E3A8A]">Simple</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
            We built SmartSpace to take the stress out of building maintenance and help tenants, managers, and technicians stay connected.
          </p>
        </div>

        {/* Story / Problem */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              Our Goal
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              Why We Created This Platform
            </h2>
          </div>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            Have you ever tried getting something fixed in an apartment, only to get stuck making multiple phone calls, sending emails back and forth, or waiting days just for someone to inspect it?
          </p>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            SmartSpace fixes that. It brings reporting issues, scheduling technicians, and checking spare parts into one easy-to-use web app. When a tenant reports a problem, the right person is assigned immediately, the required parts are reserved, and everyone knows when the job is done.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {points.map((pt, idx) => {
              const Icon = pt.icon;
              return (
                <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#1E3A8A] flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">
                    {pt.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How We Keep It Reliable */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 shadow-sm space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
            Reliability & Trust
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Fast, Simple, and Secure
          </h2>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            SmartSpace is designed to be lightweight and fast on any device. Your personal information and account details are safely encrypted, and each person only sees what they need to do their job.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-gray-600">
            <span className="flex items-center gap-1.5 bg-emerald-50 text-[#10B981] px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Secure Login Protection
            </span>
            <span className="flex items-center gap-1.5 bg-indigo-50 text-[#1E3A8A] px-3 py-1.5 rounded-lg border border-indigo-100 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Real-Time Updates
            </span>
            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Mobile Friendly
            </span>
          </div>
        </div>

        {/* Friendly CTA Box */}
        <div className="bg-[#1E3A8A] text-white rounded-2xl p-6 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-xl font-bold">Ready to see your dashboard?</h3>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-md">
              Sign in to manage your tickets, inspect assigned jobs, or browse inventory.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#1E3A8A] bg-white hover:bg-gray-100 rounded-xl shadow-sm transition-all shrink-0"
          >
            <span>Access Platform</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
