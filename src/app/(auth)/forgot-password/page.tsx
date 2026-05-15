"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      const map: Record<string, string> = {
        "auth/user-not-found": "No account found with this email address.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
      };
      setError(map[err.code] || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[450px] mt-24 px-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Check your email</h1>
          <p className="text-muted-foreground font-medium">
            We sent a password reset link to <strong>{email}</strong>. 
            Check your inbox and follow the instructions.
          </p>
          <p className="text-xs text-muted-foreground">Didn&apos;t receive it? Check your spam folder.</p>
          <Link href="/login">
            <Button variant="outline" className="h-12 font-bold px-8">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[450px] mt-24 px-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner border border-primary/20">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tight">Reset Password</h1>
        <p className="text-muted-foreground font-medium px-4">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <div className="grid gap-6 bg-card p-6 sm:p-8 rounded-2xl border shadow-sm">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="text-red-500 shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Input
            id="reset-email"
            placeholder="name@example.com"
            type="email"
            className="h-12"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading} className="h-12 font-bold w-full">
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
