"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase/client";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "@/lib/db/users";
import { SpeedLoader } from "@/components/ui/SpeedLoader";

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms));
  return Promise.race([promise, timeout]);
}

export default function CaretakerLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  
  const alreadyRouted = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !alreadyRouted.current) {
        alreadyRouted.current = true;
        handleRoute(user);
      }
    });
    return () => unsub();
  }, []);

  const handleRoute = async (user: any) => {
    try {
      setLoading(true);
      let profile = await withTimeout(getUserProfile(user.uid), 10000, null);
      
      if (!profile) {
        // Fallback: If auth succeeded but profile is missing (e.g. from previous permission errors)
        try {
          const { createUserProfile } = await import("@/lib/db/users");
          await withTimeout(createUserProfile(user.uid, {
            role: "caretaker",
            name: "Caretaker",
          }), 10000, null);
          profile = await withTimeout(getUserProfile(user.uid), 10000, null);
        } catch (e) {
          console.error("Failed to auto-recover profile", e);
        }
      }

      if (!profile) {
        throw new Error("db_timeout");
      }
      
      if (profile.role === "caretaker") {
        router.push("/dashboard/caretaker");
      } else {
        // If an owner/tenant somehow logs in here, redirect to login
        auth.signOut();
        setError("This portal is only for Caretakers.");
        setLoading(false);
      }
    } catch (e: any) {
      console.error("Routing error", e);
      if (e.message === "db_timeout") {
        setError("Database connection failed. Make sure you added your Firebase keys in Netlify and re-deployed your site.");
      } else {
        setError("Database connection error. Try turning off tracking protection.");
      }
      setLoading(false);
    }
  };

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!uid.trim()) {
      setError("Please enter your Caretaker UID.");
      return;
    }

    try {
      setLoading(true);
      const caretakerEmail = `${uid.trim().toLowerCase()}@savion.caretaker`;
      await signInWithEmailAndPassword(auth, caretakerEmail, password);
    } catch (e: any) {
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential" || e.code === "auth/wrong-password") {
        setError("Invalid UID or Password. Please contact the property owner.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[450px] relative mt-12 mb-12">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl">
          <SpeedLoader text="Authenticating" subtext="Verifying caretaker credentials..." />
        </div>
      )}
      
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-2 shadow-inner border border-blue-500/20">
          <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <polyline points="17 11 19 13 23 9"></polyline>
          </svg>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-blue-600 dark:text-blue-500">Staff Portal</h1>
        <p className="text-muted-foreground font-medium px-4">
          Property Caretaker Login. Enter the UID and Password provided by the property owner.
        </p>
      </div>

      <div className="grid gap-6 bg-card p-6 sm:p-8 rounded-2xl border shadow-sm dark:shadow-slate-900/50 border-blue-100 dark:border-blue-900/30">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="text-red-500 shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onEmailSubmit}>
          <div className="grid gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Caretaker UID</label>
              <Input
                  id="uid"
                  placeholder="e.g. ravi_hsr"
                  type="text"
                  className="h-12 font-mono"
                  value={uid}
                  onChange={e=>setUid(e.target.value)}
                  required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Password</label>
              <Input
                  id="password"
                  placeholder="••••••"
                  type="password"
                  autoComplete="current-password"
                  className="h-12"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  required
              />
            </div>
            <Button type="submit" disabled={loading} className="h-12 font-bold w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
              {loading ? "Verifying..." : "Access Dashboard"}
            </Button>
          </div>
        </form>
      </div>
      <p className="px-8 text-center text-sm text-muted-foreground">
        Are you a tenant or owner?{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium">
          Standard Login
        </Link>
      </p>
    </div>
  );
}
