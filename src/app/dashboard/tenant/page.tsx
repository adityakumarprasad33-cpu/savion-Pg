"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { getUserBookings, Booking, updateBooking, deleteBooking } from "@/lib/db/bookings";
import { getContractsByTenant, RentalContract, updateContractStatus, deleteContract } from "@/lib/db/contracts";
import { getUserComplaints, createComplaint, Complaint, deleteComplaintsByTenantAndPG } from "@/lib/db/complaints";
import { getPaymentsByTenant, Payment } from "@/lib/db/payments";
import { createPaymentSession } from "@/lib/db/paymentSessions";
import { getUserProfile, UserProfile } from "@/lib/db/users";
import { createReview, hasTenantReviewedPG } from "@/lib/db/reviews";
import { restoreRoomAvailability } from "@/lib/db/pgs";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import {
  FileText, Home, CheckCircle2, MessageSquareWarning, CreditCard,
  Clock, XCircle, Receipt, QrCode, ChevronRight, LogOut, ArrowUpRight,
  Lock, WifiOff, Package, ShieldCheck, Wrench, Eraser, Shield, MessageCircle, UserCircle, Sparkles, AlertTriangle, Star
} from "lucide-react";
import { SpeedLoader } from "@/components/ui/SpeedLoader";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { VerificationModal } from "@/components/verification/VerificationModal";
import { getVerificationStatus } from "@/lib/db/verifications";

type Tab = "home" | "payments" | "complaints";

export default function TenantDashboard() {
  const { loading, userId, error } = useRoleGuard("tenant");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenantProfile, setTenantProfile] = useState<UserProfile | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);

  // Modal states
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState("maintenance");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>("loading");
  const [payMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [supportMessage, setSupportMessage] = useState("");
  const [supportSent, setSupportSent] = useState(false);

  // Review states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [nocBooking, setNocBooking] = useState<Booking | null>(null);
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  useEffect(() => {
    if (!userId) return;

    // 1. Real-time Bookings
    const qBookings = query(collection(db, "bookings"), where("tenantId", "==", userId));
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Booking[]);
    }, (err) => console.error("[TenantDash] Bookings sync error:", err));

    // 2. Real-time Contracts
    const qContracts = query(collection(db, "contracts"), where("tenantId", "==", userId));
    const unsubContracts = onSnapshot(qContracts, (snap) => {
      setContracts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as RentalContract[]);
    }, (err) => console.error("[TenantDash] Contracts sync error:", err));

    // 3. Real-time Complaints
    const qComplaints = query(collection(db, "complaints"), where("tenantId", "==", userId));
    const unsubComplaints = onSnapshot(qComplaints, (snap) => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Complaint[]);
    }, (err) => console.error("[TenantDash] Complaints sync error:", err));

    // 4. Real-time Payments
    const qPayments = query(collection(db, "payments"), where("tenantId", "==", userId));
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Payment[]);
    }, (err) => console.error("[TenantDash] Payments sync error:", err));

    // 5. Profile & Verification — BUG-07 FIX: added .catch() so errors don't silently vanish
    getUserProfile(userId)
      .then(p => { if (p) { setTenantProfile(p); setIsVerified(p.isVerified === true); } })
      .catch(err => console.error("[TenantDash] Profile fetch failed:", err));
    getVerificationStatus(userId)
      .then(v => { setVerificationStatus(v?.status || "not_started"); })
      .catch(err => console.error("[TenantDash] Verification status fetch failed:", err));

    return () => {
      unsubBookings();
      unsubContracts();
      unsubComplaints();
      unsubPayments();
    };
  }, [userId]);



  const activeBooking = bookings.find((b) => b.status === "confirmed" || b.status === "notice_given" || b.status === "notice_approved");
  const activeContract = contracts.find((c) => c.status === "active");

  useEffect(() => {
    if (activeBooking?.ownerId) {
      getUserProfile(activeBooking.ownerId).catch(e => { console.error("Owner profile error:", e); return null; }).then(p => { if (p) setOwnerProfile(p); });
    }
  }, [activeBooking?.ownerId]);

  const submitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking) return alert("You need an active booking to raise a complaint.");
    if (!complaintDescription.trim()) return alert("Please describe the issue.");
    if (!userId) return;
    setSubmittingComplaint(true);
    try {
      const newComplaint = await createComplaint({
        tenantId: userId,
        ownerId: activeBooking.ownerId,
        pgId: activeBooking.pgId,
        pgName: activeBooking.pgName,
        category: complaintCategory,
        description: complaintDescription,
        tenantName: activeContract?.tenantName || "Tenant",
        roomNo: activeBooking.roomType,
        regId: activeBooking.id
      });
      const { createNotification } = await import("@/lib/db/notifications");
      await createNotification({
        userId: activeBooking.ownerId,
        title: "New Complaint Filed",
        message: `A new ${complaintCategory} complaint was filed by a tenant at ${activeBooking.pgName}: "${complaintDescription}"`,
        type: "complaint"
      });
      setComplaints([newComplaint, ...complaints]);
      setIsComplaintModalOpen(false);
      setComplaintDescription("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit complaint. Please try again.");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking || !userId || !tenantProfile) return;
    setSubmittingReview(true);
    try {
      await createReview({
        tenantId: userId,
        tenantName: tenantProfile.name,
        pgId: reviewBooking.pgId,
        pgName: reviewBooking.pgName,
        rating: reviewRating,
        comment: reviewComment,
      });
      alert("Review submitted! Thank you.");
      setIsReviewModalOpen(false);
      setReviewComment("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const goToPayPage = async () => {
    if (!activeBooking) return;
    await payForBooking(activeBooking);
  };

  const payForBooking = async (booking: Booking) => {
    if (!userId || !tenantProfile) return;
    if (!isVerified) {
      setShowVerifyModal(true);
      return;
    }
    setCreatingSession(true);
    try {
      const ownerProfileData = await getUserProfile(booking.ownerId);
      if (!ownerProfileData?.upiId) {
        alert("The owner has not set up their UPI ID yet. Please contact them.");
        return;
      }

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const session = await createPaymentSession({
        tenantId: userId,
        ownerId: booking.ownerId,
        ownerUpiId: ownerProfileData.upiId,
        ownerName: ownerProfileData.name,
        pgId: booking.pgId,
        pgName: booking.pgName,
        roomNo: booking.roomType,
        bookingId: booking.id,
        contractId: booking.contractId || "",
        tenantName: tenantProfile.name,
        tenantAadhaar: booking.aadhaarUrl || "",
        amount: booking.amount,
        month,
        type: "rent",
      });

      router.push(`/pay?session=${session.id}`);
    } catch (err) {
      console.error("Failed to create payment session:", err);
      alert("Could not start payment. Please try again.");
    } finally {
      setCreatingSession(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!activeBooking || !activeContract || !userId) return;
    const hasDues = !payments.some(p => p.month === payMonth && p.type === "rent" && p.status === "verified");
    if (hasDues) {
      alert("⚠️ You have pending dues. Please clear all outstanding payments before initiating a move-out notice.");
      return;
    }
    const confirmLeave = confirm("Are you sure you want to give your 1-month move-out notice?");
    if (!confirmLeave) return;
    setLeavingRoom(true);
    try {
      const moveOutDate = new Date();
      moveOutDate.setMonth(moveOutDate.getMonth() + 1);
      const moveOutStr = moveOutDate.toISOString().split("T")[0];

      await updateBooking(activeBooking.id, { status: "notice_given", moveOutDate: moveOutStr });
      
      const { createNotification } = await import("@/lib/db/notifications");
      await createNotification({
        userId: activeBooking.ownerId,
        title: "Move-out Notice Received",
        message: `${tenantProfile?.name || "A tenant"} has given notice at ${activeBooking.pgName}. Checkout: ${moveOutDate.toLocaleDateString("en-IN")}`,
        type: "system"
      });
      setBookings(bookings.map(b => b.id === activeBooking.id ? { ...b, status: "notice_given", moveOutDate: moveOutStr } : b));
      alert(`Notice submitted. Move-out date: ${moveOutDate.toLocaleDateString("en-IN")}`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit notice.");
    } finally {
      setLeavingRoom(false);
    }
  };

  const handleCancelNotice = async () => {
    if (!activeBooking) return;
    const confirmCancel = confirm("Cancel move-out notice?");
    if (!confirmCancel) return;
    try {
      setLeavingRoom(true);
      await updateBooking(activeBooking.id, { status: "confirmed", moveOutDate: "" });
      
      const { createNotification } = await import("@/lib/db/notifications");
      await createNotification({
        userId: activeBooking.ownerId,
        title: "Notice Cancelled",
        message: `${tenantProfile?.name || "A tenant"} has cancelled their move-out notice at ${activeBooking.pgName}.`,
        type: "system"
      });

      setBookings(bookings.map(b => b.id === activeBooking.id ? { ...b, status: "confirmed", moveOutDate: "" } : b));
      alert("Notice cancelled.");
    } catch (e) {
      console.error(e);
      alert("Failed to cancel notice.");
    } finally {
      setLeavingRoom(false);
    }
  };

  const handleSupportSubmit = () => {
    if (!supportMessage.trim()) return;
    setTimeout(() => setSupportSent(true), 800);
  };

  if (error) {
    const isBan = error.includes("Account deleted or disabled");
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="text-center max-w-md w-full px-6 bg-white dark:bg-zinc-900 backdrop-blur-3xl p-12 rounded-[3.5rem] shadow-2xl dark:shadow-zinc-900/60 shadow-slate-200/40 border border-white/60 dark:border-zinc-800 animate-scale-in">
          <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            {isBan ? <Lock className="w-12 h-12 text-rose-500 animate-pulse" /> : <WifiOff className="w-12 h-12 text-rose-500" />}
          </div>
          <h2 className="text-3xl font-black mb-3 text-slate-900 dark:text-slate-100 tracking-tighter">{isBan ? "Account Locked" : "System Offline"}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">{error}</p>
          {isBan ? (
            supportSent ? (
              <div className="bg-emerald-50 text-emerald-700 p-8 rounded-[2rem] text-sm font-bold border border-emerald-100 animate-scale-in">
                ✓ Support request transmitted. We will contact you soon.
              </div>
            ) : (
              <div className="text-left space-y-4 animate-fade-in-up">
                <textarea 
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe the issue..." 
                  className="w-full h-32 p-5 text-sm rounded-[1.5rem] bg-slate-50 dark:bg-zinc-800/50 border-transparent focus:bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-primary transition-all resize-none font-medium"
                />
                <Button onClick={handleSupportSubmit} disabled={!supportMessage.trim()} className="w-full h-16 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl dark:shadow-zinc-900/50 shadow-slate-200">
                  Contact Support Terminal
                </Button>
              </div>
            )
          ) : (
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-16 rounded-2xl font-black border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:bg-zinc-800/50 transition-all text-base">Re-establish Connection</Button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <SpeedLoader text="Preparing Your Space" subtext="Setting up the dashboard..." />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    if (status === "verified") return <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50">Verified</span>;
    if (status === "rejected") return <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-100 dark:border-rose-900/50">Rejected</span>;
    return <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-100 dark:border-amber-900/50">Pending</span>;
  };

  const rentPayment = payments.find((p) => p.month === payMonth && p.type === "rent");
  const isRentDue = activeBooking && activeBooking.status === "confirmed" && (!rentPayment || rentPayment.status === "rejected");

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 selection:bg-primary/10 selection:text-primary relative overflow-x-hidden">
      {/* Premium Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none opacity-50 dark:opacity-20" />
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-50 py-5 px-6 md:px-12 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl dark:shadow-zinc-900/60 shadow-primary/30 group cursor-pointer hover:rotate-6 transition-transform duration-500">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-slate-100">Resident Portal</h1>
          </div>
          <div className="flex items-center gap-6">
            <NotificationDropdown userId={userId} />
            <div className="h-8 w-[1px] bg-slate-200/60 hidden md:block" />
            <Button 
              variant="ghost" 
              onClick={() => auth.signOut()}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold transition-all gap-2 hidden md:flex h-11 px-6 rounded-xl"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* Modern Floating Pill Navigation */}
      <div className="bg-transparent pt-6 pb-2 relative z-10">
        <div className="container max-w-7xl mx-auto px-6 flex justify-start">
          <div className="flex gap-2 p-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 rounded-full shadow-sm">
            {([
              { key: "home", label: "Dashboard", icon: Home },
              { key: "payments", label: "Finances", icon: CreditCard },
              { key: "complaints", label: "Support", icon: MessageSquareWarning },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black transition-all uppercase tracking-widest duration-300
                  ${activeTab === tab.key
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl scale-100"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 scale-95"}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
        {activeTab === "home" && (
          <motion.div 
            key="home"
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Welcome, {tenantProfile?.name?.split(" ")[0] || "Resident"}!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Here&apos;s everything about your stay.</p>
              </div>
              <Link href="/search">
                <Button className="h-12 px-6 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl dark:shadow-zinc-900/50 shadow-slate-200 transition-all active:scale-95 gap-2">
                  Find New Property <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            {userId && <VerificationBanner userId={userId} />}

            {/* BIG RENT DUE ALERT */}
            {isRentDue && (
              <motion.div variants={itemVariants} className="bg-gradient-to-br from-rose-500 to-red-600 dark:from-rose-600 dark:to-red-800 p-8 md:p-10 rounded-[3.5rem] shadow-2xl shadow-rose-500/30 text-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex items-center gap-6">
                   <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner">
                      <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
                   </div>
                   <div>
                      <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-1">Rent Payment Due!</h3>
                      <p className="text-rose-100 font-medium max-w-lg">Your rent for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} is currently pending. Please clear your dues immediately to maintain your active stay status.</p>
                   </div>
                </div>
                <div className="relative z-10 w-full md:w-auto">
                   <Button onClick={goToPayPage} disabled={creatingSession} className="w-full md:w-auto h-16 px-10 bg-white hover:bg-rose-50 text-rose-600 font-black rounded-2xl shadow-xl transition-all active:scale-95 text-base">
                      {creatingSession ? "Processing..." : "Pay Rent Now"}
                   </Button>
                </div>
              </motion.div>
            )}

            {/* Premium Info Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={itemVariants} className="lg:col-span-1 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/80 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:bg-white/80 dark:hover:bg-zinc-900/60 transition-all duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-1000" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                      <Home className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Residence</p>
                      <h3 className="font-black text-xl text-slate-900 dark:text-slate-100 tracking-tighter">Stay Terminal</h3>
                    </div>
                  </div>

                  {activeBooking ? (
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors tracking-tighter leading-none">{activeBooking.pgName}</h4>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{activeBooking.roomType}</p>
                      </div>

                      <div className="flex flex-col w-full gap-4 pt-2">
                        {activeBooking.status === "notice_given" ? (
                          <div className="w-full space-y-4">
                            <div className="flex items-center justify-center gap-3 py-3 px-4 bg-rose-50 border border-rose-100 rounded-2xl animate-pulse">
                               <AlertTriangle className="w-4 h-4 text-rose-600" />
                               <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Move-out Active</span>
                            </div>
                            <Button variant="outline" onClick={handleCancelNotice} disabled={leavingRoom} className="w-full h-14 rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50 font-black text-xs shadow-sm dark:shadow-slate-900/50">
                              Recall Notice Terminal
                            </Button>
                          </div>
                        ) : activeBooking.status === "notice_approved" ? (
                          <div className="w-full flex flex-col items-center justify-center gap-2 py-4 px-4 bg-slate-900 rounded-2xl shadow-xl dark:shadow-zinc-900/50 shadow-slate-900/20">
                             <div className="flex items-center gap-3">
                               <Clock className="w-4 h-4 text-white/40" />
                               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Checkout Approved</span>
                             </div>
                             {activeBooking.moveOutDate && (
                               <p className="text-[10px] font-bold text-primary tracking-widest uppercase mt-1">
                                 Departure: {new Date(activeBooking.moveOutDate).toLocaleDateString("en-IN")} @ 5:00 PM
                               </p>
                             )}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-center gap-3 py-3 px-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                               <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Stay Verified</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              onClick={handleLeaveRoom} 
                              disabled={leavingRoom} 
                              className="w-full h-14 rounded-2xl text-rose-600 hover:bg-rose-50 font-black text-xs transition-all"
                            >
                              Initiate Vacate
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-50 dark:bg-zinc-800/50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                       <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm dark:shadow-slate-900/50">
                          <Home className="w-6 h-6 text-slate-200" />
                       </div>
                       <p className="text-slate-400 font-bold text-sm">No active stay detected.</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Documentation & KYC */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Contract Card */}
                 <motion.div variants={itemVariants} className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/80 dark:border-white/5 shadow-lg shadow-slate-200/30 dark:shadow-none hover:shadow-xl hover:bg-white/80 dark:hover:bg-zinc-900/60 transition-all group">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg dark:shadow-zinc-900/50 shadow-slate-200">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal Documents</p>
                        <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">Rental Agreement</h3>
                      </div>
                    </div>
                    {activeContract ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                          <p className="font-black text-slate-900 dark:text-slate-100 truncate">{activeContract.pgName}</p>
                          <p className="text-xs font-bold text-slate-400 mt-1">Started: {new Date(activeContract.moveInDate).toLocaleDateString("en-IN")}</p>
                        </div>
                        <Link href={`/contract/${activeContract.id}`} className="block">
                          <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-zinc-800/50 font-black group-hover:text-primary group-hover:border-primary/30 transition-all">
                            View Full Contract <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <p className="text-slate-400 font-bold py-6">Awaiting contract generation...</p>
                    )}
                 </motion.div>

                 {/* KYC Card */}
                 <motion.div variants={itemVariants} className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/80 dark:border-white/5 shadow-lg shadow-slate-200/30 dark:shadow-none hover:shadow-xl hover:bg-white/80 dark:hover:bg-zinc-900/60 transition-all group">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg dark:shadow-zinc-900/50 shadow-emerald-100">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Status</p>
                        <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">Resident Identity</h3>
                      </div>
                    </div>
                    <div className="space-y-5">
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-black text-slate-900 dark:text-slate-100">Verification Level</span>
                         {statusBadge(isVerified ? "verified" : verificationStatus)}
                       </div>
                       <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                         {isVerified 
                           ? "Your identity is verified. You have full access to all properties and priority support." 
                           : "Complete your identity verification to unlock fast bookings and automated contracts."}
                       </p>
                       {!isVerified && (
                         <Button onClick={() => setShowVerifyModal(true)} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg dark:shadow-zinc-900/50 shadow-emerald-100">
                           Verify Identity Now
                         </Button>
                       )}
                    </div>
                 </motion.div>
              </div>
            </motion.div>

            {/* My Bookings History */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-2xl text-slate-900 dark:text-slate-100 tracking-tight">Recent Activity</h3>
                <span className="text-xs font-bold text-slate-400 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-slate-100">{bookings.length} Events</span>
              </div>
              
              {bookings.length === 0 ? (
                  <div className="bg-white/40 dark:bg-zinc-900/30 backdrop-blur-2xl border border-white/60 dark:border-white/5 rounded-[4rem] p-24 text-center animate-scale-in shadow-2xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
                    <div className="relative z-10 w-24 h-24 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                      <Package className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tighter">No active bookings</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-12 max-w-sm mx-auto text-lg leading-relaxed">Start exploring premium verified properties nearby to find your perfect stay.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {bookings.map((b, i) => (
                     <motion.div variants={itemVariants} key={b.id} className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/80 dark:border-white/5 shadow-lg shadow-slate-200/30 dark:shadow-none hover:shadow-xl hover:bg-white/80 dark:hover:bg-zinc-900/60 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-black text-lg text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{b.pgName}</h4>
                            <p className="text-xs font-bold text-slate-400">{b.roomType} · {b.moveInDate}</p>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl
                            ${b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : b.status === 'pending' || b.status === 'approved' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                            {b.status === 'approved' ? 'ACTION REQ' : b.status}
                          </span>
                        </div>
                        <div className="flex items-end justify-between pt-4 border-t border-slate-50 mt-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Commitment</p>
                            <p className="text-xl font-black text-primary">₹{b.amount.toLocaleString("en-IN")}</p>
                          </div>
                          {b.status === "approved" && (
                            <Button size="sm" onClick={() => payForBooking(b)} disabled={creatingSession} className="bg-primary hover:bg-primary/90 text-white font-black rounded-xl px-6 h-10 shadow-lg dark:shadow-zinc-900/50 shadow-primary/20 animate-pulse">
                              Confirm & Pay
                            </Button>
                          )}
                          {b.status === "confirmed" && (
                            <Button size="sm" variant="outline" onClick={() => { setReviewBooking(b); setIsReviewModalOpen(true); }} className="font-bold text-amber-500 border-amber-200 hover:bg-amber-50 rounded-xl h-10">
                              <Star className="w-3.5 h-3.5 mr-1.5" /> Rate Stay
                            </Button>
                          )}
                          {b.status === "past" && (
                            <Button size="sm" onClick={() => setNocBooking(b)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl px-6 h-10 shadow-lg dark:shadow-zinc-900/50 shadow-emerald-200">
                              View NOC
                            </Button>
                          )}
                          {b.contractId && b.status !== "past" && (
                            <Link href={`/contract/${b.contractId}`}>
                              <Button variant="ghost" size="sm" className="font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 rounded-xl h-10">Details</Button>
                            </Link>
                          )}
                        </div>
                     </motion.div>
                   ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {activeTab === "payments" && (
          <motion.div 
            key="payments"
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <motion.h2 variants={itemVariants} className="text-3xl font-black text-slate-900 dark:text-slate-100">Financial Hub</motion.h2>
            
            {activeBooking && ownerProfile?.upiId ? (
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 {/* Premium Credit Card Payment UI */}
                 <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black p-10 rounded-[3rem] text-white shadow-2xl dark:shadow-zinc-900/60 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/20 transition-all duration-1000" />
                    <div className="relative z-10 space-y-8">
                       <div className="flex justify-between items-start">
                          <div className="w-14 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg shadow-inner flex items-center justify-center">
                            <div className="w-8 h-6 border border-amber-200/50 rounded flex items-center justify-center overflow-hidden">
                               <div className="w-full h-[1px] bg-amber-200/50" />
                            </div>
                          </div>
                          <QrCode className="w-10 h-10 text-white/20" />
                       </div>
                       
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Authorized Payee</p>
                          <p className="text-2xl font-black tracking-tight">{ownerProfile.name}</p>
                       </div>

                       <div className="p-5 bg-white dark:bg-zinc-900/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10 space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/40 tracking-widest">
                             <span>VPA / UPI ID</span>
                             <span className="text-primary font-black">SECURE TRANSIT</span>
                          </div>
                          <p className="text-xl font-mono font-black truncate">{ownerProfile.upiId}</p>
                       </div>

                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Subscription Amount</p>
                             <p className="text-4xl font-black text-white">₹{activeBooking.amount.toLocaleString("en-IN")}</p>
                          </div>
                          <Button 
                             onClick={goToPayPage} 
                             disabled={creatingSession}
                             className="bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:bg-zinc-800 text-slate-950 h-14 px-8 rounded-2xl font-black text-base shadow-xl dark:shadow-zinc-900/50 shadow-white/5 active:scale-95 transition-all"
                          >
                             {creatingSession ? "Authorizing..." : "Initiate Payment →"}
                          </Button>
                       </div>
                    </div>
                 </div>

                 {/* Recent Month Status */}
                 <div className="space-y-6">
                    <h3 className="font-black text-xl text-slate-900 dark:text-slate-100 px-2">Current Cycle</h3>
                    {(() => {
                      const cur = payments.find((p) => p.month === payMonth && p.type === "rent");
                      return cur ? (
                        <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 shadow-sm dark:shadow-slate-900/50
                          ${cur.status === "verified" ? "bg-emerald-50 border-emerald-100" : cur.status === "rejected" ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"}`}>
                           <div className="flex items-center gap-4 mb-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg dark:shadow-zinc-900/50
                                ${cur.status === "verified" ? "bg-emerald-500 text-white" : cur.status === "rejected" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"}`}>
                                 {cur.status === "verified" ? <CheckCircle2 className="w-6 h-6" /> : cur.status === "rejected" ? <XCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                              </div>
                              <h4 className="font-black text-xl text-slate-900 dark:text-slate-100">
                                {cur.status === "verified" ? "Rent Verified" : cur.status === "rejected" ? "Payment Rejected" : "Review Pending"}
                              </h4>
                           </div>
                           <p className="text-slate-600 dark:text-slate-400 font-medium mb-6 leading-relaxed">
                             {cur.status === "verified" ? "Excellent! Your payment for the current month has been verified by the property owner." :
                              cur.status === "rejected" ? "The owner could not verify this transaction. Please re-check the UTR number or contact support." :
                              "Your transaction details are with the owner. Verification usually takes 1-4 hours."}
                          </p>
                           <Link href={`/dashboard/tenant/receipt/${cur.id}`}>
                              <Button variant="outline" className="w-full h-12 rounded-xl bg-white dark:bg-zinc-900 border-transparent shadow-sm dark:shadow-slate-900/50 font-black hover:bg-slate-50 dark:bg-zinc-800/50">Download Receipt</Button>
                           </Link>
                        </div>
                      ) : (
                        <div className="p-10 rounded-[3rem] bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/80 dark:border-white/5 shadow-lg shadow-slate-200/30 dark:shadow-none text-center animate-fade-in-up">
                            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                               <Clock className="w-10 h-10 text-rose-500 animate-pulse" />
                            </div>
                            <h4 className="font-black text-2xl text-slate-900 dark:text-slate-100 mb-3 tracking-tighter">Rent Overdue</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">Payment for {new Date().toLocaleString('default', { month: 'long' })} cycle is pending. Secure your stay by completing the transfer.</p>
                            <Button onClick={goToPayPage} className="w-full h-16 bg-primary text-white font-black rounded-3xl shadow-2xl dark:shadow-zinc-900/60 shadow-primary/20 transition-all active:scale-95 text-base">Pay Rent Instantly</Button>
                         </div>
                      );
                    })()}
                 </div>
              </motion.div>
            ) : (
               <div className="bg-white/40 dark:bg-zinc-900/30 backdrop-blur-2xl border border-white/60 dark:border-white/5 rounded-[4rem] p-24 text-center animate-scale-in shadow-2xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
                  <div className="relative z-10 w-24 h-24 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                    <CreditCard className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tighter">No Payment Targets</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto text-lg leading-relaxed">Once your booking is confirmed and the owner activates their revenue gateway, you can manage finances here.</p>
               </div>
            )}

            {/* Comprehensive History */}
            {payments.length > 0 && (
              <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 dark:border-white/5 shadow-lg shadow-slate-200/30 dark:shadow-none overflow-hidden">
                <div className="px-10 py-6 border-b border-white/40 dark:border-white/5">
                  <h3 className="font-black text-xl text-slate-900 dark:text-slate-100">Transaction History</h3>
                </div>
                <div className="divide-y divide-white/40 dark:divide-white/5">
                   {payments.map((p) => (
                      <div key={p.id} className="px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/80 dark:hover:bg-zinc-800/50 transition-colors">
                         <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                               <Receipt className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div>
                               <p className="font-black text-slate-900 dark:text-slate-100">{p.type === "rent" ? "Monthly Rent" : "Deposit"}</p>
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.month} · {new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto">
                            <div className="text-right">
                               <p className="font-black text-lg text-primary">₹{p.amount.toLocaleString("en-IN")}</p>
                               <div className="flex justify-end mt-1">{statusBadge(p.status)}</div>
                            </div>
                            <Link href={`/dashboard/tenant/receipt/${p.id}`}>
                               <button className="w-10 h-10 rounded-full border border-slate-200 dark:border-zinc-700 flex items-center justify-center hover:border-primary hover:text-primary transition-all">
                                  <ArrowUpRight className="w-4 h-4" />
                               </button>
                            </Link>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "complaints" && (
          <motion.div 
            key="complaints"
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Resident Assistance</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Report issues or request maintenance.</p>
              </div>
              <Button onClick={() => { if (!activeBooking) { alert("You need an active booking to raise a complaint."); return; } setIsComplaintModalOpen(true); }} className="h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-xl dark:shadow-zinc-900/50 shadow-rose-100 transition-all active:scale-95 gap-2">
                <MessageSquareWarning className="w-4 h-4" /> Raise Issue
              </Button>
            </motion.div>

            {complaints.length === 0 ? (
               <div className="bg-white/40 dark:bg-zinc-900/30 backdrop-blur-2xl border border-white/60 dark:border-white/5 rounded-[4rem] p-24 text-center animate-scale-in shadow-2xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
                  <div className="relative z-10 w-24 h-24 bg-emerald-50/80 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tighter">Peace of mind</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto text-lg leading-relaxed">No active support tickets found. Your residence experience is currently optimal.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {complaints.map((c) => (
                    <div key={c.id} className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/80 dark:border-white/5 rounded-[2.5rem] p-8 shadow-lg shadow-slate-200/30 dark:shadow-none hover:shadow-xl hover:bg-white/80 dark:hover:bg-zinc-900/60 transition-all group">
                       <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">{c.category}</span>
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest
                            ${c.status === "open" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                            {c.status.toUpperCase()}
                          </span>
                       </div>
                       <p className="text-slate-800 dark:text-slate-200 font-bold text-lg mb-2 group-hover:text-primary transition-colors leading-snug">{c.description}</p>
                       <div className="pt-4 border-t border-slate-50 mt-4 flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-300">{c.pgName}</p>
                       </div>
                    </div>
                 ))}
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Review Dialog */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8 border-none shadow-2xl dark:shadow-zinc-900/60">
          <form onSubmit={submitReview}>
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Rate Your Stay</DialogTitle>
              <DialogDescription className="font-medium text-slate-500 dark:text-slate-400">How was your experience at {reviewBooking?.pgName}?</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setReviewRating(star)}>
                      <Star className={`w-8 h-8 ${star <= reviewRating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"} hover:scale-110 transition-transform`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Review</label>
                <textarea
                  className="w-full min-h-[100px] rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-transparent p-4 text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white dark:bg-zinc-900 transition-all resize-none font-medium"
                  placeholder="Share your experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-8 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsReviewModalOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
              <Button type="submit" disabled={submittingReview} className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-lg dark:shadow-zinc-900/50 shadow-amber-500/20">
                {submittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modern Dialog Overhaul */}
      <Dialog open={isComplaintModalOpen} onOpenChange={setIsComplaintModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8 border-none shadow-2xl dark:shadow-zinc-900/60">
          <form onSubmit={submitComplaint}>
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Issue Report</DialogTitle>
              <DialogDescription className="font-medium text-slate-500 dark:text-slate-400">Provide details about the issue. Our team will assist you shortly.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                <Select value={complaintCategory} onValueChange={(val) => val && setComplaintCategory(val)}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-transparent focus:ring-primary"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl dark:shadow-zinc-900/60 p-2">
                    <SelectItem value="maintenance" className="rounded-xl p-3"><div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest"><Wrench className="w-4 h-4 text-primary" /> Maintenance</div></SelectItem>
                    <SelectItem value="cleanliness" className="rounded-xl p-3"><div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest"><Eraser className="w-4 h-4 text-primary" /> Cleanliness</div></SelectItem>
                    <SelectItem value="security" className="rounded-xl p-3"><div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest"><Shield className="w-4 h-4 text-primary" /> Security</div></SelectItem>
                    <SelectItem value="other" className="rounded-xl p-3"><div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest"><MessageCircle className="w-4 h-4 text-primary" /> Other Support</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                <textarea
                  className="w-full min-h-[120px] rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border-transparent p-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:bg-zinc-900 transition-all resize-none font-medium"
                  placeholder="Tell us what's wrong..."
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-8 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsComplaintModalOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
              <Button type="submit" disabled={submittingComplaint} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-black rounded-xl shadow-lg dark:shadow-zinc-900/50 shadow-primary/20">
                {submittingComplaint ? "Sending..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Verification Portal Modal */}
      {userId && (
        <VerificationModal
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          userId={userId}
          onSuccess={(finalStatus) => {
            setVerificationStatus(finalStatus);
            if (finalStatus === "verified") setIsVerified(true);
            setShowVerifyModal(false);
          }}
        />
      )}

      {/* NOC Modal */}
      <Dialog open={!!nocBooking} onOpenChange={(open) => !open && setNocBooking(null)}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-0 overflow-hidden">
          <div className="bg-emerald-500 p-8 text-center text-white relative">
             <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <ShieldCheck className="w-10 h-10 text-white" />
             </div>
             <h2 className="text-3xl font-black tracking-tight mb-2">No Objection Certificate</h2>
             <p className="text-emerald-100 font-medium">Clearance & Security Release</p>
          </div>
          <div className="p-8 md:p-12 space-y-8">
             <div className="text-center space-y-4">
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  This document serves as an official confirmation that <strong className="text-slate-900 dark:text-slate-100">{tenantProfile?.name}</strong> has successfully vacated <strong className="text-slate-900 dark:text-slate-100">{nocBooking?.pgName}</strong>.
                </p>
                <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800">
                   <h4 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-2">Clearance Status: Verified</h4>
                   <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">All financial dues, including rent and utility charges for the duration of the stay, have been fully cleared. There are no outstanding claims or pending actions against the tenant.</p>
                </div>
             </div>
             <div className="flex justify-between items-end border-t border-slate-100 dark:border-zinc-800 pt-8 mt-8">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Issued</p>
                   <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{new Date().toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized By</p>
                   <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Savion Management</p>
                </div>
             </div>
             <Button onClick={() => window.print()} className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black rounded-xl shadow-xl dark:shadow-zinc-900/50">
                Print Certificate
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
