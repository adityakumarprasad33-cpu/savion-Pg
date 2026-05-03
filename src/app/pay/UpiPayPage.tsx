"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Clock, AlertTriangle, Copy, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { submitPayment, getPaymentsByTenant } from "@/lib/db/payments";
import { createNotification } from "@/lib/db/notifications";
import { updateBooking } from "@/lib/db/bookings";
import {
  getPaymentSession,
  markSessionExpired,
  markSessionUsed,
  type PaymentSession
} from "@/lib/db/paymentSessions";
import { SpeedLoader } from "@/components/ui/SpeedLoader";

const TIMER_SECONDS = 600;

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// UTR must be 10-24 alphanumeric chars
function isValidUTR(utr: string) {
  return /^[A-Z0-9]{10,24}$/.test(utr.trim().toUpperCase());
}

export default function UpiPayPage() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session");

  const [session, setSession] = useState<PaymentSession | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [expired, setExpired] = useState(false);
  const [utr, setUtr] = useState("");
  const [utrError, setUtrError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Step 1: Authenticate & validate session ──────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthError("You must be logged in to make a payment.");
        setInitLoading(false);
        return;
      }
      setAuthUid(user.uid);

      if (!sessionId) {
        setAuthError("Invalid payment link. Please go back to your dashboard.");
        setInitLoading(false);
        return;
      }

      try {
        const s = await getPaymentSession(sessionId);

        // Security check 1: Session must exist
        if (!s) {
          setAuthError("Payment session not found or has already been used.");
          setInitLoading(false);
          return;
        }

        // Security check 2: Session belongs to THIS authenticated user
        if (s.tenantId !== user.uid) {
          setAuthError("This payment session does not belong to your account.");
          setInitLoading(false);
          return;
        }

        // Security check 3: Session must be pending (not used or expired)
        if (s.status !== "pending") {
          setAuthError(
            s.status === "used"
              ? "This payment session has already been used."
              : "This payment session has expired. Please go back and start again."
          );
          setInitLoading(false);
          return;
        }

        // Security check 4: Session must not have expired server-side
        if (Date.now() > s.expiresAt) {
          await markSessionExpired(s.id);
          setAuthError("This payment session has expired (10-minute window). Please start a new payment.");
          setInitLoading(false);
          return;
        }

        // Security check 5: Check if this month's payment already exists and is verified
        const existingPayments = await getPaymentsByTenant(user.uid);
        const alreadyPaid = existingPayments.find(
          (p) => p.bookingId === s.bookingId && p.month === s.month && (p.status === "verified")
        );
        if (alreadyPaid) {
          setAuthError(`Rent for ${s.month} at ${s.pgName} has already been paid and confirmed. No duplicate payment needed.`);
          setInitLoading(false);
          return;
        }

        setSession(s);

        // Set timer based on actual server expiry, not a fixed 10 min from page load
        const remainingMs = s.expiresAt - Date.now();
        const remainingSecs = Math.max(0, Math.floor(remainingMs / 1000));
        setTimeLeft(remainingSecs);

        setInitLoading(false);
      } catch (err) {
        console.error(err);
        setAuthError("Failed to load payment session. Please try again.");
        setInitLoading(false);
      }
    });
    return () => unsub();
  }, [sessionId]);

  // ── Step 2: Countdown timer ──────────────────────────────────────────────
  useEffect(() => {
    if (!session || initLoading) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          // Mark expired server-side too
          markSessionExpired(session.id).catch(console.error);
          setExpired(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [session, initLoading]);

  const percentLeft = session ? (timeLeft / Math.max(1, Math.floor((session.expiresAt - session.createdAt) / 1000))) * 100 : 100;
  const timerColor = timeLeft > 300 ? "#22c55e" : timeLeft > 120 ? "#f59e0b" : "#ef4444";

  const upiLink = session
    ? `upi://pay?pa=${encodeURIComponent(session.ownerUpiId)}&pn=${encodeURIComponent(session.ownerName)}&am=${session.amount}&cu=INR&tn=${encodeURIComponent(`${session.type === "rent" ? "Rent" : "Deposit"} - ${session.pgName} - ${session.month}`)}`
    : "";

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !authUid) return;

    const cleanUtr = utr.trim().toUpperCase();

    // Client-side UTR format validation
    if (!isValidUTR(cleanUtr)) {
      setUtrError("Invalid UTR format. It should be 10-24 alphanumeric characters (no spaces or special chars).");
      return;
    }
    setUtrError("");

    setSubmitting(true);
    try {
      // Re-fetch session to ensure it's still valid and still pending (replay protection)
      const freshSession = await getPaymentSession(session.id);
      if (!freshSession || freshSession.status !== "pending" || Date.now() > freshSession.expiresAt) {
        alert("Session is no longer valid. Please go back and start a new payment.");
        setExpired(true);
        return;
      }

      // Check for duplicate UTR across ALL payments
      const allPayments = await getPaymentsByTenant(authUid);
      const utrAlreadyUsed = allPayments.some((p) => p.utrNumber === cleanUtr);
      if (utrAlreadyUsed) {
        setUtrError("This UTR number has already been submitted. Please check your transaction details.");
        return;
      }

      // Create the payment record (auto-verified immediately)
      await submitPayment({
        bookingId: session.bookingId,
        contractId: session.contractId,
        tenantId: authUid,
        tenantName: session.tenantName,
        tenantAadhaar: session.tenantAadhaar,
        ownerId: session.ownerId,
        ownerName: session.ownerName,
        ownerUpiId: session.ownerUpiId,
        pgId: session.pgId,
        pgName: session.pgName,
        roomNo: session.roomNo,
        amount: session.amount,
        month: session.month,
        utrNumber: cleanUtr,
        type: session.type,
      });

      // Mark session as used (one-time use)
      await markSessionUsed(session.id);

      // Auto-confirm the booking on first successful payment
      await updateBooking(session.bookingId, { status: "confirmed" });

      // Notify TENANT — payment confirmed
      await createNotification({
        userId: authUid,
        title: "✅ Payment Confirmed!",
        message: `Your ₹${session.amount.toLocaleString("en-IN")} rent for ${session.month} at ${session.pgName} has been automatically verified. UTR: ${cleanUtr}`,
        type: "booking",
      });

      // Notify OWNER — rent received
      await createNotification({
        userId: session.ownerId,
        title: "💰 Rent Payment Received",
        message: `${session.tenantName} paid ₹${session.amount.toLocaleString("en-IN")} for ${session.month} at ${session.pgName}. UTR: ${cleanUtr}. Payment auto-verified ✅`,
        type: "booking",
      });

      clearInterval(intervalRef.current!);
      setDone(true);
      setTimeout(() => router.push("/dashboard/tenant"), 3000);
    } catch (err) {
      console.error("Payment submission failed:", err);
      // Notify tenant of failure
      await createNotification({
        userId: authUid,
        title: "❌ Payment Failed",
        message: `Your payment attempt for ${session.month} at ${session.pgName} failed. Please try again.`,
        type: "booking",
      }).catch(() => {});
      setUtrError("Submission failed. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyUpi = () => {
    if (session?.ownerUpiId) {
      navigator.clipboard.writeText(session.ownerUpiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (initLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center">
        <SpeedLoader text="Securing Session" subtext="Verifying payment environment..." />
      </div>
    );
  }

  // ── AUTH / SESSION ERROR ──────────────────────────────────────────────────
  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl dark:shadow-zinc-900/50 p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-red-700 mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm mb-6">{authError}</p>
          <Link href="/dashboard/tenant"><Button className="w-full">← Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl dark:shadow-zinc-900/60 p-10 max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-green-700 mb-2">Payment Verified! ✅</h2>
          <p className="text-muted-foreground text-sm mb-1">
            ₹{session!.amount.toLocaleString("en-IN")} for <strong>{session!.month}</strong> at <strong>{session!.pgName}</strong> has been <span className="text-green-700 font-bold">automatically verified</span>.
          </p>
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-left">
            <p className="text-xs text-green-800 font-semibold">✔️ Payment auto-verified instantly</p>
            <p className="text-xs text-green-700 mt-0.5">✔️ Both you and the owner have been notified</p>
            <p className="text-xs text-green-700 mt-0.5">✔️ Booking status updated to Confirmed</p>
          </div>
          <p className="text-xs text-muted-foreground mt-4 mb-2">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // ── EXPIRED ───────────────────────────────────────────────────────────────
  if (expired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl dark:shadow-zinc-900/60 p-10 max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-red-600 mb-2">Session Expired</h2>
          <p className="text-muted-foreground text-sm mb-6">The 10-minute payment window has closed. Please go back and start a new payment.</p>
          <Link href="/dashboard/tenant"><Button className="w-full">← Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  // ── MAIN QR PAGE ──────────────────────────────────────────────────────────
  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-800/50 py-8 px-4">
      <div className="max-w-md mx-auto">

        <Link href="/dashboard/tenant" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Security Badge */}
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-4">
          <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-xs text-green-700 font-semibold">Secure verified session · End-to-end protected</p>
        </div>

        {/* Payment Info Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-6 mb-4 shadow-lg dark:shadow-zinc-900/50">
          <div className="mb-4">
            <p className="text-xs opacity-50 uppercase tracking-widest mb-1">🏢 Property</p>
            <p className="text-2xl font-black leading-tight">{session.pgName}</p>
            <p className="text-sm opacity-60 mt-0.5">Room / {session.roomNo}</p>
          </div>
          <div className="h-px bg-white dark:bg-zinc-900/10 mb-4" />
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-50 uppercase tracking-widest mb-1">Paying To</p>
              <p className="text-lg font-bold">{session.ownerName}</p>
              <p className="font-mono text-xs opacity-50 mt-0.5">{session.ownerUpiId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-50">Amount</p>
              <p className="text-3xl font-black">₹{session.amount.toLocaleString("en-IN")}</p>
              <p className="text-xs opacity-50 mt-0.5">{session.month}</p>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-4 mb-4 shadow-sm dark:shadow-slate-900/50 flex items-center gap-4">
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={timerColor}
                strokeWidth="3.5"
                strokeDasharray={`${Math.max(0, percentLeft)} 100`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s linear, stroke 0.3s" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="w-5 h-5" style={{ color: timerColor }} />
            </div>
          </div>
          <div>
            <p className="font-bold text-xl tabular-nums" style={{ color: timerColor }}>{formatTime(timeLeft)}</p>
            <p className="text-xs text-muted-foreground">Payment window remaining</p>
            {timeLeft <= 120 && <p className="text-xs font-semibold text-red-500 mt-0.5">⚠️ Hurry! Session expiring soon</p>}
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm dark:shadow-slate-900/50 p-6 mb-4 text-center">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
            📱 Scan with GPay · PhonePe · Paytm · Any UPI App
          </p>
          <div className="inline-block p-4 bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-700 rounded-2xl shadow-inner">
            <QRCodeSVG value={upiLink} size={200} level="H" bgColor="#ffffff" fgColor="#0f172a" />
          </div>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="font-mono text-sm bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg">{session.ownerUpiId}</span>
            <button
              onClick={copyUpi}
              className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            On mobile? <a href={upiLink} className="text-primary font-semibold underline">Tap to open UPI app directly</a>
          </p>
        </div>

        {/* Confirm Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm dark:shadow-slate-900/50 p-6">
          <h3 className="font-bold text-base mb-1">✅ Paid? Enter your UTR to confirm</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Find the <strong>UTR / Transaction ID</strong> in your UPI app&apos;s transaction history and enter it below.
          </p>
          <form onSubmit={handleConfirm} className="space-y-3">
            <div>
              <Input
                placeholder="12-24 character UTR e.g. 425234567891"
                value={utr}
                onChange={(e) => { setUtr(e.target.value); setUtrError(""); }}
                className={`h-11 font-mono text-sm ${utrError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                maxLength={24}
                required
              />
              {utrError && <p className="text-xs text-red-500 mt-1.5">{utrError}</p>}
            </div>
            <Button type="submit" disabled={submitting || expired} className="w-full h-12 font-bold text-base">
              {submitting ? "Verifying & Submitting..." : "Confirm Payment →"}
            </Button>
          </form>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          🔒 This session is unique to you and expires after use. Authenticated as <span className="font-mono">{authUid?.slice(0, 12)}...</span>
        </p>
      </div>
    </div>
  );
}
