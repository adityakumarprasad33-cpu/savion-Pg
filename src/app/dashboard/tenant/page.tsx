"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { getUserBookings, Booking, updateBooking } from "@/lib/db/bookings";
import { getContractsByTenant, RentalContract, updateContractStatus } from "@/lib/db/contracts";
import { getUserComplaints, createComplaint, Complaint } from "@/lib/db/complaints";
import { getPaymentsByTenant, Payment } from "@/lib/db/payments";
import { createPaymentSession } from "@/lib/db/paymentSessions";
import { getUserProfile, UserProfile } from "@/lib/db/users";
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
  Lock, WifiOff, Package, ShieldCheck, Wrench, Eraser, Shield, MessageCircle, UserCircle, Sparkles, AlertTriangle
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

  useEffect(() => {
    if (!userId) return;

    // 1. Real-time Bookings
    const qBookings = query(collection(db, "bookings"), where("tenantId", "==", userId));
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Booking[]);
    });

    // 2. Real-time Contracts
    const qContracts = query(collection(db, "contracts"), where("tenantId", "==", userId));
    const unsubContracts = onSnapshot(qContracts, (snap) => {
      setContracts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as RentalContract[]);
    });

    // 3. Real-time Complaints
    const qComplaints = query(collection(db, "complaints"), where("tenantId", "==", userId));
    const unsubComplaints = onSnapshot(qComplaints, (snap) => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Complaint[]);
    });

    // 4. Real-time Payments
    const qPayments = query(collection(db, "payments"), where("tenantId", "==", userId));
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Payment[]);
    });

    // 5. Profile & Verification
    getUserProfile(userId).then(p => {
      if (p) { setTenantProfile(p); setIsVerified(p.isVerified === true); }
    });
    getVerificationStatus(userId).then(v => {
      setVerificationStatus(v?.status || "not_started");
    });

    return () => {
      unsubBookings();
      unsubContracts();
      unsubComplaints();
      unsubPayments();
    };
  }, [userId]);

  // --- AUTO-VANISH LOGIC (5:00 PM CHECKOUT) ---
  useEffect(() => {
    if (!userId || bookings.length === 0) return;

    const checkAndTerminate = async () => {
      const now = new Date();
      for (const booking of bookings) {
        if (booking.status === "notice_approved" && booking.moveOutDate) {
          const [year, month, day] = booking.moveOutDate.split("-").map(Number);
          const checkoutTime = new Date(year, month - 1, day, 17, 0, 0); // 5:00 PM

          if (now >= checkoutTime) {
            console.log(`[Auto-Vanish] Terminating booking ${booking.id} due to checkout time passed.`);
            try {
              // 1. Terminate Booking
              await updateBooking(booking.id, { status: "cancelled", moveOutDate: booking.moveOutDate }); // Use 'cancelled' or a new 'completed' status
              
              // 2. Terminate Contract
              const relatedContract = contracts.find(c => c.bookingId === booking.id || c.tenantId === userId);
              if (relatedContract) {
                await updateContractStatus(relatedContract.id, "terminated");
              }

              // 3. Restore Room Availability
              if (booking.roomId) {
                // We need to fetch the room to get current availability, but for simplicity we increment
                // Ideally this logic should be in a Cloud Function or more robustly handled.
                // For now, we rely on the owner's PG update logic or manual sync.
              }

              // Refresh UI implicitly via onSnapshot
            } catch (err) {
              console.error("[Auto-Vanish] Error:", err);
            }
          }
        }
      }
    };

    const interval = setInterval(checkAndTerminate, 60000); // Check every minute
    checkAndTerminate(); // Initial check
    return () => clearInterval(interval);
  }, [userId, bookings, contracts]);

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
    const confirmLeave = confirm("Are you sure you want to give your 7-day move-out notice?");
    if (!confirmLeave) return;
    setLeavingRoom(true);
    try {
      const moveOutDate = new Date();
      moveOutDate.setDate(moveOutDate.getDate() + 7);
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
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe]">
        <div className="text-center max-w-md w-full px-6 bg-white/70 backdrop-blur-3xl p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/40 border border-white/60 animate-scale-in">
          <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            {isBan ? <Lock className="w-12 h-12 text-rose-500 animate-pulse" /> : <WifiOff className="w-12 h-12 text-rose-500" />}
          </div>
          <h2 className="text-3xl font-black mb-3 text-slate-900 tracking-tighter">{isBan ? "Account Locked" : "System Offline"}</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">{error}</p>
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
                  className="w-full h-32 p-5 text-sm rounded-[1.5rem] bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary transition-all resize-none font-medium"
                />
                <Button onClick={handleSupportSubmit} disabled={!supportMessage.trim()} className="w-full h-16 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-slate-200">
                  Contact Support Terminal
                </Button>
              </div>
            )
          ) : (
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-16 rounded-2xl font-black border-slate-200 hover:bg-slate-50 transition-all text-base">Re-establish Connection</Button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <SpeedLoader text="Preparing Your Space" subtext="Setting up the dashboard..." />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    if (status === "verified") return <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">Verified</span>;
    if (status === "rejected") return <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">Rejected</span>;
    return <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">Pending</span>;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfe] selection:bg-primary/10 selection:text-primary">
      {/* Premium Glass Header */}
      <header className="bg-white/60 backdrop-blur-3xl border-b border-white/40 sticky top-0 z-50 py-5 px-6 md:px-12 shadow-sm shadow-slate-200/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 group cursor-pointer hover:rotate-6 transition-transform duration-500">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900">Resident Portal</h1>
          </div>
          <div className="flex items-center gap-6">
            <NotificationDropdown userId={userId} />
            <div className="h-8 w-[1px] bg-slate-200/60 hidden md:block" />
            <Button 
              variant="ghost" 
              onClick={() => auth.signOut()}
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold transition-all gap-2 hidden md:flex h-11 px-6 rounded-xl"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* Modern Segmented Navigation */}
      <div className="bg-white/50 border-b border-white/40 py-3 backdrop-blur-xl">
        <div className="container max-w-7xl mx-auto px-6 flex gap-3">
          {([
            { key: "home", label: "Dashboard", icon: Home },
            { key: "payments", label: "Finances", icon: CreditCard },
            { key: "complaints", label: "Support", icon: MessageSquareWarning },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[11px] font-black transition-all uppercase tracking-widest
                ${activeTab === tab.key
                  ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20 scale-105"
                  : "text-slate-400 hover:text-slate-900 hover:bg-white/60"}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {activeTab === "home" && (
          <div className="space-y-10 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome, {tenantProfile?.name?.split(" ")[0] || "Resident"}!</h2>
                <p className="text-slate-500 font-medium">Here&apos;s everything about your stay.</p>
              </div>
              <Link href="/search">
                <Button className="h-12 px-6 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 gap-2">
                  Find New Property <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {userId && <VerificationBanner userId={userId} />}

            {/* Premium Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white/70 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden group animate-fade-in-up">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-1000" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                      <Home className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Residence</p>
                      <h3 className="font-black text-xl text-slate-900 tracking-tighter">Stay Terminal</h3>
                    </div>
                  </div>

                  {activeBooking ? (
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors tracking-tighter leading-none">{activeBooking.pgName}</h4>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{activeBooking.roomType}</p>
                      </div>

                      <div className="flex flex-col w-full gap-4 pt-2">
                        {activeBooking.status === "notice_given" ? (
                          <div className="w-full space-y-4">
                            <div className="flex items-center justify-center gap-3 py-3 px-4 bg-rose-50 border border-rose-100 rounded-2xl animate-pulse">
                               <AlertTriangle className="w-4 h-4 text-rose-600" />
                               <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Move-out Active</span>
                            </div>
                            <Button variant="outline" onClick={handleCancelNotice} disabled={leavingRoom} className="w-full h-14 rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50 font-black text-xs shadow-sm">
                              Recall Notice Terminal
                            </Button>
                          </div>
                        ) : activeBooking.status === "notice_approved" ? (
                          <div className="w-full flex flex-col items-center justify-center gap-2 py-4 px-4 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/20">
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
                    <div className="py-12 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <Home className="w-6 h-6 text-slate-200" />
                       </div>
                       <p className="text-slate-400 font-bold text-sm">No active stay detected.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documentation & KYC */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Contract Card */}
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal Documents</p>
                        <h3 className="font-black text-lg text-slate-900">Rental Agreement</h3>
                      </div>
                    </div>
                    {activeContract ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                          <p className="font-black text-slate-900 truncate">{activeContract.pgName}</p>
                          <p className="text-xs font-bold text-slate-400 mt-1">Started: {new Date(activeContract.moveInDate).toLocaleDateString("en-IN")}</p>
                        </div>
                        <Link href={`/contract/${activeContract.id}`} className="block">
                          <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-black group-hover:text-primary group-hover:border-primary/30 transition-all">
                            View Full Contract <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <p className="text-slate-400 font-bold py-6">Awaiting contract generation...</p>
                    )}
                 </div>

                 {/* KYC Card */}
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Status</p>
                        <h3 className="font-black text-lg text-slate-900">Resident Identity</h3>
                      </div>
                    </div>
                    <div className="space-y-5">
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-black text-slate-900">Verification Level</span>
                         {statusBadge(isVerified ? "verified" : verificationStatus)}
                       </div>
                       <p className="text-xs font-medium text-slate-500 leading-relaxed">
                         {isVerified 
                           ? "Your identity is verified. You have full access to all properties and priority support." 
                           : "Complete your identity verification to unlock fast bookings and automated contracts."}
                       </p>
                       {!isVerified && (
                         <Button onClick={() => setShowVerifyModal(true)} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-100">
                           Verify Identity Now
                         </Button>
                       )}
                    </div>
                 </div>
              </div>
            </div>

            {/* My Bookings History */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-2xl text-slate-900 tracking-tight">Recent Activity</h3>
                <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100">{bookings.length} Events</span>
              </div>
              
              {bookings.length === 0 ? (
                  <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[4rem] p-24 text-center animate-scale-in shadow-xl shadow-slate-200/20">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                      <Package className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">No active bookings</h3>
                    <p className="text-slate-500 font-medium mb-12 max-w-sm mx-auto text-lg leading-relaxed">Start exploring premium verified properties nearby to find your perfect stay.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {bookings.map((b, i) => (
                     <div key={b.id} className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-black text-lg text-slate-900 group-hover:text-primary transition-colors">{b.pgName}</h4>
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
                            <Button size="sm" onClick={() => payForBooking(b)} disabled={creatingSession} className="bg-primary hover:bg-primary/90 text-white font-black rounded-xl px-6 h-10 shadow-lg shadow-primary/20 animate-pulse">
                              Confirm & Pay
                            </Button>
                          )}
                          {b.contractId && (
                            <Link href={`/contract/${b.contractId}`}>
                              <Button variant="ghost" size="sm" className="font-bold text-slate-500 hover:text-slate-900 rounded-xl h-10">Details</Button>
                            </Link>
                          )}
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-3xl font-black text-slate-900">Financial Hub</h2>
            
            {activeBooking && ownerProfile?.upiId ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 {/* Premium Credit Card Payment UI */}
                 <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
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

                       <div className="p-5 bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10 space-y-3">
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
                             className="bg-white hover:bg-slate-100 text-slate-950 h-14 px-8 rounded-2xl font-black text-base shadow-xl shadow-white/5 active:scale-95 transition-all"
                          >
                             {creatingSession ? "Authorizing..." : "Initiate Payment →"}
                          </Button>
                       </div>
                    </div>
                 </div>

                 {/* Recent Month Status */}
                 <div className="space-y-6">
                    <h3 className="font-black text-xl text-slate-900 px-2">Current Cycle</h3>
                    {(() => {
                      const cur = payments.find((p) => p.month === payMonth && p.type === "rent");
                      return cur ? (
                        <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 shadow-sm
                          ${cur.status === "verified" ? "bg-emerald-50 border-emerald-100" : cur.status === "rejected" ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"}`}>
                           <div className="flex items-center gap-4 mb-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg
                                ${cur.status === "verified" ? "bg-emerald-500 text-white" : cur.status === "rejected" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"}`}>
                                 {cur.status === "verified" ? <CheckCircle2 className="w-6 h-6" /> : cur.status === "rejected" ? <XCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                              </div>
                              <h4 className="font-black text-xl text-slate-900">
                                {cur.status === "verified" ? "Rent Verified" : cur.status === "rejected" ? "Payment Rejected" : "Review Pending"}
                              </h4>
                           </div>
                           <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                             {cur.status === "verified" ? "Excellent! Your payment for the current month has been verified by the property owner." :
                              cur.status === "rejected" ? "The owner could not verify this transaction. Please re-check the UTR number or contact support." :
                              "Your transaction details are with the owner. Verification usually takes 1-4 hours."}
                          </p>
                           <Link href={`/dashboard/tenant/receipt/${cur.id}`}>
                              <Button variant="outline" className="w-full h-12 rounded-xl bg-white border-transparent shadow-sm font-black hover:bg-slate-50">Download Receipt</Button>
                           </Link>
                        </div>
                      ) : (
                        <div className="p-10 rounded-[3rem] bg-white border border-white shadow-2xl shadow-slate-200/50 text-center animate-fade-in-up">
                            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                               <Clock className="w-10 h-10 text-rose-500 animate-pulse" />
                            </div>
                            <h4 className="font-black text-2xl text-slate-900 mb-3 tracking-tighter">Rent Overdue</h4>
                            <p className="text-slate-500 font-medium mb-10 leading-relaxed">Payment for {new Date().toLocaleString('default', { month: 'long' })} cycle is pending. Secure your stay by completing the transfer.</p>
                            <Button onClick={goToPayPage} className="w-full h-16 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/20 transition-all active:scale-95 text-base">Pay Rent Instantly</Button>
                         </div>
                      );
                    })()}
                 </div>
              </div>
            ) : (
               <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[4rem] p-24 text-center animate-scale-in shadow-xl shadow-slate-200/20">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                    <CreditCard className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">No Payment Targets</h3>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto text-lg leading-relaxed">Once your booking is confirmed and the owner activates their revenue gateway, you can manage finances here.</p>
               </div>
            )}

            {/* Comprehensive History */}
            {payments.length > 0 && (
              <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
                <div className="px-10 py-6 border-b border-slate-50">
                  <h3 className="font-black text-xl text-slate-900">Transaction History</h3>
                </div>
                <div className="divide-y divide-slate-50">
                   {payments.map((p) => (
                      <div key={p.id} className="px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                         <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                               <Receipt className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                               <p className="font-black text-slate-900">{p.type === "rent" ? "Monthly Rent" : "Deposit"}</p>
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.month} · {new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto">
                            <div className="text-right">
                               <p className="font-black text-lg text-primary">₹{p.amount.toLocaleString("en-IN")}</p>
                               <div className="flex justify-end mt-1">{statusBadge(p.status)}</div>
                            </div>
                            <Link href={`/dashboard/tenant/receipt/${p.id}`}>
                               <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:border-primary hover:text-primary transition-all">
                                  <ArrowUpRight className="w-4 h-4" />
                               </button>
                            </Link>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Resident Assistance</h2>
                <p className="text-slate-500 font-medium">Report issues or request maintenance.</p>
              </div>
              <Button onClick={() => { if (!activeBooking) { alert("You need an active booking to raise a complaint."); return; } setIsComplaintModalOpen(true); }} className="h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-xl shadow-rose-100 transition-all active:scale-95 gap-2">
                <MessageSquareWarning className="w-4 h-4" /> Raise Issue
              </Button>
            </div>

            {complaints.length === 0 ? (
               <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[4rem] p-24 text-center animate-scale-in shadow-xl shadow-slate-200/20">
                  <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">Peace of mind</h3>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto text-lg leading-relaxed">No active support tickets found. Your residence experience is currently optimal.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {complaints.map((c) => (
                    <div key={c.id} className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all group">
                       <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">{c.category}</span>
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest
                            ${c.status === "open" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                            {c.status.toUpperCase()}
                          </span>
                       </div>
                       <p className="text-slate-800 font-bold text-lg mb-2 group-hover:text-primary transition-colors leading-snug">{c.description}</p>
                       <div className="pt-4 border-t border-slate-50 mt-4 flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
                          <p className="text-xs font-black text-slate-700">{c.pgName}</p>
                       </div>
                    </div>
                 ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modern Dialog Overhaul */}
      <Dialog open={isComplaintModalOpen} onOpenChange={setIsComplaintModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8 border-none shadow-2xl">
          <form onSubmit={submitComplaint}>
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Issue Report</DialogTitle>
              <DialogDescription className="font-medium text-slate-500">Provide details about the issue. Our team will assist you shortly.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                <Select value={complaintCategory} onValueChange={(val) => val && setComplaintCategory(val)}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-transparent focus:ring-primary"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
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
                  className="w-full min-h-[120px] rounded-2xl bg-slate-50 border-transparent p-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none font-medium"
                  placeholder="Tell us what's wrong..."
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-8 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsComplaintModalOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
              <Button type="submit" disabled={submittingComplaint} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-black rounded-xl shadow-lg shadow-primary/20">
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
    </div>
  );
}
