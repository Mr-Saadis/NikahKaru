import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "NikaahKaro CRM",
  description: "Internal CRM and Matrimonial Engine for NikaahKaro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} font-sans h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#FAF8F5] text-[#1E2022]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
