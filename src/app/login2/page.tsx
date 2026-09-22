"use client";

import React, { useState } from 'react';
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function Login2Page() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`min-h-screen flex w-full bg-[#FAF8F5] text-[#1E2022] ${plusJakartaSans.className} antialiased`}>
      {/* Left Branding Panel */}
      <div className="hidden lg:flex w-[45%] bg-[#16382E] flex-col justify-center items-center relative overflow-hidden">
        {/* Decorative elements for the background could go here */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 px-10">
          {/* Logo */}
          <div className="w-40 h-40 bg-white/5 rounded-3xl p-6 backdrop-blur-sm border border-white/10 shadow-2xl flex items-center justify-center">
            <img 
              alt="NikaahKaro Brandmark" 
              className="w-full h-full object-contain drop-shadow-xl" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl-Maec7kHf8-BHv2s6yAiVqRLiOM3EvrCF08odbdqMnrJ8FdA5caVPIt2Cwf4Eksojn8s72ei2Z4Du0TJhwLpKWgEGki_64VzodTdKVGeO-5xe5VoUJ37kE3nWG8VYwiBYZPzPfzoOntM_VAJ2-0lQpq_-8ZxnzEqovhnIOZRK3YvKmWhwinJ4jwKz-7c3Bf8uzFtAOLcTxY1S-JYQy31lwSGNqt1JC8v38C135TRnlEupxGmOTQhMzdNgCZa1mzyoA" 
            />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase flex flex-col gap-1">
              <span>NikaahKaro</span>
            </h1>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto rounded-full"></div>
            <p className="text-[#EFE9DF] text-sm uppercase tracking-[0.2em] font-medium mt-4">
              Matrimonial Management System
            </p>
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-20 relative">
        <div className="w-full max-w-md space-y-10">
          
          {/* Header */}
          <div className="space-y-3 text-center sm:text-left">
            <h2 className="text-3xl font-bold text-[#16382E]">Welcome Back</h2>
            <p className="text-[15px] text-[#7D766C]">
              Please sign in to your account to access the NikaahKaro Management System.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-5">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
                  Email
                </label>
                <input 
                  type="email" 
                  placeholder="manager@nikaahkaro.pk"
                  className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3.5 text-[14px] text-[#1E2022] placeholder:text-[#A8A296] focus:outline-none focus:border-[#115E49] focus:ring-1 focus:ring-[#115E49] transition-all shadow-sm"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3.5 text-[14px] text-[#1E2022] placeholder:text-[#A8A296] focus:outline-none focus:border-[#115E49] focus:ring-1 focus:ring-[#115E49] transition-all shadow-sm"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A296] hover:text-[#16382E] transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[12px] text-[#888174] text-center sm:text-left leading-relaxed">
              By continuing, you agree to our <a href="#" className="text-[#16382E] hover:underline font-medium">Terms of Service</a> and <a href="#" className="text-[#16382E] hover:underline font-medium">Privacy Policy</a>.
            </p>

            <button 
              type="submit"
              className="w-full bg-[#16382E] hover:bg-[#064e3b] text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(22,56,46,0.39)] hover:shadow-[0_6px_20px_rgba(22,56,46,0.23)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center w-full">
          <p className="text-[12px] text-[#A8A296] font-medium">
            © 2026 NikaahKaro. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
