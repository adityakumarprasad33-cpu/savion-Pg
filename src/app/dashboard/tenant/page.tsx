"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { getUserBookings, Booking, updateBookingStatus } from "@/lib/db/bookings";
import { getContractsByTenant, RentalContract, updateContractStatus } from "@/lib/db/contracts";
import { getUserComplaints, createComplaint, Complaint } from "@/lib/db/complaints";
import { getPaymentsByTenant, Payment } from "@/lib/db/payments";
import { createPaymentSession } from "@/lib/db/paymentSessions";
import { getUserProfile, UserProfile } from "@/lib/db/users";
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
  Clock, XCircle, Receipt, QrCode
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SpeedLoader } from "@/components/ui/SpeedLoader";


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

  // Complaint Modal
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState("maintenance");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [payMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (userId) {
      Promise.all([
        getUserBookings(userId).then(setBookings),
        getContractsByTenant(userId).then(setContracts),
        getUserComplaints(userId).then(setComplaints),
        getPaymentsByTenant(userId).then(setPayments),
        getUserProfile(userId).then(setTenantProfile),
      ]);
    }
  }, [userId]);

  const activeBooking = bookings.find((b) => b.status === "confirmed" || b.status === "notice_given" || b.status === "notice_approved");
  const activeContract = contracts.find((c) => c.status === "active");

  // Fetch owner profile for UPI ID once we know ownerId
  useEffect(() => {
    if (activeBooking?.ownerId) {
      getUserProfile(activeBooking.ownerId).then(setOwnerProfile);
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

  // Create a SERVER-SIDE session so no URL params can be tampered.
  // Amount, UPI, IDs all come from verified Firestore documents.
  const goToPayPage = async () => {
    if (!activeBooking || !ownerProfile?.upiId || !userId || !tenantProfile) return;
    setCreatingSession(true);
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // Create locked session — data sourced from Firestore, NOT from URL
      const session = await createPaymentSession({
        tenantId: userId,                              // auth.uid — cannot be spoofed
        ownerId: activeBooking.ownerId,                // from booking document
        ownerUpiId: ownerProfile.upiId,               // from owner's Firestore profile
        ownerName: ownerProfile.name,
        pgId: activeBooking.pgId,
        pgName: activeBooking.pgName,
        roomNo: activeBooking.roomType,
        bookingId: activeBooking.id,
        contractId: activeBooking.contractId || "",
        tenantName: tenantProfile.name,
        tenantAadhaar: activeContract?.tenantAadhaarUrl || "",
        amount: activeBooking.amount,                  // from booking — not URL-changeable
        month,
        type: "rent",
      });

      // Navigate with ONLY the opaque session ID
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

    // Check if there are unpaid dues for the current month
    const hasDues = !payments.some(p => p.month === payMonth && p.type === "rent" && p.status === "verified");
    if (hasDues) {
      alert("⚠️ You have pending dues. Please clear all outstanding payments before initiating a move-out notice.");
      return;
    }

    const confirmLeave = confirm("Are you sure you want to give your 7-day move-out notice? This will initiate your cancellation.");
    if (!confirmLeave) return;

    setLeavingRoom(true);
    try {
      // Mark booking as notice_given
      await updateBookingStatus(activeBooking.id, "notice_given");
      // Note: We do NOT terminate the contract here. The owner will terminate it upon final checkout.

      // Notify owner about the 7-day notice
      const { createNotification } = await import("@/lib/db/notifications");
      const moveOutDate = new Date();
      moveOutDate.setDate(moveOutDate.getDate() + 7);

      await createNotification({
        userId: activeBooking.ownerId,
        title: "Move-out Notice Received",
        message: `${tenantProfile?.name || "A tenant"} has given their 7-day notice to vacate ${activeBooking.roomType} at ${activeBooking.pgName}. Expected move-out date: ${moveOutDate.toLocaleDateString("en-IN")}.`,
        type: "system"
      });

      // Update local state
      setBookings(bookings.map(b => b.id === activeBooking.id ? { ...b, status: "notice_given" } : b));

      alert(`Move-out notice submitted. Your move-out date is ${moveOutDate.toLocaleDateString("en-IN")}. The owner has been notified.`);
    } catch (err) {
      console.error("Error leaving room:", err);
      alert("Failed to submit notice. Please try again.");
    } finally {
      setLeavingRoom(false);
    }
  };

  const handleCancelNotice = async () => {
    if (!activeBooking) return;
    const confirmCancel = confirm("Are you sure you want to cancel your move-out notice and continue your stay?");
    if (!confirmCancel) return;

    try {
      setLeavingRoom(true);
      await updateBookingStatus(activeBooking.id, "confirmed");
      setBookings(bookings.map(b => b.id === activeBooking.id ? { ...b, status: "confirmed" } : b));
      alert("Move-out notice cancelled successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to cancel notice. Please try again.");
    } finally {
      setLeavingRoom(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold mt-3 mb-2">Connection Error</h2>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <SpeedLoader text="Loading Dashboard" subtext="Fetching your details..." />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    if (status === "verified") return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Verified ✅</span>;
    if (status === "rejected") return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Rejected ❌</span>;
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">Pending ⏳</span>;
  };

  const currentMonthPayment = payments.find(
    (p) => p.month === payMonth && p.type === "rent"
  );

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow animate-fade-in-down">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Tenant Dashboard</h1>
          <div className="flex items-center gap-4">
            <NotificationDropdown userId={userId} />
            <Button variant="secondary" onClick={() => auth.signOut()}>Log Out</Button>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-6 flex gap-1">
          {([
            { key: "home", label: "🏠 Home", icon: Home },
            { key: "payments", label: "💳 Pay Rent", icon: CreditCard },
            { key: "complaints", label: "📋 Complaints", icon: MessageSquareWarning },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-10 bg-slate-50 container mx-auto max-w-5xl">

        {/* ─── HOME TAB ─── */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold">Welcome back, {tenantProfile?.name?.split(" ")[0] || "Tenant"}! 👋</h2>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
              <div className="border rounded-xl p-6 bg-white shadow-sm border-l-4 border-l-primary animate-fade-in-up hover-lift">
                <div className="flex items-center gap-3 mb-3"><Home className="w-5 h-5 text-primary" /><h3 className="font-bold text-lg">Current Stay</h3></div>
                {activeBooking ? (
                  <>
                    <p className="font-bold text-xl">{activeBooking.pgName}</p>
                    <p className="text-sm text-muted-foreground mt-1">{activeBooking.roomType}</p>
                    <div className="flex items-center justify-between mt-4">
                      {activeBooking.status === "notice_given" ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-block text-xs bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full font-bold">⚠️ Notice Given (Awaiting Owner Approval)</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelNotice}
                            disabled={leavingRoom}
                            className="text-xs h-7 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                          >
                            Cancel Notice
                          </Button>
                        </div>
                      ) : activeBooking.status === "notice_approved" ? (
                        <span className="inline-block text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full font-bold">ℹ️ Notice Approved (Moving out in 7 days)</span>
                      ) : (
                        <>
                          <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Confirmed</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleLeaveRoom}
                            disabled={leavingRoom}
                            className="text-xs h-7"
                          >
                            {leavingRoom ? "Processing..." : "Give 7-Day Notice"}
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">No active booking yet</p>
                )}
              </div>

              <div className="border rounded-xl p-6 bg-white shadow-sm border-l-4 border-l-blue-500 animate-fade-in-up hover-lift">
                <div className="flex items-center gap-3 mb-3"><FileText className="w-5 h-5 text-blue-500" /><h3 className="font-bold text-lg">Rental Contract</h3></div>
                {activeContract ? (
                  <>
                    <p className="font-semibold">{activeContract.pgName}</p>
                    <p className="text-sm text-muted-foreground mt-1">Move-in: {new Date(activeContract.moveInDate).toLocaleDateString("en-IN")}</p>
                    <Link href={`/contract/${activeContract.id}`}><button className="mt-2 text-xs text-blue-600 hover:underline font-semibold">View Contract →</button></Link>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">No contract yet</p>
                )}
              </div>

              <div className="border rounded-xl p-6 bg-white shadow-sm border-l-4 border-l-green-500 animate-fade-in-up hover-lift">
                <div className="flex items-center gap-3 mb-3"><CheckCircle2 className="w-5 h-5 text-green-500" /><h3 className="font-bold text-lg">KYC Status</h3></div>
                {activeBooking?.aadhaarUrl ? (
                  <>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Verified</span>
                    <p className="text-xs text-muted-foreground mt-2">Documents submitted and on file.</p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Book a room to submit your KYC.</p>
                )}
              </div>
            </div>

            {/* Bookings */}
            <div className="bg-white rounded-xl shadow-sm border p-6 animate-fade-in-up">
              <h3 className="font-bold text-xl mb-4 border-b pb-2">My Bookings</h3>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🏠</p>
                  <p className="font-semibold text-lg mb-1">No bookings yet</p>
                  <p className="text-muted-foreground text-sm mb-4">Browse PGs and book your next home.</p>
                  <Link href="/search"><Button>Browse Properties</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div key={b.id} className={`border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 card-hover transition-all
                      ${b.status === 'pending' ? 'border-yellow-200 bg-yellow-50/40' : b.status === 'confirmed' ? 'border-green-200 bg-green-50/20' : 'border-red-200 bg-red-50/20'}
                    `}>
                      <div>
                        <p className="font-bold">{b.pgName}</p>
                        <p className="text-sm text-muted-foreground">{b.roomType} · Move-in: {b.moveInDate}</p>
                        <p className="text-sm font-semibold text-primary mt-1">₹{b.amount.toLocaleString("en-IN")}/mo</p>
                        {b.status === "pending" && (
                          <p className="text-xs text-yellow-700 font-medium mt-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Waiting for owner to approve your request...
                          </p>
                        )}
                        {b.status === "cancelled" && (
                          <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Booking was rejected by the owner.
                          </p>
                        )}
                        {b.status === "confirmed" && (
                          <p className="text-xs text-green-700 font-medium mt-1.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Approved! You can now pay rent.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${b.status === "confirmed" ? "bg-green-100 text-green-700" :
                            b.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                          }`}>{b.status.toUpperCase()}</span>
                        {b.contractId && (
                          <Link href={`/contract/${b.contractId}`}>
                            <Button variant="outline" size="sm" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Contract</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6 animate-fade-in-up">
              <h3 className="font-bold text-xl mb-4 border-b pb-2">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link href="/search">
                  <button className="w-full border rounded-xl p-4 text-left hover:border-primary/40 hover:bg-orange-50 transition-all card-hover">
                    <p className="font-semibold">🔍 Find a PG</p>
                    <p className="text-sm text-muted-foreground mt-1">Browse verified properties near you</p>
                  </button>
                </Link>
                <button onClick={() => setActiveTab("payments")} className="w-full border rounded-xl p-4 text-left hover:border-primary/40 hover:bg-orange-50 transition-all card-hover">
                  <p className="font-semibold">💳 Pay Rent</p>
                  <p className="text-sm text-muted-foreground mt-1">Submit your monthly rent payment</p>
                </button>
                <button
                  onClick={() => { if (!activeBooking) { alert("You need an active booking to raise a complaint."); return; } setIsComplaintModalOpen(true); }}
                  className="w-full border rounded-xl p-4 text-left hover:border-primary/40 hover:bg-orange-50 transition-all card-hover"
                >
                  <p className="font-semibold">📋 Raise a Complaint</p>
                  <p className="text-sm text-muted-foreground mt-1">Report maintenance or property issues</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── PAYMENTS TAB ─── */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold">💳 Pay Rent</h2>

            {!activeBooking ? (
              <div className="bg-white rounded-2xl border p-10 text-center shadow-sm">
                <p className="text-4xl mb-3">🏠</p>
                <p className="font-bold text-lg mb-2">No active booking</p>
                <p className="text-muted-foreground text-sm">You need a confirmed booking before you can pay rent.</p>
                <Link href="/search" className="mt-4 inline-block"><Button>Find a PG</Button></Link>
              </div>
            ) : !ownerProfile?.upiId ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
                <p className="text-3xl mb-2">⏳</p>
                <p className="font-bold text-yellow-800">Owner hasn&apos;t set up UPI yet</p>
                <p className="text-sm text-yellow-700 mt-1">Your owner hasn&apos;t configured their UPI ID. Please contact them directly.</p>
              </div>
            ) : (
              <>
                {/* Pay Now Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-7 shadow-xl">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-xs opacity-60 uppercase tracking-wider mb-1">Pay Rent To</p>
                      <p className="text-2xl font-black">{ownerProfile.name}</p>
                      <p className="text-sm opacity-70 mt-1">{activeBooking.pgName} · {activeBooking.roomType}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <QrCode className="w-8 h-8 text-white/70" />
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 mb-5">
                    <p className="text-xs opacity-60 mb-0.5">UPI ID</p>
                    <p className="font-mono font-bold text-lg">{ownerProfile.upiId}</p>
                  </div>
                  <p className="text-2xl font-black mb-1">₹{activeBooking.amount.toLocaleString("en-IN")}<span className="text-base font-normal opacity-60">/mo</span></p>
                  <button
                    onClick={goToPayPage}
                    disabled={creatingSession}
                    className="w-full mt-4 bg-white text-slate-900 font-black text-base py-3.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creatingSession ? (
                      <><div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" /> Preparing secure session...</>
                    ) : (
                      <><QrCode className="w-5 h-5" /> Scan QR &amp; Pay Now →</>
                    )}
                  </button>
                  <p className="text-xs opacity-50 text-center mt-3">Opens a UPI QR code · 10-minute payment window</p>
                </div>

                {/* Current month payment status */}
                {(() => {
                  const cur = payments.find((p) => p.month === payMonth && p.type === "rent");
                  if (!cur) return null;
                  return (
                    <div className={`rounded-xl border p-4 flex items-center gap-3 ${cur.status === "verified" ? "bg-green-50 border-green-200" :
                        cur.status === "rejected" ? "bg-red-50 border-red-200" :
                          "bg-yellow-50 border-yellow-200"
                      }`}>
                      {cur.status === "verified" ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" /> :
                        cur.status === "rejected" ? <XCircle className="w-5 h-5 text-red-600 shrink-0" /> :
                          <Clock className="w-5 h-5 text-yellow-600 shrink-0" />}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {cur.status === "verified" ? "✅ Rent paid & verified for this month!" :
                            cur.status === "rejected" ? "❌ Payment rejected — scan QR and pay again" :
                              "⏳ Payment submitted — awaiting owner verification"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">₹{cur.amount.toLocaleString("en-IN")} · UTR: {cur.utrNumber}</p>
                      </div>
                      <Link href={`/dashboard/tenant/receipt/${cur.id}`}>
                        <Button size="sm" variant="outline" className="gap-1.5 shrink-0"><Receipt className="w-3.5 h-3.5" /> Receipt</Button>
                      </Link>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Payment History */}
            {payments.length > 0 && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h3 className="font-bold text-lg">Payment History</h3>
                </div>
                <div className="divide-y">
                  {payments.map((p) => (
                    <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{p.type === "rent" ? "Monthly Rent" : "Security Deposit"}</p>
                          {statusBadge(p.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">{p.month} · UTR: <span className="font-mono">{p.utrNumber}</span></p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary">₹{p.amount.toLocaleString("en-IN")}</p>
                        <Link href={`/dashboard/tenant/receipt/${p.id}`}>
                          <button className="text-xs text-blue-600 hover:underline mt-0.5 flex items-center gap-1"><Receipt className="w-3 h-3" /> Receipt</button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── COMPLAINTS TAB ─── */}
        {activeTab === "complaints" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">📋 Complaints</h2>
              <Button onClick={() => { if (!activeBooking) { alert("You need an active booking to raise a complaint."); return; } setIsComplaintModalOpen(true); }} className="gap-2">
                <MessageSquareWarning className="w-4 h-4" /> Raise Complaint
              </Button>
            </div>
            {complaints.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center shadow-sm">
                <p className="text-4xl mb-3">✅</p>
                <p className="font-bold text-lg">No complaints raised</p>
                <p className="text-muted-foreground text-sm mt-1">Everything looks good!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((c) => (
                  <div key={c.id} className="bg-white border rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold capitalize bg-slate-100 px-2 py-0.5 rounded text-slate-700">{c.category}</span>
                        <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>
                      <p className="text-sm mt-1">{c.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Property: {c.pgName}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${c.status === "open" ? "bg-red-100 text-red-700" :
                        c.status === "in-progress" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                      }`}>{c.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Complaint Dialog */}
      <Dialog open={isComplaintModalOpen} onOpenChange={setIsComplaintModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={submitComplaint}>
            <DialogHeader>
              <DialogTitle>Raise a Complaint</DialogTitle>
              <DialogDescription>Submit an issue to your PG owner or caretaker. We will notify them immediately.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={complaintCategory} onValueChange={(val) => val && setComplaintCategory(val)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="cleanliness">Cleanliness & Hygiene</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Please describe the issue in detail..."
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsComplaintModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submittingComplaint}>{submittingComplaint ? "Submitting..." : "Submit Complaint"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
