"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/db/users";
import { getUserBookings } from "@/lib/db/bookings";

/**
 * /dashboard — Smart router.
 * Checks the logged-in user's role and redirects to correct dashboard.
 */
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const profile = await getUserProfile(user.uid);
      const role = profile?.role;

      if (role === "admin") {
        router.replace("/admin");
      } else if (role === "owner") {
        router.replace("/dashboard/owner");
      } else if (role === "caretaker") {
        router.replace("/dashboard/caretaker");
      } else {
        // Tenant (or legacy student) — only go to dashboard if they have bookings
        const bookings = await getUserBookings(user.uid);
        router.replace(bookings.length > 0 ? "/dashboard/tenant" : "/search");
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm font-medium">Taking you to your dashboard...</p>
      </div>
    </div>
  );
}
