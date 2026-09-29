import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Ticket,
  Boxes,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  Wrench,
  ShieldCheck,
  Zap,
  Camera,
  Calendar,
  ThumbsUp
} from 'lucide-react';

export default function LandingPage() {
  const highlights = [
    { value: 'Faster Repairs', label: 'Requests get assigned in minutes' },
    { value: 'Real-Time Updates', label: 'Always know when help is on the way' },
    { value: 'Zero Confusion', label: 'All your building info in one place' },
    { value: 'Ready for Any Device', label: 'Works on your phone, tablet, or laptop' },
  ];

  const features = [
    {
      icon: Sparkles,
      title: 'Smart Repair Scheduling',
      description:
        'Our smart system reads your issue, checks which technician has the right tools and skills, and sets up a repair time automatically.',
      badge: 'Smart & Fast',
      badgeColor: 'bg-indigo-50 text-[#1E3A8A]',
      iconBg: 'bg-indigo-50 text-[#1E3A8A]',
    },
    {
      icon: Ticket,
      title: 'Quick Ticket Reporting',
      description:
        'Something leaking or broken? Just take a quick photo, write a brief note, and submit it in seconds. You can track every step live.',
      badge: 'Easy to Use',
      badgeColor: 'bg-emerald-50 text-[#10B981]',
      iconBg: 'bg-emerald-50 text-[#10B981]',
    },
    {
      icon: Boxes,
      title: 'Spare Parts on Hand',
      description:
        'Technicians always know if the replacement parts are ready in the store room before heading over, so your repairs are done on the first visit.',
      badge: 'No Delays',
      badgeColor: 'bg-indigo-50 text-[#1E3A8A]',
      iconBg: 'bg-indigo-50 text-[#1E3A8A]',
    },
  ];

  const steps = [
    {
      step: '1',
      title: 'Report What Happened',
      desc: 'Snap a picture and describe the problem in a few clicks.',
      icon: Camera,
    },
    {
      step: '2',
      title: 'Smart Matching',
      desc: 'The system matches the right technician and checks parts in stock.',
      icon: Calendar,
    },
    {
      step: '3',
      title: 'Fixed & Done',
      desc: 'The technician completes the job and you get a confirmation right away.',
      icon: ThumbsUp,
    },
  ];

  const roles = [
    {
      role: 'Tenants & Residents',
      icon: Users,
      headline: 'Quick Help for Your Home',
      desc: 'Report broken fixtures, see technician updates in real time, and enjoy a hassle-free living space.',
    },
    {
      role: 'Property Managers',
      icon: Building2,
      headline: 'Simple Building Oversight',
      desc: 'Review incoming requests, approve repairs, and keep your properties running smoothly without endless phone calls.',
    },
    {
      role: 'Service Technicians',
      icon: Wrench,
      headline: 'Clear Daily Schedules',
      desc: 'See which jobs are assigned to you today, pick up needed parts, and update job progress with one tap.',
    },
    {
      role: 'Inventory Officers',
      icon: Boxes,
      headline: 'Easy Stock Control',
      desc: 'Keep track of bulbs, pipes, filters, and spare parts so you never run out when someone needs a repair.',
    },
  ];

  return (
    <div className="bg-[#f8fafc] text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
        {/* Modern Ambient Mesh Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/60 via-indigo-50/40 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Friendly pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs mb-6 hover:border-slate-300 transition-colors">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Smart & Simple Property Living</span>
              <span className="text-slate-300">|</span>
              <span className="text-blue-600 flex items-center gap-1 font-bold">
                AI Powered <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-[1.12]">
              Smarter Property Management{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block sm:inline">
                with AI
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              A friendly, all-in-one place to report maintenance issues, book repairs, manage spare parts, and keep your building running smoothly.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/25 transition-all duration-150 hover:shadow-lg hover:shadow-blue-600/35 hover:-translate-y-0.5 group cursor-pointer"
              >
                <span>Access Platform</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                See Features
              </a>
            </div>

            {/* Trust points */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Easy to Use</span>
              </div>
              <span className="hidden sm:inline text-slate-300">&bull;</span>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Instant Ticket Tracking</span>
              </div>
              <span className="hidden sm:inline text-slate-300">&bull;</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Safe & Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Bar */}
      <section className="border-y border-slate-200/80 bg-white py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {highlights.map((h, i) => (
              <div key={i} className="p-3">
                <div className="text-xl sm:text-2xl font-extrabold text-blue-900 tracking-tight">
                  {h.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  {h.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 mb-2">
              What SmartSpace Does
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              Built to Make Building Care Effortless
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Say goodbye to lost paper notes and unanswered phone calls. SmartSpace connects everyone in one simple dashboard.
            </p>
          </div>

          {/* 3-Column Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 p-7 sm:p-8 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200 ${feature.iconBg}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${feature.badgeColor}`}
                      >
                        {feature.badge}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600">
                    <Link to="/login" className="inline-flex items-center gap-1 hover:text-blue-800">
                      <span>Try it in your dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works: 3 Simple Steps */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 mb-2">
              Simple Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              How Repairs Get Fixed
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {steps.map((item, idx) => {
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs flex flex-col items-center hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-4 font-extrabold text-lg shadow-xs">
                    {item.step}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who It's For / Solutions */}
      <section id="solutions" className="py-16 sm:py-24 bg-white border-t border-slate-200/80 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 mb-2">
              Made for Everyone
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              Tailored For How You Use It
            </h2>
            <p className="mt-2.5 text-slate-600 text-sm sm:text-base leading-relaxed">
              Whether you live in a building or look after one, SmartSpace gives you the exact tools you need.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                      {item.role}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">
                      {item.headline}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      to="/login"
                      className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <span>Log in to portal</span>
                      <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pre-Footer Callout Card */}
      <section className="py-14 sm:py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-700/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Get Started?
            </h2>
            <p className="mt-3 text-blue-200 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Sign in with your email to view your units, submit a new repair request, or manage maintenance tasks.
            </p>
            <div className="mt-7 flex justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Access Platform</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
