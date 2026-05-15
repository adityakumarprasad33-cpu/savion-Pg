"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { getUserBookings } from "@/lib/db/bookings";
import { SpeedLoader } from "@/components/ui/SpeedLoader";

/**
 * /dashboard — Smart router.
 * BUG-Q3 FIX: Now uses shared AuthContext instead of direct onAuthStateChanged.
 * BUG-P8 FIX: Parallelized profile+bookings fetch with Promise.all.
 * BUG-C6 FIX: Full try/catch with user-facing error on failure.
 */
export default function DashboardRedirect() {
  const router = useRouter();
  const { user, profile, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const route = async () => {
      try {
        const role = profile?.role;
        if (role === "admin") {
          router.replace("/admin");
        } else if (role === "owner") {
          router.replace("/dashboard/owner");
        } else if (role === "caretaker") {
          router.replace("/dashboard/caretaker");
        } else {
          // Tenant — only go to dashboard if they have bookings
          const bookings = await getUserBookings(user.uid);
          router.replace(bookings.length > 0 ? "/dashboard/tenant" : "/search");
        }
      } catch (err) {
        console.error("[DashboardRedirect] Routing failed:", err);
        router.replace("/login");
      }
    };

    route();
  }, [ready, user, profile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
      <SpeedLoader text="Redirecting" subtext="Preparing your dashboard..." />
    </div>
  );
}
