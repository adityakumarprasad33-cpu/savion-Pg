"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getUserProfile, UserRole } from "@/lib/db/users";
import { getUserBookings } from "@/lib/db/bookings";

interface GuardResult {
  loading: boolean;
  userId: string | null;
  error: string | null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms));
  return Promise.race([promise, timeout]);
}

function getRedirectUrl(role: UserRole | undefined, bookingsLength: number): string {
  if (role === "admin") return "/admin";
  if (role === "owner") return "/dashboard/owner";
  if (role === "caretaker") return "/dashboard/caretaker";
  // tenant or legacy student
  return bookingsLength > 0 ? "/dashboard/tenant" : "/search";
}

/**
 * Protects a dashboard page by required role.
 * Accepts both "tenant" and "student" (legacy) for the tenant dashboard.
 * Redirects to the correct dashboard if the role doesn't match.
 */
export function useRoleGuard(requiredRole: UserRole): GuardResult {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const profile = await withTimeout(getUserProfile(user.uid), 6000, null);

        if (!profile) {
          setError(
            "Account deleted or disabled by Savion. Please contact support."
          );
          setLoading(false);
          return;
        }

        const role = profile.role;

        if (role === "disabled") {
          setError("Account deleted or disabled by Savion. Please contact support.");
          setLoading(false);
          return;
        }

        // Accept both "tenant" and "student" for the tenant dashboard
        const effectiveRole = role === "student" ? "tenant" : role;
        const effectiveRequired = requiredRole === "student" ? "tenant" : requiredRole;

        if (effectiveRole !== effectiveRequired) {
          // Wrong dashboard — redirect to correct one
          if (role === "admin" || role === "owner" || role === "caretaker") {
            router.replace(getRedirectUrl(role, 0));
          } else {
            const bookings = await withTimeout(getUserBookings(user.uid), 5000, []);
            router.replace(getRedirectUrl(role, bookings.length));
          }
          return;
        }

        setUserId(user.uid);
        setLoading(false);
      } catch (err) {
        console.error("useRoleGuard error:", err);
        setError("Could not connect to the database. Please try again.");
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router, requiredRole]);

  return { loading, userId, error };
}
