'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { ShieldCheck, Sparkles, Heart } from 'lucide-react';
import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm';

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF8F5] text-[#1E2022] font-sans overflow-y-auto overflow-x-hidden relative">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes ring-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            @keyframes slide-up   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
            .ring-spin { animation: ring-spin 20s linear infinite; }
            .slide-up  { animation: slide-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
            input:-webkit-autofill, input:-webkit-autofill:focus {
              -webkit-box-shadow: 0 0 0 1000px #F2EDE1 inset !important;
              -webkit-text-fill-color: #1E2022 !important;
              caret-color: #1F3B34;
            }
          `,
        }}
      />

      <div className="absolute top-[30%] left-[35%] w-[40vw] h-[40vw] rounded-full bg-[#E9E4DC]/60 blur-[130px] pointer-events-none" />

      {/* Left Hero Panel (Matches Login UI) */}
      <div className="flex w-full lg:w-[48%] xl:w-[52%] flex-col justify-center items-center lg:items-start px-6 lg:px-14 xl:px-20 py-12 lg:py-0 relative z-10 lg:pb-24 overflow-hidden text-center lg:text-left">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(circle,#D4C9B8 1px,transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="ring-spin absolute top-1/2 right-[-9%] -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-dashed border-[#D4C9B8]/60 pointer-events-none" />
        <div
          className="ring-spin absolute top-1/2 right-[-5%] -translate-y-1/2 w-[290px] h-[290px] rounded-full border border-dashed border-[#C86A4A]/30 pointer-events-none"
          style={{ animationDirection: 'reverse', animationDuration: '13s' }}
        />

        <div className="slide-up" suppressHydrationWarning>
          <Image src="/nikah_logo_full.png" alt="NikahKaru Logo" width={200} height={200} suppressHydrationWarning />
        </div>

        <div className="space-y-7">
          <div className="slide-up">
            <h2 className="text-[2.8rem] md:text-[3.2rem] lg:text-[3.6rem] xl:text-[4.2rem] font-black leading-[1.0] tracking-tight">
              <span className="text-[#1F3B34]">
                Where Families<br />Find Their<br />
              </span>
              <span className="relative inline-block">
                <span className="text-[#A3B18A]">Perfect Match.</span>
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#A3B18A]/50 rounded-full" />
              </span>
            </h2>
          </div>

          <p className="text-[15px] text-[#7C756B] max-w-sm mx-auto lg:mx-0 leading-relaxed font-light">
            The most trusted and secure internal matchmaking platform for agents and managers.
          </p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-3">
            {[
              { icon: ShieldCheck, label: 'End-to-End Encrypted' },
              { icon: Heart, label: 'Smart Match Engine' },
              { icon: Sparkles, label: 'Role-Based Access' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF8F5] border border-[#E9E4DC] text-[11px] font-medium text-[#2F3E51] hover:bg-white hover:border-[#D4C9B8] hover:shadow-sm transition-all duration-300 cursor-default"
              >
                <Icon className="w-3.5 h-3.5 text-[#C86A4A]" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="hidden lg:block w-px bg-[#DDD6CB] my-16 flex-shrink-0 z-10" />

      {/* Right Recovery Panel */}
      <div className="flex-1 flex justify-center items-center px-6 py-12 lg:py-0 z-10 relative">
        <Suspense fallback={<div className="text-[#1F3B34] font-medium">Loading...</div>}>
          <UpdatePasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

