"use client";

import { Suspense } from "react";
import UpiPayPage from "./UpiPayPage";

import { SpeedLoader } from "@/components/ui/SpeedLoader";

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <SpeedLoader text="Preparing Payment System" subtext="Secure Connection..." />
      </div>
    }>
      <UpiPayPage />
    </Suspense>
  );
}
