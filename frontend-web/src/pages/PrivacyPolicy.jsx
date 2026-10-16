import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, Database, Key, ArrowRight } from 'lucide-react';
import smartSpaceBuilding from '../assets/smart-space-building.jpg';

export default function PrivacyPolicy() {
  const lastUpdated = 'September 2026';

  const sections = [
    {
      icon: Shield,
      title: '1. Our Privacy Promise',
      content:
        'Your privacy is important to us. SmartSpace is designed to help you manage maintenance and property requests without worrying about your personal information. This page explains what details we collect, why we need them, and how we keep them secure.',
    },
    {
      icon: Database,
      title: '2. What Information We Need',
      content:
        'To make sure repairs are sent to the right place and handled quickly, we collect: (a) Your name, email, and password so you can sign in; (b) Your building or unit number so technicians know where to go; (c) Any maintenance issue description and photos you choose to upload; and (d) Records of parts used to fix the problem.',
    },
    {
      icon: Key,
      title: '3. Who Can See Your Information',
      content:
        'We believe in strict boundaries. Residents only see their own requests and status. Technicians only see the jobs currently assigned to them. Property managers see building-wide updates to make sure everything gets approved on time.',
    },
    {
      icon: Lock,
      title: '4. How We Protect Your Account',
      content:
        'All passwords and sensitive details are encrypted so nobody else can read them. Our connections use secure HTTPS encryption to protect your data whenever you submit a ticket or log in.',
    },
    {
      icon: FileText,
      title: '5. No Unwanted Ads or Tracking',
      content:
        'We only use browser storage to remember that you are logged in. We do not sell your personal details, and we do not use third-party advertising cookies to track you across other websites.',
    },
    {
      icon: Eye,
      title: '6. Questions & Control',
      content:
        'If you ever want to update your profile information or have questions about how your account works, you can reach out to your property administrator or contact our support team anytime.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 py-16 sm:py-20 md:py-24 relative overflow-hidden">
      {/* Fixed Full-Bleed Scrolling Architectural Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={smartSpaceBuilding}
          alt="Smart Space Building"
          className="w-full h-full object-cover object-center opacity-35 filter contrast-125 brightness-100"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050811]/85 via-[#050811]/80 to-[#050811]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#050811_90%)]" />
      </div>

      {/* Subtle Architectural Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Background Ambient Mesh Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[32rem] bg-gradient-to-b from-emerald-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-xs font-semibold text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] mb-4 backdrop-blur-xl">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy in Plain Words</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-3 font-medium">
            Last updated: {lastUpdated} &bull; SmartSpace Platform
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

          <div className="border-b border-slate-800/80 pb-5">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              We value your trust and keep our privacy policy simple and clear. Here is how your data is handled when you use the SmartSpace platform.
            </p>
          </div>

          <div className="space-y-7">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div key={idx} className="space-y-2 group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800/80 text-cyan-400 flex items-center justify-center shrink-0 border border-slate-700/60 shadow-[0_0_12px_rgba(6,182,212,0.15)] group-hover:scale-105 group-hover:border-cyan-500/50 transition-all">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white m-0 group-hover:text-cyan-200 transition-colors">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed pl-12">
                    {section.content}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick Help & CTA */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 bg-[#091122]/70 rounded-2xl p-5 sm:p-6 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                Have a Question?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Contact your building manager or email our support team at <span className="font-semibold text-cyan-400">support@smartspace.io</span>.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-400/30 transition-all shrink-0 active:scale-[0.99] cursor-pointer"
            >
              <span>Back to Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
