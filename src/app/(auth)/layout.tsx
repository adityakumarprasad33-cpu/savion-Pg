"use client";

import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left panel — clean gradient, no heavy animation */}
      <div className="relative hidden h-full flex-col bg-primary p-10 text-white lg:flex border-r animate-slide-in-left overflow-hidden">
        {/* Gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-orange-500/80" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white dark:bg-zinc-900/5 blur-3xl" />
        <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-orange-400/10 blur-2xl" />

        <div className="relative z-10 flex items-center text-3xl font-black tracking-tight drop-shadow-md">
          Savion
        </div>
        <div className="relative z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              &ldquo;Savion completely changed how I found my PG. The booking process was seamless, and the property matches the photos exactly.&rdquo;
            </p>
            <footer className="text-sm text-white/70">Sofia Davis, Bangalore</footer>
          </blockquote>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex h-screen w-full items-center justify-center p-4 lg:p-8 animate-fade-in-up">
        {children}
      </div>
    </div>
  );
}
