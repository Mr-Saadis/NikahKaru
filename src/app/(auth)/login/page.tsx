'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { User, EyeOff, Eye, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirectTo = searchParams.get('redirectTo') || '/overview';
  // Sanitize redirectTo to prevent open redirect vulnerabilities
  const redirectTo =
    rawRedirectTo.startsWith('/') && !rawRedirectTo.startsWith('//') && !rawRedirectTo.includes('\\')
      ? rawRedirectTo
      : '/overview';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const sanitizedEmail = email.trim().toLowerCase();
    if (!sanitizedEmail) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // The AuthProvider will automatically pick up the session change,
      // fetch user data, and update the Zustand store.
      // We just need to redirect the user to the correct page.
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF8F5] text-[#1E2022] font-sans overflow-y-auto overflow-x-hidden relative">

      {/* ══════════════ GLOBAL CSS ANIMATIONS ══════════════ */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float  { 0%,100%{transform:translateY(0px) rotate(0deg)}  50%{transform:translateY(-18px) rotate(3deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(0px) rotate(0deg)}  50%{transform:translateY(14px)  rotate(-4deg)} }
        @keyframes glow-pulse { 0%,100%{opacity:0.10} 50%{opacity:0.18} }
        @keyframes ring-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slide-up   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

        .float-1   { animation: float        7s ease-in-out infinite; }
        .float-2   { animation: float2       9s ease-in-out infinite; }
        .glow-blob { animation: glow-pulse   4s ease-in-out infinite; }
        .ring-spin { animation: ring-spin   20s linear    infinite; }
        .slide-up  { animation: slide-up   0.6s cubic-bezier(0.16,1,0.3,1) forwards; }

        input:-webkit-autofill, input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #F2EDE1 inset !important;
          -webkit-text-fill-color: #1E2022 !important;
          caret-color: #1F3B34;
        }
      ` }} />

      {/* ══════════════ SOFT AMBIENT GLOWS ══════════════ */}
      {/* <div className="glow-blob absolute -top-1/3 -left-1/4 w-[65vw] h-[65vw] rounded-full bg-[#A3B18A]/40 blur-[180px] pointer-events-none" />
      <div className="glow-blob absolute -bottom-1/3 -right-1/4 w-[55vw] h-[55vw] rounded-full bg-[#C86A4A]/50 blur-[160px] pointer-events-none" style={{ animationDelay: '2s' }} /> */}
      <div className="absolute top-[30%] left-[35%] w-[40vw] h-[40vw] rounded-full bg-[#E9E4DC]/60 blur-[130px] pointer-events-none" />

      {/* ══════════════ LEFT HERO PANEL (warm light) ══════════════ */}
      <div className="flex w-full lg:w-[48%] xl:w-[52%] flex-col justify-center items-center lg:items-start px-6 lg:px-14 xl:px-20 py-12 lg:py-0 relative z-10 lg:pb-24 overflow-hidden text-center lg:text-left">

        {/* Subtle warm dot grid */}
        <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(circle,#D4C9B8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* Floating warm decorative shapes */}
        {/* <div className="float-1 absolute top-[8%]  right-[4%]  w-52 h-52 rounded-[44px] bg-white/60  border border-[#E9E4DC] shadow-sm rotate-12" />
        <div className="float-2 absolute bottom-[14%] right-[1%] w-32 h-32 rounded-3xl  bg-[#F2EDE1]/80 border border-[#A3B18A]/60 -rotate-6" />
        <div className="float-1 absolute bottom-[6%]  left-[4%]  w-20 h-20 rounded-2xl  bg-white/50  border border-[#E9E4DC] rotate-45" /> */}

        {/* Spinning decorative rings */}
        <div className="ring-spin absolute top-1/2 right-[-9%] -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-dashed border-[#D4C9B8]/60 pointer-events-none" />
        <div className="ring-spin absolute top-1/2 right-[-5%] -translate-y-1/2 w-[290px] h-[290px] rounded-full border border-dashed border-[#C86A4A]/30 pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '13s' }} />

        <div className="slide-up" suppressHydrationWarning>
           <Image src="/nikah_logo_full.png" alt="Logo" width={200} height={200} suppressHydrationWarning />
        </div>

        {/* Hero headline + pills */}
        <div className="space-y-7 ">
          <div className="slide-up">
            {/* <p className="text-[11px] uppercase tracking-[0.3em] text-[#C86A4A]/80 font-bold mb-5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Exclusive Access
            </p> */}
            <h2 className="text-[2.8rem] md:text-[3.2rem] lg:text-[3.6rem] xl:text-[4.2rem] font-black leading-[1.0] tracking-tight">
              <span className="text-[#1F3B34]">
                Where Families<br />Find Their<br />
              </span>
              <span className="relative inline-block">
                <span className="text-[#A3B18A]">Perfect Match.</span>
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-[#A3B18A]/70 via-[#A3B18AA]/40 to-[#A3B18A]/20 rounded-full" />
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
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-w[#FAF8F5] border border-[#E9E4DC] text-[11px] font-medium text-[#2F3E51] hover:bg-white hover:border-[#D4C9B8] hover:shadow-sm transition-all duration-300 cursor-default">
                <Icon className="w-3.5 h-3.5 text-[#C86A4A]" />
                {label}
              </div>
            ))}
          </div>
        </div>

    
      </div>

      {/* Vertical divider */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-[#DDD6CB] to-transparent my-16 flex-shrink-0 z-10" />

      {/* ══════════════ RIGHT LOGIN PANEL ══════════════ */}
      <div className="flex-1 flex justify-center items-center px-6 py-12 lg:py-0 z-10 relative">

        <div className="slide-up w-full max-w-[420px]">

          {/* Mobile layout adjustments already made in the left panel */}

          {/* ── No card — form floats directly on background ── */}
          <div>

            <div className="mb-10">
              <h2 className="text-[28px] font-bold text-[#1F3B34] mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-[13px] text-[#7D766C] font-light">Sign in to your account to continue.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-[13px] flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLogin}>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#676156] ml-1 uppercase tracking-[0.18em]">Email Address</label>
                <div className="relative group/f">
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#C86A4A]/0 to-[#C86A4A]/0 group-focus-within/f:from-[#C86A4A]/50 group-focus-within/f:to-[#C86A4A]/30 transition-all duration-500 pointer-events-none" />
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative w-full bg-white border border-[#E9E4DC] group-focus-within/f:border-[#C86A4A]/60 rounded-2xl px-5 py-[15px] pr-12 text-[14px] text-[#1E2022] placeholder-[#A8A296] focus:outline-none transition-all duration-300 shadow-[0_2px_8px_rgba(43,27,6,0.05)]"
                    placeholder="Enter your email"
                  />
                  <User className="absolute right-5 top-[18px] w-[17px] h-[17px] text-[#C4BAB0] group-focus-within/f:text-[#C86A4A] transition-colors duration-300" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#676156] ml-1 uppercase tracking-[0.18em]">Password</label>
                <div className="relative group/f">
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#C86A4A]/0 to-[#C86A4A]/0 group-focus-within/f:from-[#C86A4A]/50 group-focus-within/f:to-[#C86A4A]/30 transition-all duration-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="relative w-full bg-white border border-[#E9E4DC] group-focus-within/f:border-[#C86A4A]/60 rounded-2xl px-5 py-[15px] pr-12 text-[14px] text-[#1E2022] placeholder-[#A8A296] focus:outline-none transition-all duration-300 tracking-[0.12em] shadow-[0_2px_8px_rgba(43,27,6,0.05)]"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-[18px] text-[#C4BAB0] group-focus-within/f:text-[#C86A4A] hover:text-[#C86A4A] transition-colors duration-300">
                    {showPassword ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex justify-between items-center pt-4 px-4">
                </div>

              {/* Submit */}
              <button
                type="submit" disabled={isLoading}
                className="w-full mt-5 rounded-2xl py-[15px] text-[14px] font-bold text-white bg-[#1F3B34] shadow-[0_8px_28px_-8px_rgba(31,59,52,0.40)] hover:shadow-[0_14px_36px_-8px_rgba(31,59,52,0.55)] hover:-translate-y-[2px] active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Authenticating…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-[17px] h-[17px]" />
                      Sign In Securely
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* <div className="mt-10 pt-7 border-t border-[#E9E4DC] text-center">
              <p className="text-[12px] text-[#A8A296]">
                Need access?{' '}
                <a href="#" className="text-[#C86A4A] font-semibold hover:text-[#F2EDE1] transition-colors">Contact your administrator</a>
              </p>
            </div> */}
          </div>

          <p className="mt-14 text-center text-[12px] text-[#B0A898] tracking-wide">
            © 2026 NikahKaru · Developed by 
           <Link href="https://www.zscorelabs.com" className="font-semibold text-[#8B7D6E] hover:text-[#C86A4A]">  zscorelabs
</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#1F3B34] font-medium">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
