import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, Database, Key, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50/80 py-12 sm:py-16 md:py-20 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-xs mb-3">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Privacy in Plain Words</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
            Last updated: {lastUpdated} &bull; SmartSpace Platform
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-8">
          <div className="border-b border-slate-100 pb-5">
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              We value your trust and keep our privacy policy simple and clear. Here is how your data is handled when you use the SmartSpace platform.
            </p>
          </div>

          <div className="space-y-7">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60 shadow-xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed pl-12">
                    {section.content}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick Help & CTA */}
          <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/70 rounded-2xl p-5 sm:p-6 border border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                Have a Question?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Contact your building manager or email our support team at <span className="font-semibold text-blue-600">support@smartspace.io</span>.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs hover:shadow-md transition-all shrink-0 active:scale-[0.99]"
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
