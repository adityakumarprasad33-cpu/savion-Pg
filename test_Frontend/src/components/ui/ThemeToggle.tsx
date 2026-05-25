"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Floating theme toggle pill — renders on EVERY page.
 * Placed in ClientWrapper so it's always available.
 * Uses next-themes under the hood (class-based dark mode).
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      id="global-theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="
        fixed bottom-6 right-6 z-[9999]
        w-12 h-12 rounded-full
        flex items-center justify-center
        bg-white dark:bg-zinc-800
        border border-slate-200 dark:border-zinc-700
        shadow-lg shadow-black/10 dark:shadow-black/30
        hover:scale-110 active:scale-95
        transition-all duration-200 ease-out
        print:hidden
      "
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700" />
      )}
    </button>
  );
}
