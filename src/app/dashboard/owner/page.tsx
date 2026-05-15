"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
  Settings, LayoutDashboard, Sparkles, DollarSign, ArrowUpRight, MapPin, UserCircle, Edit3, TrendingUp, Clock, AlertCircle, Activity, Star
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
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [chartFilter, setChartFilter] = useState<"hour" | "daily" | "weekly" | "monthly" | "yearly">("monthly");

  // Real-time Data States
  const [revenueData, setRevenueData] = useState<{name: string, value: number}[]>([]);
  const [rawPayments, setRawPayments] = useState<any[]>([]);
  const [rawComplaints, setRawComplaints] = useState<any[]>([]);
  const [rawBookings, setRawBookings] = useState<any[]>([]);
  const [rawReviews, setRawReviews] = useState<any[]>([]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const timeAgo = (dateVal: string | number) => {
    if (!dateVal) return "Just now";
    const ts = typeof dateVal === "number" ? dateVal : new Date(dateVal).getTime();
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} mins ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hrs ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  const activities = [
    ...rawPayments.filter(p => p.status === "verified" && p.createdAt).map(p => ({
       id: `p_${p.id || Math.random()}`, type: "payment", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-50",
       text: `₹${p.amount} payment verified`, timeStr: p.createdAt, time: timeAgo(p.createdAt)
    })),
    ...rawComplaints.filter(c => c.createdAt).map(c => ({
       id: `c_${c.id || Math.random()}`, type: "complaint", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50",
       text: `${c.category || 'Maintenance'} issue reported`, timeStr: c.createdAt, time: timeAgo(c.createdAt)
    })),
    ...rawBookings.filter(b => b.status === "confirmed" && b.createdAt).map(b => ({
       id: `b_${b.id || Math.random()}`, type: "booking", icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-50",
       text: `Booking confirmed in ${b.pgName || 'Property'}`, timeStr: b.createdAt, time: timeAgo(b.createdAt)
    })),
    ...rawReviews.filter(r => r.createdAt).map(r => ({
       id: `r_${r.id || Math.random()}`, type: "review", icon: Star, color: "text-amber-500", bg: "bg-amber-50",
       text: `${r.userName} left a ${r.rating}★ review: "${r.title}"`, timeStr: r.createdAt, time: timeAgo(r.createdAt)
    }))
  ].sort((a, b) => new Date(b.timeStr).getTime() - new Date(a.timeStr).getTime());

  const displayedActivities = showAllActivity ? activities : activities.slice(0, 4);

  // ─── Chart data computed from rawPayments + active filter ───────────────────
  const computeChartData = (): {name: string, value: number}[] => {
    if (rawPayments.length === 0) return [];
    const verified = rawPayments.filter(p => p.status === "verified");
    const now = new Date();

    if (chartFilter === "hour") {
      // Last 60 mins split into 12 × 5-min buckets
      return Array.from({ length: 12 }, (_, i) => {
        const bucketStart = new Date(now.getTime() - (11 - i) * 5 * 60000);
        const bucketEnd   = new Date(now.getTime() - (10 - i) * 5 * 60000);
        const label = `${bucketStart.getHours()}:${String(bucketStart.getMinutes()).padStart(2,'0')}`;
        const val = verified
          .filter(p => { const t = new Date(p.createdAt).getTime(); return t >= bucketStart.getTime() && t < bucketEnd.getTime(); })
          .reduce((s, p) => s + (p.amount || 0), 0);
        return { name: label, value: val };
      });
    }

    if (chartFilter === "daily") {
      // Last 14 days
      return Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now); d.setDate(now.getDate() - (13 - i));
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        const dayStr = d.toISOString().split("T")[0];
        const val = verified
          .filter(p => p.createdAt && new Date(p.createdAt).toISOString().split("T")[0] === dayStr)
          .reduce((s, p) => s + (p.amount || 0), 0);
        return { name: label, value: val };
      });
    }

    if (chartFilter === "weekly") {
      // Last 8 weeks
      return Array.from({ length: 8 }, (_, i) => {
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - (7 - i) * 7 - 6);
        const weekEnd   = new Date(now); weekEnd.setDate(now.getDate() - (7 - i) * 7 + 1);
        const label = `W${i + 1}`;
        const val = verified
          .filter(p => { if (!p.createdAt) return false; const t = new Date(p.createdAt).getTime(); return t >= weekStart.getTime() && t < weekEnd.getTime(); })
          .reduce((s, p) => s + (p.amount || 0), 0);
        return { name: label, value: val };
      });
    }

    if (chartFilter === "monthly") {
      // Last 6 months
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleString('default', { month: 'short' });
        const val = verified
          .filter(p => p.month === monthStr)
          .reduce((s, p) => s + (p.amount || 0), 0);
        return { name: label, value: val };
      });
    }

    if (chartFilter === "yearly") {
      // Last 3 years
      return Array.from({ length: 3 }, (_, i) => {
        const yr = now.getFullYear() - (2 - i);
        const val = verified
          .filter(p => p.month && p.month.startsWith(`${yr}`))
          .reduce((s, p) => s + (p.amount || 0), 0);
        return { name: `${yr}`, value: val };
      });
    }

    return [];
  };

  const activeChartData = computeChartData();
  const chartTotal = activeChartData.reduce((s, d) => s + d.value, 0);
  const prevChartTotal = rawPayments
    .filter(p => p.status === "verified")
    .reduce((s, p) => s + (p.amount || 0), 0) - chartTotal;
  const growthPct = prevChartTotal > 0 ? Math.round((chartTotal / prevChartTotal - 1) * 100) : null;

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
      const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const confirmed = bookings.filter(b => b.status === "confirmed");
      setActiveTenants(confirmed.length);
      setRawBookings(bookings);
    }, (err) => console.error("Booking Sync Error:", err));

    // 3. Real-time Payments
    const qPayments = query(collection(db, "payments"), where("ownerId", "==", ownerId));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const payments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setRawPayments(payments);
      
      // Count total verified revenue for the stat card
      const totalVerified = payments
        .filter(p => p.status === "verified")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      setMonthlyRevenue(totalVerified);

      // Count pending (submitted) payments waiting for owner action
      const pendingCount = payments.filter(p => p.status === "submitted").length;
      if (pendingCount > 0) {
        console.info(`[OwnerDash] ${pendingCount} payment(s) awaiting verification.`);
      }

      const months = [];
      const now = new Date();
      for(let i=5; i>=0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const shortName = d.toLocaleString('default', { month: 'short' });
        
        const sum = payments
          .filter(p => p.status === "verified" && p.month === monthStr)
          .reduce((acc, p) => acc + (p.amount || 0), 0);
          
        months.push({ name: shortName, value: sum });
      }
      setRevenueData(months);
    }, (err) => console.error("Payment Sync Error:", err));

    // 4. Real-time Complaints
    const qComplaints = query(collection(db, "complaints"), where("ownerId", "==", ownerId));
    const unsubComplaints = onSnapshot(qComplaints, (snapshot) => {
      const allComplaints = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Complaint);
      setRawComplaints(allComplaints);
      const openCount = allComplaints.filter(c => c.status !== "resolved").length;
      setOpenComplaintsCount(openCount);
    }, (err) => console.warn("Global complaint sync failed", err));

    // 5. Real-time Reviews from Community
    const qReviews = query(collection(db, "communityMessages"), where("ownerId", "==", ownerId), where("channel", "==", "pg-reviews"));
    const unsubReviews = onSnapshot(qReviews, (snapshot) => {
      setRawReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    }, (err) => console.warn("Global reviews sync failed", err));

    getUserProfile(ownerId).then(p => {
      if (p) { setOwnerProfile(p); setUpiInput(p.upiId || ""); }
    });

    return () => {
      unsubPgs();
      unsubBookings();
      unsubPayments();
      unsubComplaints();
      unsubReviews();
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
        <div className="text-center max-w-md w-full px-6 bg-white dark:bg-zinc-900/70 backdrop-blur-3xl p-12 rounded-[3.5rem] shadow-2xl dark:shadow-zinc-900/60 shadow-slate-200/40 border border-white/60 animate-scale-in">
          <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <ShieldAlert className="w-12 h-12 text-rose-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black mb-3 text-slate-900 dark:text-slate-100 tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-16 rounded-2xl font-black border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:bg-zinc-800/50 transition-all text-base">Try Again</Button>
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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-800/50 selection:bg-primary/10 selection:text-primary relative overflow-hidden">
      {/* Subtle blueprint grid background — CSS-only, no SVG file needed */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.4]" style={{backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px'}} />
      
      <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-700/50 sticky top-0 z-50 py-3 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-md">
              <LayoutDashboard className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">Owner Hub</h1>
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
              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold transition-all gap-1.5 hidden md:flex h-9 px-3 rounded-lg text-[10px]"
            >
              <LogOut className="w-3 h-3" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
        {/* Ultra-Slim Welcome */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-primary mb-0.5">
              <Sparkles className="w-3 h-3 fill-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest">Dashboard Terminal</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">
              Welcome, {ownerProfile?.name?.split(" ")[0] || "Partner"}
            </h2>
          </div>
          <Link href="/dashboard/owner/add-pg">
            <Button className="h-10 px-5 bg-slate-900 hover:bg-black text-white font-black rounded-lg shadow-md transition-all active:scale-95 gap-2 text-[10px]">
               <Plus className="w-3.5 h-3.5" /> Deploy Asset
            </Button>
          </Link>
        </motion.div>

        {/* High-Density Stat Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Revenue", value: `₹${monthlyRevenue.toLocaleString()}`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Properties", value: pgs.length, icon: Building2, color: "text-primary", bg: "bg-primary/5" },
            { label: "Residents", value: activeTenants, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Issues", value: openComplaintsCount, icon: MessageSquare, color: "text-rose-600", bg: "bg-rose-50" },
          ].map((stat, i) => (
            <motion.div 
              variants={itemVariants}
              key={stat.label} 
              className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-sm dark:shadow-slate-900/50 hover:border-slate-300 dark:border-zinc-600 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
                <div className="h-1 w-6 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                   <div className={`h-full w-2/3 ${stat.color.replace('text-', 'bg-')} animate-shimmer-bg`} />
                </div>
              </div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{stat.value}</h3>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Revenue Chart Section */}
          <motion.div variants={itemVariants} className="lg:col-span-8">
            <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-zinc-700 shadow-sm dark:shadow-slate-900/50 relative overflow-hidden h-full min-h-[300px]">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" /> Revenue Trajectory
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Total: ₹{chartTotal.toLocaleString('en-IN')}
                    </p>
                  </div>
                  {growthPct !== null && (
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${ growthPct >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${growthPct >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${growthPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {growthPct >= 0 ? '+' : ''}{growthPct}% vs rest
                      </span>
                    </div>
                  )}
                </div>
                {/* Filter Pills */}
                <div className="flex gap-1.5 flex-wrap">
                  {([
                    { key: "hour",    label: "Last Hour" },
                    { key: "daily",   label: "Daily" },
                    { key: "weekly",  label: "Weekly" },
                    { key: "monthly", label: "Monthly" },
                    { key: "yearly",  label: "Yearly" },
                  ] as const).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setChartFilter(f.key)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        chartFilter === f.key
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-48 md:h-56 w-full -ml-4 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeChartData.length > 0 ? activeChartData : [{name: 'No Data', value: 0}]}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} width={40} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 'black', color: '#0f172a' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Activity / Pulse Section */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-700 shadow-sm dark:shadow-slate-900/50 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xl text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" /> Platform Pulse
                </h3>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto pr-2 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-200">
                {displayedActivities.length > 0 ? displayedActivities.map((act) => {
                  const inner = (
                    <div className={`flex items-start gap-3 ${act.type === "review" ? "cursor-pointer group" : ""}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${act.bg} ${act.type === "review" ? "group-hover:scale-110 transition-transform" : ""}`}>
                        <act.icon className={`w-4 h-4 ${act.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight ${act.type === "review" ? "group-hover:text-primary transition-colors" : ""}`}>{act.text}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {act.time}
                        </p>
                      </div>
                      {act.type === "review" && (
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                      )}
                    </div>
                  );
                  return act.type === "review" ? (
                    <Link key={act.id} href="/dashboard/owner/reviews">{inner}</Link>
                  ) : (
                    <div key={act.id}>{inner}</div>
                  );
                }) : (
                  <p className="text-slate-400 font-medium text-sm text-center py-10">No recent activity found.</p>
                )}
              </div>
              {activities.length > 4 && (
                <Button 
                  onClick={() => setShowAllActivity(!showAllActivity)} 
                  variant="ghost" 
                  className="w-full mt-4 h-10 rounded-xl font-black text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:bg-zinc-800/50 border border-slate-100"
                >
                  {showAllActivity ? "Collapse Feed" : "View All Activity"}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Compact Revenue Panel */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg dark:shadow-zinc-900/50 text-white relative overflow-hidden sticky top-24">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl opacity-40" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-white dark:bg-zinc-900/10 rounded-lg flex items-center justify-center border border-white/10">
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
                      className="h-10 bg-white dark:bg-zinc-900/5 border-white/10 rounded-lg font-bold text-white placeholder:text-white/20 focus:bg-white dark:bg-zinc-900/10 transition-all text-xs"
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
          </motion.div>

          {/* High-Density Portfolio Grid (Bento Style) */}
          <motion.div variants={itemVariants} className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-700 dark:text-slate-300" /> Active Portfolio
              </h2>
              <span className="text-[9px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg uppercase tracking-widest">{pgs.length} Units</span>
            </div>

            {pgs.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 border-dashed p-16 text-center animate-scale-in">
                <div className="w-12 h-12 bg-slate-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Building2 className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-1">No Assets Found</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mb-6 max-w-xs mx-auto">Initialize your first property terminal to begin monitoring.</p>
                <Link href="/dashboard/owner/add-pg">
                  <Button className="h-10 px-6 bg-primary text-white font-black rounded-lg shadow-md text-[10px]">Start Setup</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pgs.map((pg, i) => {
                  return (
                    <motion.div 
                      variants={itemVariants}
                      key={pg.id}
                      onClick={() => router.push(`/dashboard/owner/pg/${pg.id}`)}
                      className="group bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-sm dark:shadow-slate-900/50 hover:shadow-lg dark:shadow-zinc-900/50 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
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
                          <div className="w-full h-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                           <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border shadow-sm dark:shadow-slate-900/50
                             ${(pg.availableRooms ?? 0) > 0 ? "bg-white dark:bg-zinc-900/95 text-emerald-600 border-emerald-100" : "bg-rose-500 text-white border-rose-600"}`}>
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
                          <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-100">
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Availability</p>
                            <p className="text-xs font-black text-slate-900 dark:text-slate-100">{pg.availableRooms} Units</p>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-100">
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Base Price</p>
                            <p className="text-xs font-black text-emerald-600">{pg.price}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-50">
                          <div className="flex -space-x-1.5">
                             {[1,2].map(j => (
                               <div key={j} className="w-6 h-6 rounded-full border border-white bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                                  <UserCircle className="w-3.5 h-3.5 text-slate-300" />
                               </div>
                             ))}
                             <div className="w-6 h-6 rounded-full border border-white bg-slate-900 flex items-center justify-center text-[7px] font-black text-white">
                               {pg.rooms?.length || 0}+
                             </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center bg-slate-50 dark:bg-zinc-800/50 rounded-lg p-0.5 border border-slate-100">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/owner/edit-pg/${pg.id}`);
                                }}
                                className="w-7 h-7 hover:bg-white dark:bg-zinc-900 hover:text-primary text-slate-400 rounded-md flex items-center justify-center transition-all"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(pg.id, pg.name);
                                }}
                                className="w-7 h-7 hover:bg-white dark:bg-zinc-900 hover:text-rose-600 text-slate-400 rounded-md flex items-center justify-center transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <Button variant="ghost" className="h-8 px-2.5 rounded-md font-black text-[9px] hover:bg-slate-50 dark:bg-zinc-800/50 group/btn gap-1">
                              Control <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

              </div>
            )}
          </motion.div>
        </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
