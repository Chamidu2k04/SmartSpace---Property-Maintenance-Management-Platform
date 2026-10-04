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
import smartSpaceBuilding from '../assets/smart-space-building.jpg';

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
      badgeColor: 'bg-blue-950/60 text-cyan-300 border border-blue-500/30',
      iconBg: 'bg-blue-950/70 text-cyan-400 border border-blue-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
    },
    {
      icon: Ticket,
      title: 'Quick Ticket Reporting',
      description:
        'Something leaking or broken? Just take a quick photo, write a brief note, and submit it in seconds. You can track every step live.',
      badge: 'Easy to Use',
      badgeColor: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30',
      iconBg: 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    },
    {
      icon: Boxes,
      title: 'Spare Parts on Hand',
      description:
        'Technicians always know if the replacement parts are ready in the store room before heading over, so your repairs are done on the first visit.',
      badge: 'No Delays',
      badgeColor: 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/30',
      iconBg: 'bg-indigo-950/70 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]',
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
    <div className="bg-[#050811] text-slate-100 selection:bg-cyan-500 selection:text-black overflow-hidden relative min-h-screen">
      {/* Fixed Full-Bleed Scrolling Architectural Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={smartSpaceBuilding}
          alt="Smart Space Building"
          className="w-full h-full object-cover object-center opacity-65 filter contrast-125 brightness-110"
        />
        {/* Balanced dark overlay ensuring 100% text readability while keeping the building and neon sign vibrant */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050811]/70 via-[#050811]/60 to-[#050811]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#050811_85%)]" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36">
        {/* Subtle Architectural Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Friendly pill badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-300 shadow-[0_0_25px_rgba(0,0,0,0.6)] mb-8 transition-all duration-300 backdrop-blur-xl group hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              <span>Smart & Simple Property Living</span>
              <span className="text-slate-700">|</span>
              <span className="text-cyan-400 flex items-center gap-1.5 font-bold group-hover:text-cyan-300 transition-colors">
                AI Powered <Sparkles className="w-3.5 h-3.5 text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] drop-shadow-sm">
              Smarter Property Management{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent block sm:inline drop-shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                with AI
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300/90 leading-relaxed max-w-2xl mx-auto font-normal">
              A friendly, all-in-one place to report maintenance issues, book repairs, manage spare parts, and keep your building running smoothly.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:to-cyan-400 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_45px_rgba(6,182,212,0.65)] border border-cyan-400/40 transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
              >
                <span>Access Platform</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800/90 hover:text-white border border-slate-700/80 hover:border-cyan-500/50 rounded-2xl shadow-lg backdrop-blur-xl transition-all duration-200 cursor-pointer"
              >
                See Features
              </a>
            </div>

            {/* Trust points */}
            <div className="mt-12 inline-flex flex-wrap items-center justify-center gap-4 sm:gap-8 px-6 py-2.5 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl text-xs sm:text-sm font-medium text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                <span>Easy to Use</span>
              </div>
              <span className="hidden sm:inline text-slate-700">&bull;</span>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]" />
                <span>Instant Ticket Tracking</span>
              </div>
              <span className="hidden sm:inline text-slate-700">&bull;</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.7)]" />
                <span>Safe & Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Bar / Telemetry Dock */}
      <section className="relative z-10 border-y border-slate-800/80 bg-[#080d1c]/80 backdrop-blur-xl py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {highlights.map((h, i) => (
              <div key={i} className="p-4 relative group">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover:text-cyan-300 transition-colors">
                  {h.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-400 mt-2 font-medium leading-relaxed">
                  {h.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 sm:py-28 bg-transparent scroll-mt-16">
        {/* Subtle background ambient spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[28rem] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/60 px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              What SmartSpace Does
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mt-3">
              Built to Make Building Care Effortless
            </h2>
            <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
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
                  className="bg-slate-900/60 rounded-3xl border border-slate-800/90 p-8 sm:p-9 backdrop-blur-2xl shadow-xl hover:border-cyan-500/50 hover:shadow-[0_20px_50px_-15px_rgba(6,182,212,0.25)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle top sheen on hover */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-2 ${feature.iconBg}`}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full ${feature.badgeColor}`}
                      >
                        {feature.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-200 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center text-xs font-bold text-cyan-400">
                    <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors group-hover:translate-x-1 duration-200">
                      <span>Try it in your dashboard</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works: 3 Simple Steps */}
      <section className="relative z-10 py-20 sm:py-28 bg-[#070b16]/75 backdrop-blur-md border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14 sm:mb-18">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-4 py-1.5 rounded-full border border-blue-500/30 mb-3 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mt-2">
              How Repairs Get Fixed
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative">
            {/* Desktop Connected Workflow Timeline Rail */}
            <div className="hidden md:block absolute top-14 left-20 right-20 h-[2px] bg-gradient-to-r from-blue-600/40 via-cyan-500/60 to-emerald-500/40 -z-0 pointer-events-none" />

            {steps.map((item, idx) => {
              return (
                <div
                  key={idx}
                  className="bg-slate-900/60 rounded-3xl p-8 sm:p-9 border border-slate-800/90 shadow-xl backdrop-blur-2xl flex flex-col items-center hover:border-cyan-500/50 hover:shadow-[0_15px_40px_-10px_rgba(6,182,212,0.25)] hover:-translate-y-1.5 transition-all duration-300 relative z-10 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0c162f] to-[#070d1e] text-cyan-300 border border-cyan-500/40 flex items-center justify-center mb-5 font-black text-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:scale-110 group-hover:border-cyan-400 transition-all">
                    {item.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who It's For / Solutions */}
      <section id="solutions" className="relative z-10 py-20 sm:py-28 bg-transparent border-t border-slate-800/80 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-4 py-1.5 rounded-full border border-emerald-500/30 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              Made for Everyone
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mt-2">
              Tailored For How You Use It
            </h2>
            <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
              Whether you live in a building or look after one, SmartSpace gives you the exact tools you need.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            {roles.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-900/60 rounded-3xl p-7 sm:p-8 border border-slate-800/90 shadow-xl hover:border-cyan-500/50 hover:shadow-[0_20px_45px_-12px_rgba(6,182,212,0.25)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group backdrop-blur-2xl relative overflow-hidden"
                >
                  {/* Subtle top sheen on hover */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/90 text-cyan-400 border border-slate-700/60 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:border-cyan-500/50 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-wider block mb-1">
                      {item.role}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                      {item.headline}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-5 border-t border-slate-800/80">
                    <Link
                      to="/login"
                      className="inline-flex items-center text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors group-hover:translate-x-1 duration-200"
                    >
                      <span>Log in to portal</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pre-Footer Callout Card */}
      <section className="relative z-10 py-16 sm:py-24 bg-[#070b16]/75 backdrop-blur-md border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-[#0d1733] via-[#091225] to-[#050914] text-white rounded-3xl p-10 sm:p-14 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] border border-cyan-500/30 relative overflow-hidden backdrop-blur-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Sign in with your email to view your units, submit a new repair request, or manage maintenance tasks.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl text-base font-bold bg-white text-slate-950 hover:bg-slate-100 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] transition-all duration-200 hover:-translate-y-1 cursor-pointer"
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
