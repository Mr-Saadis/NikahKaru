'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingLink, setIsVerifyingLink] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sessionReadyRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        sessionReadyRef.current = true;
        if (isMounted) setIsVerifyingLink(false);
      }
    });

    const initializeRecoverySession = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlError = searchParams.get('error_description') || searchParams.get('error');
        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        // 1. Handle implicit hash tokens (#access_token=...&refresh_token=...)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          if (access_token && refresh_token) {
            const { error: sessionErr } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionErr) throw sessionErr;
            sessionReadyRef.current = true;
            return;
          }
        }

        // 2. Handle PKCE code (?code=...)
        if (code) {
          const { error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (codeErr) throw codeErr;
          sessionReadyRef.current = true;
          return;
        }

        // 3. Handle token_hash recovery (?token_hash=...&type=recovery)
        if (tokenHash && type === 'recovery') {
          const { error: otpErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (otpErr) throw otpErr;
          sessionReadyRef.current = true;
          return;
        }

        // 4. Check if session was already established via callback/cookie
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          sessionReadyRef.current = true;
          return;
        }

        if (urlError && isMounted) {
          setError('This password reset link is invalid or has expired. Please request a new one.');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Unable to verify your reset link. It may have expired.');
        }
      } finally {
        if (isMounted) {
          setIsVerifyingLink(false);
        }
      }
    };

    initializeRecoverySession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();

      // Re-check hash tokens in case user submitted immediately
      const hash = window.location.hash;
      if (!sessionReadyRef.current && hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;
          sessionReadyRef.current = true;
        }
      }

      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck?.session) {
        throw new Error('Recovery session not found or expired. Please open the latest reset link from your email.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('Password updated successfully! Redirecting to dashboard...');
      window.history.replaceState(null, '', window.location.pathname);

      setTimeout(() => {
        window.location.replace('/overview');
      }, 1800);
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="slide-up w-full max-w-[420px]">
      <div>
        <div className="mb-9">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2EDE1] border border-[#E9E4DC] text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#1F3B34] mb-4">
            <KeyRound className="w-3.5 h-3.5 text-[#C86A4A]" />
            Account Recovery
          </div>
          <h2 className="text-[28px] font-bold text-[#1F3B34] mb-2 tracking-tight">
            Set New Password
          </h2>
          <p className="text-[13px] text-[#7D766C] font-light leading-relaxed">
            Create a strong new password for your NikahKaru CRM account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-[13px] flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7] text-[#1B5E20] text-[13px] flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#2d7a4b]" />
            <span>{success}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleUpdatePassword}>
          {/* New Password */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#676156] ml-1 uppercase tracking-[0.18em]">
              New Password
            </label>
            <div className="relative group/f">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isVerifyingLink || Boolean(success)}
                className="relative w-full bg-white border border-[#E9E4DC] focus:border-[#064e3b] rounded-2xl px-5 py-[15px] pr-12 text-[14px] text-[#1E2022] placeholder-[#A8A296] focus:outline-none transition-all duration-300 tracking-[0.12em] shadow-[0_2px_8px_rgba(43,27,6,0.05)] disabled:opacity-60"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-5 top-[18px] text-[#C4BAB0] group-focus-within/f:text-[#064e3b] hover:text-[#064e3b] transition-colors duration-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#676156] ml-1 uppercase tracking-[0.18em]">
              Confirm Password
            </label>
            <div className="relative group/f">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isVerifyingLink || Boolean(success)}
                className="relative w-full bg-white border border-[#E9E4DC] focus:border-[#064e3b] rounded-2xl px-5 py-[15px] pr-12 text-[14px] text-[#1E2022] placeholder-[#A8A296] focus:outline-none transition-all duration-300 tracking-[0.12em] shadow-[0_2px_8px_rgba(43,27,6,0.05)] disabled:opacity-60"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-5 top-[18px] text-[#C4BAB0] group-focus-within/f:text-[#064e3b] hover:text-[#064e3b] transition-colors duration-300"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isVerifyingLink || Boolean(success)}
            className="w-full mt-5 rounded-2xl py-[15px] text-[14px] font-bold text-white bg-[#1F3B34] shadow-[0_8px_28px_-8px_rgba(31,59,52,0.40)] hover:shadow-[0_14px_36px_-8px_rgba(31,59,52,0.55)] hover:-translate-y-[2px] active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
          >
            <span className="relative z-10 flex items-center justify-center gap-2.5">
              {isVerifyingLink ? (
                'Verifying Recovery Link…'
              ) : isLoading ? (
                <>
                  <svg className="animate-spin w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Updating Password…
                </>
              ) : (
                <>
                  <KeyRound className="w-[17px] h-[17px]" />
                  Update Password
                </>
              )}
            </span>
          </button>
        </form>

        <div className="mt-7 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#7D766C] hover:text-[#1F3B34] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>

      <p className="mt-12 text-center text-[12px] text-[#B0A898] tracking-wide">
        © 2026 NikahKaru · Developed by{' '}
        <Link href="https://www.zscorelabs.com" className="font-semibold text-[#8B7D6E] hover:text-[#C86A4A]">
          zscorelabs
        </Link>
      </p>
    </div>
  );
}

