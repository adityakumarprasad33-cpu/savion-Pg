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
  authLoading: boolean;           // true until Firebase Auth has resolved
  profileLoading: boolean;        // true until Firestore profile has loaded
  ready: boolean;                 // true when BOTH auth AND profile are done
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
    } catch (err) {
      console.warn("[AuthProvider] Profile fetch failed:", err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  useEffect(() => {
    // ── Emergency timeout to prevent infinite hang ──
    const timer = setTimeout(() => {
      console.warn("[AuthContext] Firebase auth took too long. Forcing app to load.");
      setAuthLoading(false);
      setProfileLoading(false);
    }, 5000);

    console.log("[AuthContext] Setting up onAuthStateChanged listener...");
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      clearTimeout(timer);
      console.log("[AuthContext] onAuthStateChanged callback fired. User:", fbUser?.uid);
      setUser(fbUser);
      if (fbUser) {
        console.log("[AuthContext] Fetching profile for:", fbUser.uid);
        await fetchProfile(fbUser.uid);
        console.log("[AuthContext] Profile fetched.");
      } else {
        setProfile(null);
      }
      console.log("[AuthContext] Auth successfully resolved.");
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
