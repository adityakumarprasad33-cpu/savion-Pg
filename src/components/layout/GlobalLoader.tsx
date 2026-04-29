"use client";

import { SpeedLoader } from "@/components/ui/SpeedLoader";

// Full-page loading screen shown while Firebase Auth is initializing.
export function GlobalLoader({ text = "Loading your experience..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <SpeedLoader 
        text="Processing Request" 
        subtext={text} 
      />
    </div>
  );
}
