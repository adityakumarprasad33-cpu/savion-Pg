"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { auth, googleProvider, appleProvider } from "@/lib/firebase/client";
import { 
  signInWithPopup,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged
} from "firebase/auth";

import { getUserProfile, createUserProfile } from "@/lib/db/users";
import { getUserBookings } from "@/lib/db/bookings";
import { SpeedLoader } from "@/components/ui/SpeedLoader";
import { useRef } from "react";

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms));
  return Promise.race([promise, timeout]);
}

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    "auth/email-already-in-use": "An account already exists with this email. Please log in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters long.",
    "auth/operation-not-allowed": "Email/Password sign-up is not enabled. Please contact support.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Please check your internet connection.",
    "auth/invalid-phone-number": "Invalid phone number. Please include your country code (e.g. +91 98765 43210).",
    "auth/missing-phone-number": "Please enter your phone number.",
    "auth/quota-exceeded": "SMS quota exceeded. Please try again later.",
    "auth/invalid-verification-code": "Incorrect OTP. Please double-check and try again.",
  };
  return map[code] || `Something went wrong (${code}). Please try again.`;
}

export default function SignupPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("phone");
  const [role, setRole] = useState<"tenant" | "owner" | "caretaker">("tenant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const [phoneCode, setPhoneCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const formState = useRef({ name, role, email, phoneCode, phoneNumber });
  useEffect(() => {
    formState.current = { name, role, email, phoneCode, phoneNumber };
  }, [name, role, email, phoneCode, phoneNumber]);

  useEffect(() => {
    if ((window as any).recaptchaVerifier) {
      // @ts-ignore
      (window as any).recaptchaVerifier.clear?.();
      (window as any).recaptchaVerifier = null;
    }
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible'
    });

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        handlePostAuth(user);
      }
    });

    return () => unsub();
  }, [authMethod]);

  const handlePostAuth = async (user: any) => {
    try {
      setLoading(true);
      let profile = await withTimeout(getUserProfile(user.uid), 3000, null);
      if (!profile) {
        const { name, role, email, phoneCode, phoneNumber } = formState.current;
        await withTimeout(createUserProfile(user.uid, {
          role,
          name: name || user.displayName || "New User",
          email: email || user.email,
          phone: phoneNumber ? `${phoneCode}${phoneNumber}` : user.phoneNumber
        }), 3000, null);
        profile = await withTimeout(getUserProfile(user.uid), 3000, null);
      }

      if (profile!.role === "tenant" || profile!.role === "student") {
        const bookings = await withTimeout(getUserBookings(user.uid), 3000, []);
        router.push(bookings.length > 0 ? "/dashboard/tenant" : "/search");
      } else if (profile!.role === "caretaker") {
        router.push("/dashboard/caretaker");
      } else if (profile!.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard/owner");
      }
    } catch (e) {
      console.error("Profile creation error", e);
      setError("Database connection error. Try turning off tracking protection.");
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError("");
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      // Auto-caught by onAuthStateChanged
    } catch (e: any) {
      if (e.code !== "auth/popup-closed-by-user") {
        setError(friendlyError(e.code));
      }
      setLoading(false);
    }
  };

  const onApple = async () => {
    setError("");
    try {
      setLoading(true);
      await signInWithPopup(auth, appleProvider);
      // Auto-caught by onAuthStateChanged
    } catch (e: any) {
      if (e.code !== "auth/popup-closed-by-user") {
        setError(friendlyError(e.code));
      }
      setLoading(false);
    }
  };

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      // Auto-handled
    } catch (e: any) {
      setError(friendlyError(e.code));
      setLoading(false);
    }
  };

  const onPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const fullNum = `${phoneCode}${phoneNumber}`;
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, fullNum, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setLoading(false);
    } catch (e: any) {
      setError(friendlyError(e.code));
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await confirmationResult.confirm(otp);
      // Auto-handled
    } catch (e: any) {
      setError(friendlyError(e.code));
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white rounded-xl">
          <SpeedLoader text="Creating Profile" subtext="Securing your data..." />
        </div>
      )}
      
      <div id="recaptcha-container"></div>
      
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Join Savion to simplify your accommodation journey.
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2">
        <Button 
          variant={role === "tenant" ? "default" : "outline"} 
          onClick={() => setRole("tenant")}
          className="rounded-full px-4 text-xs md:text-sm"
          type="button"
        >
          Tenant
        </Button>
        <Button 
          variant={role === "owner" ? "default" : "outline"} 
          onClick={() => setRole("owner")}
          className="rounded-full px-4 text-xs md:text-sm"
          type="button"
        >
          Property Owner
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground -mt-2 mb-2">
        Are you a <span className="font-semibold">caretaker</span>?{" "}
        <Link href="/caretaker-login" className="text-primary font-semibold hover:underline">
          Use the Staff Login →
        </Link>
      </p>

      <div className="grid gap-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="text-red-500 shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        <div className="flex p-1 bg-slate-100 rounded-lg">
          <button 
            onClick={() => { setAuthMethod("phone"); setOtpSent(false); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMethod === 'phone' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}
          >
            Mobile Number
          </button>
          <button 
            onClick={() => { setAuthMethod("email"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMethod === 'email' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}
          >
            Email Address
          </button>
        </div>

        {authMethod === "phone" ? (
          <form onSubmit={otpSent ? onVerifyOtp : onPhoneSubmit}>
            <div className="grid gap-4">
              <Input id="name" placeholder="Full Name" className="h-12" value={name} onChange={e=>setName(e.target.value)} />
              
              {!otpSent ? (
                <div className="flex gap-2">
                  <Select value={phoneCode} onValueChange={(val) => setPhoneCode(val || "+91")}>
                    <SelectTrigger className="w-[100px] h-12 bg-white">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+91">🇮🇳 +91</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      <SelectItem value="+61">🇦🇺 +61</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    type="tel" 
                    placeholder="Enter mobile number" 
                    className="flex-1 h-12"
                    value={phoneNumber}
                    onChange={e=>setPhoneNumber(e.target.value)}
                  />
                </div>
              ) : (
                 <Input 
                  type="text" 
                  placeholder="Enter 6-digit OTP" 
                  className="h-12 text-center text-lg tracking-widest font-bold"
                  value={otp}
                  onChange={e=>setOtp(e.target.value)}
                  maxLength={6}
                />
              )}
              
              <Button type="submit" disabled={loading} className="h-12 font-bold w-full">
                {loading ? "Processing..." : otpSent ? "Verify OTP" : "Send OTP"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={onEmailSubmit}>
            <div className="grid gap-4">
              <Input id="name" placeholder="Full Name" className="h-12" value={name} onChange={e=>setName(e.target.value)} />
              <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  className="h-12"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
              />
              <Input
                  id="password"
                  placeholder="Create Password"
                  type="password"
                  className="h-12"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
              />
              <Button type="submit" disabled={loading} className="h-12 font-bold w-full">
                {loading ? "Processing..." : "Create Account"}
              </Button>
            </div>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or sign up with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Button disabled={loading} onClick={onGoogle} variant="outline" type="button" className="h-12 bg-white shadow-sm font-semibold">
               <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
               Google
            </Button>
            <Button disabled={loading} onClick={onApple} variant="outline" type="button" className="h-12 bg-black text-white hover:bg-black/80 hover:text-white font-semibold border-black">
              <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                 <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.39.07 2.35.74 3.15.77 1.2-.24 2.35-.93 3.62-.84 1.55.12 2.72.71 3.47 1.8-3.21 2.01-2.67 6.19.49 7.64-.65 1.64-1.49 3.25-2.73 4.51zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple
            </Button>
        </div>
      </div>
      <p className="px-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
