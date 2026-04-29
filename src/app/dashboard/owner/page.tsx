"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { getPGsByOwner, deletePG, PG } from "@/lib/db/pgs";
import { getComplaintsByPG } from "@/lib/db/complaints";
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/db/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Edit, Trash2, QrCode, CheckCircle2 } from "lucide-react";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { SpeedLoader } from "@/components/ui/SpeedLoader";
import { getBookingsByOwner } from "@/lib/db/bookings";
import { getPaymentsByOwner } from "@/lib/db/payments";

export default function OwnerDashboard() {
  const { loading, userId: ownerId, error } = useRoleGuard("owner");
  const [pgs, setPgs] = useState<PG[]>([]);
  const [openComplaintsCount, setOpenComplaintsCount] = useState(0);
  const [activeTenants, setActiveTenants] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [upiInput, setUpiInput] = useState("");
  const [upiSaved, setUpiSaved] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);

  useEffect(() => {
    if (ownerId) {
      getPGsByOwner(ownerId).then(async (fetchedPgs) => {
        setPgs(fetchedPgs);
        if (fetchedPgs.length > 0) {
          const promises = fetchedPgs.map(pg => getComplaintsByPG(pg.id));
          const results = await Promise.all(promises);
          const allComplaints = results.flat();
          const openCount = allComplaints.filter(c => c.status !== "resolved").length;
          setOpenComplaintsCount(openCount);
        }
      });

      // Fetch active tenants (confirmed bookings)
      getBookingsByOwner(ownerId).then((bookings) => {
        const confirmed = bookings.filter(b => b.status === "confirmed");
        setActiveTenants(confirmed.length);
      });

      // Fetch this month's revenue (verified payments)
      getPaymentsByOwner(ownerId).then((payments) => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const thisMonthVerified = payments
          .filter(p => p.status === "verified" && p.month === currentMonth)
          .reduce((sum, p) => sum + p.amount, 0);
        setMonthlyRevenue(thisMonthVerified);
      });

      getUserProfile(ownerId).then(p => {
        if (p) { setOwnerProfile(p); setUpiInput(p.upiId || ""); }
      });
    }
  }, [ownerId]);

  const handleSaveUpi = async () => {
    if (!ownerId) return;
    setSavingUpi(true);
    await updateUserProfile(ownerId, { upiId: upiInput.trim() });
    setOwnerProfile(prev => prev ? { ...prev, upiId: upiInput.trim() } : prev);
    setUpiSaved(true);
    setSavingUpi(false);
    setTimeout(() => setUpiSaved(false), 3000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete '${name}'? This cannot be undone.`)) {
      await deletePG(id);
      setPgs(pgs.filter(pg => pg.id !== id));
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Database Connection Error</h2>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <p className="text-xs text-muted-foreground bg-slate-50 rounded-lg p-3 text-left">
            👉 Go to <strong>Firebase Console → Firestore → Rules</strong> and update them. See CHANGES.txt for the correct rules.
          </p>
          <Button className="mt-4" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <SpeedLoader text="Loading Dashboard" subtext="Fetching property data..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <header className="bg-slate-900 text-white py-4 px-6 shadow animate-fade-in-down">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Owner Dashboard</h1>
          <div className="flex items-center gap-4">
            <NotificationDropdown userId={ownerId} />
            <Button variant="secondary" onClick={() => auth.signOut()}>Log Out</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-12 bg-slate-50 container mx-auto">
        <div className="flex justify-between items-center mb-6 animate-fade-in-up">
          <h2 className="text-2xl font-bold">Property Portfolio</h2>
          <Link href="/dashboard/owner/add-pg">
            <Button className="font-bold">Add New PG</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 stagger">
          <div className="border rounded-xl p-6 bg-white shadow-sm border-l-4 border-l-blue-500 animate-fade-in-up hover-lift">
            <h3 className="font-bold text-lg mb-1">Total PGs</h3>
            <p className="text-3xl font-black animate-count-up">{pgs.length}</p>
          </div>
          <div className="border rounded-xl p-6 bg-white shadow-sm border-l-4 border-l-green-500 animate-fade-in-up hover-lift">
            <h3 className="font-bold text-lg mb-1">Active Tenants</h3>
            <p className="text-3xl font-black">{activeTenants}</p>
          </div>
          <div className="border rounded-xl p-6 bg-white shadow-sm border-l-4 border-l-yellow-500 animate-fade-in-up hover-lift">
            <h3 className="font-bold text-lg mb-1">Monthly Revenue</h3>
            <p className="text-3xl font-black">{monthlyRevenue > 0 ? `₹${monthlyRevenue.toLocaleString("en-IN")}` : "₹0"}</p>
          </div>
          <div className="border rounded-xl p-6 bg-white shadow-sm border-l-4 border-l-red-500 animate-fade-in-up hover-lift">
            <h3 className="font-bold text-lg mb-1">Open Complaints</h3>
            <p className="text-3xl font-black">{openComplaintsCount}</p>
          </div>
        </div>

        {/* UPI Payment Settings */}
        <div className="bg-white border rounded-xl p-6 mb-8 shadow-sm animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Payment Settings — Your UPI ID</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Tenants will see this UPI ID and pay rent directly to you. Make sure it&apos;s correct.</p>
          <div className="flex gap-3 items-center max-w-md">
            <Input
              placeholder="e.g. yourname@ybl or 9876543210@paytm"
              value={upiInput}
              onChange={(e) => setUpiInput(e.target.value)}
              className="h-11 font-mono"
            />
            <Button onClick={handleSaveUpi} disabled={savingUpi || !upiInput.trim()} className={`shrink-0 gap-2 ${upiSaved ? "bg-green-600 hover:bg-green-600" : ""}`}>
              {upiSaved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : savingUpi ? "Saving..." : "Save UPI"}
            </Button>
          </div>
          {ownerProfile?.upiId && (
            <p className="text-xs text-green-600 font-semibold mt-2">✅ Current: <span className="font-mono">{ownerProfile.upiId}</span></p>
          )}
        </div>

        {/* PG Grid */}
        {pgs.length === 0 ? (
          <div className="border rounded-xl p-12 bg-white shadow-sm text-center animate-scale-in">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="font-bold text-xl mb-2">No Properties Listed Yet</h3>
            <p className="text-muted-foreground mb-6">Click the button above to add your first PG property to Savion.</p>
            <Link href="/dashboard/owner/add-pg">
              <Button>Add Your First PG</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
            {pgs.map((pg) => (
              <div key={pg.id} className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col animate-fade-in-up hover-lift card-hover">
                <div className="relative h-48 w-full bg-slate-200">
                  {pg.img ? (
                    <Image src={pg.img} alt={pg.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-100 to-slate-200">
                      <span className="text-4xl">🏠</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${(pg.availableRooms ?? 0) > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      }`}>
                      {(pg.availableRooms ?? 0) > 0 ? `${pg.availableRooms} available` : "Full"}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-lg">{pg.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{pg.location}</p>
                  <p className="font-semibold text-primary mt-1.5">{pg.price}/mo</p>
                  {pg.facilities && pg.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pg.facilities.slice(0, 3).map((f) => (
                        <span key={f} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                      {pg.facilities.length > 3 && <span className="text-xs text-muted-foreground">+{pg.facilities.length - 3}</span>}
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 justify-between items-center">
                    <Link href={`/dashboard/owner/pg/${pg.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">Manage →</Button>
                    </Link>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/owner/edit-pg/${pg.id}`}>
                        <Button variant="outline" size="icon" className="w-8 h-8 text-slate-500 hover:text-primary"><Edit className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(pg.id, pg.name)} className="w-8 h-8 text-slate-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
