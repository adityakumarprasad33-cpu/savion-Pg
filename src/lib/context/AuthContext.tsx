"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User as FBUser } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getUserProfile, UserProfile } from "@/lib/db/users";

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: FBUser | null;
  profile: UserProfile | null;
  authLoading: boolean;
  profileLoading: boolean;
  ready: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  authLoading: true,
  profileLoading: false,
  ready: false,
  refreshProfile: async () => {},
});

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FBUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = async (uid: string) => {
    setProfileLoading(true);
    try {
      const p = await getUserProfile(uid);
      setProfile(p);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  useEffect(() => {
    // BUG-02 FIX: Reduced from 5000ms → 2500ms, removed verbose console spam
    const timer = setTimeout(() => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[AuthContext] Firebase auth took too long. Forcing app to load.");
      }
      setAuthLoading(false);
      setProfileLoading(false);
    }, 2500);

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      clearTimeout(timer);
      setUser(fbUser);
      if (fbUser) {
        await fetchProfile(fbUser.uid);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    }, (error) => {
      clearTimeout(timer);
      console.error("[AuthContext] Auth error:", error);
      setAuthLoading(false);
    });

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  const ready = !authLoading && !profileLoading;

  return (
    <AuthContext.Provider value={{ user, profile, authLoading, profileLoading, ready, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
