"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { getUserBookings } from "@/lib/db/bookings";
import { UserRole } from "@/lib/db/users";

interface GuardResult {
  loading: boolean;
  userId: string | null;
  error: string | null;
}

function getRedirectUrl(role: UserRole | undefined, bookingsLength: number): string {
  if (role === "admin") return "/admin";
  if (role === "owner") return "/dashboard/owner";
  if (role === "caretaker") return "/dashboard/caretaker";
  return bookingsLength > 0 ? "/dashboard/tenant" : "/search";
}

/**
 * BUG-03 FIX: No longer creates its own onAuthStateChanged listener.
 * Now consumes the shared AuthContext, eliminating the duplicate Firebase listener
 * that previously ran on every dashboard page simultaneously.
 *
 * BUG-12 FIX: Removed `router` from useEffect deps — it's stable in Next.js App Router.
 */
export function useRoleGuard(requiredRole: UserRole): GuardResult {
  const router = useRouter();
  const { user, profile, ready } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    // No user → go to login
    if (!user) {
      router.replace("/login");
      return;
    }

    // Profile not found → account deleted/disabled
    if (!profile) {
      setError("Account deleted or disabled by Savion. Please contact support.");
      return;
    }

    const role = profile.role;

    if (role === "disabled") {
      setError("Account deleted or disabled by Savion. Please contact support.");
      return;
    }

    // Accept both "tenant" and "student" (legacy) for the tenant dashboard
    const effectiveRole = role === "student" ? "tenant" : role;
    const effectiveRequired = requiredRole === "student" ? "tenant" : requiredRole;

    if (effectiveRole !== effectiveRequired) {
      // Wrong dashboard — redirect to correct one
      if (role === "admin" || role === "owner" || role === "caretaker") {
        router.replace(getRedirectUrl(role, 0));
      } else {
        getUserBookings(user.uid)
          .then((bookings) => router.replace(getRedirectUrl(role, bookings.length)))
          .catch(() => router.replace("/search"));
      }
      return;
    }

    setUserId(user.uid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, profile, requiredRole]);

  return { loading: !ready, userId, error };
}
