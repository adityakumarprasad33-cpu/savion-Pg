"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { getPGsByOwner, deletePG, PG } from "@/lib/db/pgs";
import { getComplaintsByPG, Complaint } from "@/lib/db/complaints";
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/db/users";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { 
  Edit, Trash2, QrCode, CheckCircle2, Home, Plus, Users, Wallet, 
  MessageSquare, LogOut, ShieldAlert, WifiOff, Building2, ChevronRight, 
  Settings, LayoutDashboard, Sparkles, DollarSign, ArrowUpRight, MapPin, UserCircle, Edit3
} from "lucide-react";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { SpeedLoader } from "@/components/ui/SpeedLoader";
import { useRouter } from "next/navigation";

export default function OwnerDashboard() {
  const router = useRouter();
  const { loading, userId: ownerId, error } = useRoleGuard("owner");
  const [pgs, setPgs] = useState<PG[]>([]);
  const [openComplaintsCount, setOpenComplaintsCount] = useState(0);
  const [activeTenants, setActiveTenants] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [upiInput, setUpiInput] = useState("");
  const [upiSaved, setUpiSaved] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);

  useEffect(() => {
    if (!ownerId) return;

    setIsLive(false);
    setSyncError(null);

    // 1. Real-time PGs
    const qPgs = query(collection(db, "pgs"), where("ownerId", "==", ownerId));
    const unsubPgs = onSnapshot(qPgs, (snapshot) => {
      const fetchedPgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as PG[];
      setPgs(fetchedPgs);
      setIsLive(true);
    }, (err) => {
      console.error("PG Sync Error:", err);
      setSyncError("Failed to sync properties.");
    });

    // 2. Real-time Bookings
    const qBookings = query(collection(db, "bookings"), where("ownerId", "==", ownerId));
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const bookings = snapshot.docs.map(d => d.data());
      const confirmed = bookings.filter(b => b.status === "confirmed");
      setActiveTenants(confirmed.length);
    }, (err) => console.error("Booking Sync Error:", err));

    // 3. Real-time Payments
    const qPayments = query(collection(db, "payments"), where("ownerId", "==", ownerId));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const payments = snapshot.docs.map(d => d.data());
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const thisMonthVerified = payments
        .filter(p => p.status === "verified" && p.month === currentMonth)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      setMonthlyRevenue(thisMonthVerified);
    }, (err) => console.error("Payment Sync Error:", err));

    // 4. Real-time Complaints
    const qComplaints = query(collection(db, "complaints"), where("ownerId", "==", ownerId));
    const unsubComplaints = onSnapshot(qComplaints, (snapshot) => {
      const allComplaints = snapshot.docs.map(d => d.data() as Complaint);
      const openCount = allComplaints.filter(c => c.status !== "resolved").length;
      setOpenComplaintsCount(openCount);
    }, (err) => console.warn("Global complaint sync failed", err));

    getUserProfile(ownerId).then(p => {
      if (p) { setOwnerProfile(p); setUpiInput(p.upiId || ""); }
    });

    return () => {
      unsubPgs();
      unsubBookings();
      unsubPayments();
      unsubComplaints();
    };
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
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe]">
        <div className="text-center max-w-md w-full px-6 bg-white/70 backdrop-blur-3xl p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/40 border border-white/60 animate-scale-in">
          <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <ShieldAlert className="w-12 h-12 text-rose-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black mb-3 text-slate-900 tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-16 rounded-2xl font-black border-slate-200 hover:bg-slate-50 transition-all text-base">Try Again</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe]">
        <SpeedLoader text="Preparing Your Hub" subtext="Fetching premium data assets..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] selection:bg-primary/10 selection:text-primary relative">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 py-3 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-md">
              <LayoutDashboard className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">Owner Hub</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} /> 
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{isLive ? 'Online' : 'Syncing'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown userId={ownerId} />
            <div className="h-5 w-[1px] bg-slate-200 hidden md:block" />
            <Button 
              variant="ghost" 
              onClick={() => auth.signOut()}
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold transition-all gap-1.5 hidden md:flex h-9 px-3 rounded-lg text-[10px]"
            >
              <LogOut className="w-3 h-3" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full">
        {/* Ultra-Slim Welcome */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-primary mb-0.5">
              <Sparkles className="w-3 h-3 fill-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest">Dashboard Terminal</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
              Welcome, {ownerProfile?.name?.split(" ")[0] || "Partner"}
            </h2>
          </div>
          <Link href="/dashboard/owner/add-pg">
            <Button className="h-10 px-5 bg-slate-900 hover:bg-black text-white font-black rounded-lg shadow-md transition-all active:scale-95 gap-2 text-[10px]">
               <Plus className="w-3.5 h-3.5" /> Deploy Asset
            </Button>
          </Link>
        </div>

        {/* High-Density Stat Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Revenue", value: `₹${monthlyRevenue.toLocaleString()}`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Properties", value: pgs.length, icon: Building2, color: "text-primary", bg: "bg-primary/5" },
            { label: "Residents", value: activeTenants, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Issues", value: openComplaintsCount, icon: MessageSquare, color: "text-rose-600", bg: "bg-rose-50" },
          ].map((stat, i) => (
            <div 
              key={stat.label} 
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all group animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
                <div className="h-1 w-6 bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full w-2/3 ${stat.color.replace('text-', 'bg-')} animate-shimmer-bg`} />
                </div>
              </div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Compact Revenue Panel */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden sticky top-24">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl opacity-40" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-base tracking-tight leading-none mb-1">Revenue Node</h3>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">Settings</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase tracking-widest text-white/20 ml-1">Merchant VPA</label>
                    <Input
                      placeholder="business@upi"
                      value={upiInput}
                      onChange={(e) => setUpiInput(e.target.value)}
                      className="h-10 bg-white/5 border-white/10 rounded-lg font-bold text-white placeholder:text-white/20 focus:bg-white/10 transition-all text-xs"
                    />
                  </div>
                  <Button 
                    onClick={handleSaveUpi} 
                    disabled={savingUpi || !upiInput.trim()} 
                    className={`w-full h-10 rounded-lg font-black transition-all active:scale-95 gap-2 text-[10px]
                      ${upiSaved ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-primary/90"}`}
                  >
                    {upiSaved ? "Node Synced" : savingUpi ? "Saving..." : "Update UPI Gateway"}
                  </Button>
                </div>

                {ownerProfile?.upiId && (
                  <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-0.5">Active ID</p>
                      <p className="text-xs font-bold text-white/70">{ownerProfile.upiId}</p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-primary opacity-50" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* High-Density Portfolio Grid */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Active Portfolio</h2>
              <span className="text-[8px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-md border border-slate-100 uppercase tracking-widest">{pgs.length} Units</span>
            </div>

            {pgs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-16 text-center animate-scale-in">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Building2 className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">No Assets Found</h3>
                <p className="text-slate-500 font-medium text-xs mb-6 max-w-xs mx-auto">Initialize your first property terminal to begin monitoring.</p>
                <Link href="/dashboard/owner/add-pg">
                  <Button className="h-10 px-6 bg-primary text-white font-black rounded-lg shadow-md text-[10px]">Start Setup</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pgs.map((pg, i) => {
                  return (
                    <div 
                      key={pg.id}
                      onClick={() => router.push(`/dashboard/owner/pg/${pg.id}`)}
                      className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col animate-fade-in-up cursor-pointer"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <div className="relative h-36 w-full overflow-hidden">
                        {pg.images?.[0] ? (
                          <Image 
                            src={pg.images[0]} 
                            alt={pg.name} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                           <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border shadow-sm
                             ${(pg.availableRooms ?? 0) > 0 ? "bg-white/95 text-emerald-600 border-emerald-100" : "bg-rose-500 text-white border-rose-600"}`}>
                             {(pg.availableRooms ?? 0) > 0 ? `${pg.availableRooms} Vacant` : "Full"}
                           </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4">
                           <h4 className="text-base font-black text-white tracking-tight leading-none mb-0.5">{pg.name}</h4>
                           <p className="text-[8px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-1">
                             <MapPin className="w-2.5 h-2.5" /> {pg.location?.split(',')[0]}
                           </p>
                        </div>
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Availability</p>
                            <p className="text-xs font-black text-slate-900">{pg.availableRooms} Units</p>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Base Price</p>
                            <p className="text-xs font-black text-emerald-600">{pg.price}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-50">
                          <div className="flex -space-x-1.5">
                             {[1,2].map(j => (
                               <div key={j} className="w-6 h-6 rounded-full border border-white bg-slate-100 flex items-center justify-center">
                                  <UserCircle className="w-3.5 h-3.5 text-slate-300" />
                               </div>
                             ))}
                             <div className="w-6 h-6 rounded-full border border-white bg-slate-900 flex items-center justify-center text-[7px] font-black text-white">
                               {pg.rooms?.length || 0}+
                             </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/owner/edit-pg/${pg.id}`);
                                }}
                                className="w-7 h-7 hover:bg-white hover:text-primary text-slate-400 rounded-md flex items-center justify-center transition-all"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(pg.id, pg.name);
                                }}
                                className="w-7 h-7 hover:bg-white hover:text-rose-600 text-slate-400 rounded-md flex items-center justify-center transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <Button variant="ghost" className="h-8 px-2.5 rounded-md font-black text-[9px] hover:bg-slate-50 group/btn gap-1">
                              Control <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
