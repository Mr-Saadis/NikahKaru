'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { User, EyeOff, Eye, ShieldCheck, Sparkles, Heart } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/overview';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F4EFE7] text-[#1E2022] font-sans overflow-hidden relative">

      {/* ══════════════ GLOBAL CSS ANIMATIONS ══════════════ */}
      <style dangerouslySetInnerHTML={{ __html: `
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
          -webkit-box-shadow: 0 0 0 1000px #FDFAF5 inset !important;
          -webkit-text-fill-color: #1E2022 !important;
          caret-color: #064e3b;
        }
      ` }} />

      {/* ══════════════ SOFT AMBIENT GLOWS ══════════════ */}
      <div className="glow-blob absolute -top-1/3 -left-1/4 w-[65vw] h-[65vw] rounded-full bg-amber-200/40 blur-[180px] pointer-events-none" />
      <div className="glow-blob absolute -bottom-1/3 -right-1/4 w-[55vw] h-[55vw] rounded-full bg-amber-100/50 blur-[160px] pointer-events-none" style={{animationDelay:'2s'}} />
      <div className="absolute top-[30%] left-[35%] w-[40vw] h-[40vw] rounded-full bg-[#E9E4DC]/60 blur-[130px] pointer-events-none" />

      {/* ══════════════ LEFT HERO PANEL (warm light) ══════════════ */}
      <div className="hidden lg:flex w-[48%] xl:w-[52%] flex-col justify-between px-14 xl:px-20 py-16 relative z-10 overflow-hidden">

        {/* Subtle warm dot grid */}
        <div className="absolute inset-0 opacity-[0.35]" style={{backgroundImage:'radial-gradient(circle,#D4C9B8 1px,transparent 1px)',backgroundSize:'28px 28px'}} />

        {/* Floating warm decorative shapes */}
        <div className="float-1 absolute top-[8%]  right-[4%]  w-52 h-52 rounded-[44px] bg-white/60  border border-[#E9E4DC] shadow-sm rotate-12" />
        <div className="float-2 absolute bottom-[14%] right-[1%] w-32 h-32 rounded-3xl  bg-[#FDF0D8]/80 border border-[#F6E1BA]/60 -rotate-6" />
        <div className="float-1 absolute bottom-[6%]  left-[4%]  w-20 h-20 rounded-2xl  bg-white/50  border border-[#E9E4DC] rotate-45" />

        {/* Spinning decorative rings */}
        <div className="ring-spin absolute top-1/2 right-[-9%] -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-dashed border-[#D4C9B8]/60 pointer-events-none" />
        <div className="ring-spin absolute top-1/2 right-[-5%] -translate-y-1/2 w-[290px] h-[290px] rounded-full border border-dashed border-[#F5C770]/30 pointer-events-none" style={{animationDirection:'reverse',animationDuration:'13s'}} />

        {/* Logo */}
        <div className="slide-up flex items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F5C770] to-[#c69a2a] blur-md opacity-40" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5C770] to-[#c69a2a] flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-[#5C3D00] fill-[#5C3D00]" />
            </div>
          </div>
          <div>
            <span className="text-[22px] font-black tracking-[0.18em] text-[#002b17]">NIKAAHKARO</span>
            <p className="text-[8px] uppercase tracking-[0.35em] text-[#8B6122] font-bold mt-0.5">CRM · Internal Portal</p>
          </div>
        </div>

        {/* Hero headline + pills */}
        <div className="space-y-7">
          <div className="slide-up">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#8B6122]/80 font-bold mb-5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Exclusive Access
            </p>
            <h2 className="text-[3.6rem] xl:text-[4.2rem] font-black leading-[1.0] tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#002b17] via-[#16382E] to-[#4E473D]">
                Where Families<br />Find Their<br />
              </span>
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5C770] to-[#c69a2a]">Perfect Match.</span>
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-[#F5C770]/70 via-[#F5C770]/40 to-transparent rounded-full" />
              </span>
            </h2>
          </div>

          <p className="text-[15px] text-[#7C756B] max-w-sm leading-relaxed font-light">
            The most trusted and secure internal matchmaking platform for agents and managers.
          </p>

          <div className="flex flex-wrap gap-3">
            {[
              { icon: ShieldCheck, label: 'End-to-End Encrypted' },
              { icon: Heart,        label: 'Smart Match Engine'  },
              { icon: Sparkles,     label: 'Role-Based Access'   },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-[#E9E4DC] text-[11px] font-medium text-[#4E473D] hover:bg-white hover:border-[#D4C9B8] hover:shadow-sm transition-all duration-300 cursor-default">
                <Icon className="w-3.5 h-3.5 text-[#8B6122]" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Trust bar */}
        <div className="slide-up flex items-center gap-5 p-5 rounded-[22px] bg-white/70 border border-[#E9E4DC] max-w-md shadow-sm">
          <div className="flex -space-x-3 shrink-0">
            {['#059669','#0d9488','#0891b2'].map((c, i) => (
              <div key={i} style={{background:c,zIndex:3-i}} className="w-9 h-9 rounded-full border-[2px] border-[#F4EFE7]" />
            ))}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F5C770] to-[#c69a2a] border-[2px] border-[#F4EFE7] flex items-center justify-center text-[#5C3D00] text-[8px] font-black">2k+</div>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#24211D]">Trusted by families worldwide</p>
            <p className="text-[11px] text-[#7C756B] mt-0.5">Operating across 40+ cities in Pakistan</p>
          </div>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-[#DDD6CB] to-transparent my-16 flex-shrink-0 z-10" />

      {/* ══════════════ RIGHT LOGIN PANEL ══════════════ */}
      <div className="flex-1 flex justify-center items-center px-6 py-12 lg:py-0 z-10 relative">

        <div className="slide-up w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5C770] to-[#c69a2a] flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-[#5C3D00] fill-[#5C3D00]" />
            </div>
            <div>
              <span className="text-lg font-black tracking-[0.15em] text-[#002b17]">NIKAAHKARO</span>
              <p className="text-[8px] uppercase tracking-[0.3em] text-[#8B6122]/80 font-bold">CRM · Internal Portal</p>
            </div>
          </div>

          {/* ── No card — form floats directly on background ── */}
          <div>

            <div className="mb-10">
              <h2 className="text-[28px] font-bold text-[#002b17] mb-2 tracking-tight">Welcome Back</h2>
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
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#F5C770]/0 to-[#D4AF37]/0 group-focus-within/f:from-[#F5C770]/50 group-focus-within/f:to-[#D4AF37]/30 transition-all duration-500 pointer-events-none" />
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative w-full bg-white border border-[#E9E4DC] group-focus-within/f:border-[#D4AF37]/60 rounded-2xl px-5 py-[15px] pr-12 text-[14px] text-[#1E2022] placeholder-[#A8A296] focus:outline-none transition-all duration-300 shadow-[0_2px_8px_rgba(43,27,6,0.05)]"
                    placeholder="Enter your email"
                  />
                  <User className="absolute right-5 top-[18px] w-[17px] h-[17px] text-[#C4BAB0] group-focus-within/f:text-[#8B6122] transition-colors duration-300" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#676156] ml-1 uppercase tracking-[0.18em]">Password</label>
                <div className="relative group/f">
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#F5C770]/0 to-[#D4AF37]/0 group-focus-within/f:from-[#F5C770]/50 group-focus-within/f:to-[#D4AF37]/30 transition-all duration-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="relative w-full bg-white border border-[#E9E4DC] group-focus-within/f:border-[#D4AF37]/60 rounded-2xl px-5 py-[15px] pr-12 text-[14px] text-[#1E2022] placeholder-[#A8A296] focus:outline-none transition-all duration-300 tracking-[0.12em] shadow-[0_2px_8px_rgba(43,27,6,0.05)]"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-[18px] text-[#C4BAB0] group-focus-within/f:text-[#8B6122] hover:text-[#8B6122] transition-colors duration-300">
                    {showPassword ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex justify-between items-center pt-1 px-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-[12px] text-[#7D766C] hover:text-[#4E473D] transition-colors">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="appearance-none w-[18px] h-[18px] rounded-full border border-[#E9E4DC] bg-white checked:bg-gradient-to-br checked:from-[#F5C770] checked:to-[#c69a2a] checked:border-[#D4AF37] transition-all cursor-pointer peer" />
                    <svg className="absolute w-[9px] h-[9px] text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 12 10" fill="none"><path d="M1 5L4 8L11 1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Remember me
                </label>
                <a href="#" className="text-[12px] text-[#7D766C] hover:text-[#8B6122] transition-colors font-medium">Forgot password?</a>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={isLoading}
                className="w-full mt-5 rounded-2xl py-[15px] text-[14px] font-bold text-white bg-gradient-to-r from-[#064e3b] via-[#0a5c47] to-[#115E49] shadow-[0_8px_28px_-8px_rgba(6,78,59,0.40)] hover:shadow-[0_14px_36px_-8px_rgba(6,78,59,0.55)] hover:-translate-y-[2px] active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
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

            <div className="mt-10 pt-7 border-t border-[#E9E4DC] text-center">
              <p className="text-[12px] text-[#A8A296]">
                Need access?{' '}
                <a href="#" className="text-[#8B6122] font-semibold hover:text-[#5C3D00] transition-colors">Contact your administrator</a>
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-[10px] text-[#B0A898] tracking-wide">
            © 2026 NikaahKaro · Developed by <span className="text-[#8B7D6E]">zscorelabs</span>
          </p>
        </div>
      </div>
    </div>
  );
}

      {/* ══════════════ GLOBAL CSS ANIMATIONS ══════════════ */}
