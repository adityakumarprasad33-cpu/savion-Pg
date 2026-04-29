"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BookingSidebarProps {
  pgId: string;
  pgName: string;
  price: string;
  hasActiveBooking?: boolean;
}

export function BookingSidebar({ pgId, pgName, price, hasActiveBooking = false }: BookingSidebarProps) {
  return (
    <aside>
      <div className="sticky top-40 bg-white border border-primary/20 rounded-3xl p-6 md:p-8 shadow-xl shadow-primary/5 animate-fade-in-up">
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground font-semibold uppercase">Pricing starts from</p>
            <p className="text-3xl font-black text-primary">
              {price || "Contact"}
              <span className="text-sm text-muted-foreground font-medium">/mo</span>
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Security Deposit</span>
            <span className="font-semibold">1 Month Rent</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Lock-in Period</span>
            <span className="font-semibold">3 Months</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Notice Period</span>
            <span className="font-semibold">30 Days</span>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-xl text-sm text-orange-800 mb-6 flex gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <span className="text-xl">🔥</span>
          </div>
          <p>This property is highly demanded. <strong>2 tenants</strong> booked this PG recently.</p>
        </div>

        {/* Link to multi-step booking wizard */}
        {hasActiveBooking ? (
          <div className="w-full">
            <Button size="lg" disabled className="w-full rounded-xl font-bold h-14 text-lg bg-slate-300">
              Active Booking Found
            </Button>
            <p className="text-center text-xs text-red-500 font-semibold mt-4">
              You can only have one active booking at a time.
            </p>
          </div>
        ) : (
          <Link href={`/pg/${pgId}/book`} className="block">
            <Button size="lg" className="w-full rounded-xl font-bold h-14 text-lg text-white hover-glow">
              Start Booking →
            </Button>
          </Link>
        )}
        {!hasActiveBooking && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            You'll complete KYC, sign digitally, and pay instantly.
          </p>
        )}
      </div>
    </aside>
  );
}
