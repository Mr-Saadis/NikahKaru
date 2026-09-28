'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { User, EyeOff, Eye, ShieldCheck, Sparkles, Heart } from 'lucide-react';

function LoginForm() {
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
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
    <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-20 relative">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl font-bold text-[#16382E]">Welcome Back</h2>
          <p className="text-[15px] text-[#7D766C]">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label 
              htmlFor="email" 
              className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3.5 text-[14px] placeholder:text-[#A8A296] focus:border-[#115E49] focus:ring-1 focus:ring-[#115E49] focus:outline-none shadow-sm transition-all"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label 
              htmlFor="password" 
              className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3.5 text-[14px] placeholder:text-[#A8A296] focus:border-[#115E49] focus:ring-1 focus:ring-[#115E49] focus:outline-none shadow-sm transition-all"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#16382E] hover:bg-[#064e3b] text-white font-semibold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(22,56,46,0.39)] hover:shadow-[0_6px_20px_rgba(22,56,46,0.23)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>

      <div className="text-[12px] text-[#A8A296] font-medium absolute bottom-8 text-center">
        Developed by zscorelabs.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex w-full bg-[#FAF8F5]">
      {/* LEFT PANEL */}
      <div className="hidden md:flex w-[45%] bg-[#16382E] flex-col justify-center items-center overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent" />
        
        <div className="z-10 flex flex-col items-center gap-8">
          <div className="w-40 h-40 bg-white/5 rounded-3xl p-6 backdrop-blur-sm border border-white/10 shadow-2xl flex items-center justify-center">
            {/* Placeholder for Logo, you can use Next/Image here */}
            <svg
              className="w-full h-full text-[#D4AF37]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase">
              NikaahKaro
            </h1>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto rounded-full" />
            <p className="text-[#EFE9DF] text-sm uppercase tracking-[0.2em] font-medium">
              Internal CRM Engine
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-[#16382E] font-medium">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
