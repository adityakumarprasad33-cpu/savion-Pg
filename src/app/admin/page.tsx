"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, updateDoc, doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/db/users";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users, Building2, BookOpen,
  Shield, LogOut, ExternalLink, ArrowLeft, Activity, UserCog, Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SpeedLoader } from "@/components/ui/SpeedLoader";
import dynamic from 'next/dynamic';

const FaultyTerminalBackground = dynamic(
  () => import("@/components/ui/FaultyTerminalBackground"),
  { ssr: false }
);

interface Stats {
  totalUsers: number;
  totalOwners: number;
  totalTenants: number;
  totalCaretakers: number;
  totalPGs: number;
  totalBookings: number;
}

interface UserRecord {
  uid: string;
  name?: string;
  email?: string;
  role: string;
  createdAt?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pgs, setPgs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "properties" | "bookings">("overview");

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }

      const profile = await getUserProfile(user.uid);
      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }

      await loadStats();
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const loadStats = async () => {
    try {
      const [usersSnap, pgsSnap, bookingsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "pgs")),
        getDocs(collection(db, "bookings")),
      ]);

      const usersData = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserRecord));
      setUsers(usersData);

      const pgsData = pgsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPgs(pgsData);

      const bookingsData = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBookings(bookingsData);

      setStats({
        totalUsers: usersData.length,
        totalOwners: usersData.filter(u => u.role === "owner").length,
        totalTenants: usersData.filter(u => u.role === "tenant" || u.role === "student").length,
        totalCaretakers: usersData.filter(u => u.role === "caretaker").length,
        totalPGs: pgsSnap.size,
        totalBookings: bookingsSnap.size,
      });
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleAssignCaretaker = async (pgId: string, caretakerId: string) => {
    try {
      await updateDoc(doc(db, "pgs", pgId), { caretakerId: caretakerId || null });
      setPgs(prev => prev.map(pg => pg.id === pgId ? { ...pg, caretakerId } : pg));
    } catch (e) {
      console.error("Failed to assign caretaker", e);
      alert("Failed to assign caretaker. Check permissions.");
    }
  };

  const handleToggleUserStatus = async (uid: string, currentRole: string) => {
    const isDisabling = currentRole !== "disabled";
    if (isDisabling) {
      if (!confirm("Are you sure you want to disable this account? They will lose access immediately.")) return;
    } else {
      if (!confirm("Re-enable this account? Note: They will be assigned the 'tenant' role by default.")) return;
    }

    try {
      const newRole = isDisabling ? "disabled" : "tenant";
      await setDoc(doc(db, "users", uid), { role: newRole }, { merge: true });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (e) {
      console.error("Failed to toggle status", e);
      alert("Failed to update user status. Check console for details.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <SpeedLoader text="Verifying Access" subtext="Platform Control Center" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden selection:bg-primary/30">
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <FaultyTerminalBackground scale={2.0} curvature={0.15} glitchAmount={1.5} tint="#f97316" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Glass Header */}
        <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-2xl sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-black text-xl tracking-tight leading-none text-white">Savion Admin</h1>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Platform Control Center</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://console.firebase.google.com/project/savion-231006/firestore" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="hidden sm:flex text-slate-300 border-white/10 bg-white/5 hover:bg-white/10 rounded-xl font-bold gap-2">
                  <ExternalLink className="w-3.5 h-3.5" /> Database
                </Button>
              </a>
              <Link href="/admin/verifications">
                <Button size="sm" className="bg-primary/20 text-primary hover:bg-primary/30 hover:text-white border border-primary/30 font-black rounded-xl gap-2">
                  <Shield className="w-4 h-4" /> Verifications
                </Button>
              </Link>
              <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-slate-400 hover:text-red-400 hover:bg-red-950/50 rounded-xl gap-2 font-bold">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-10 flex-1">
          {/* Segmented Control */}
          <div className="flex gap-2 mb-10 bg-slate-900/50 p-1.5 rounded-2xl w-fit border border-white/5 backdrop-blur-md">
            {(["overview", "users", "properties", "bookings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === tab ? "bg-white text-slate-900 shadow-xl scale-105" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
          {activeTab === "overview" && stats && (
            <motion.div 
              key="overview"
              variants={containerVariants} 
              initial="hidden" 
              animate="show" 
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <motion.h2 variants={itemVariants} className="text-3xl font-black tracking-tight text-white mb-6">System Overview</motion.h2>
              <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[
                  { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
                  { label: "Tenants", value: stats.totalTenants, icon: UserCog, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
                  { label: "Owners", value: stats.totalOwners, icon: Building2, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
                  { label: "Caretakers", value: stats.totalCaretakers, icon: Shield, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
                  { label: "Properties", value: stats.totalPGs, icon: Building2, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
                  { label: "Bookings", value: stats.totalBookings, icon: BookOpen, color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20" },
                ].map(({ label, value, icon: Icon, color, bg, border }, i) => (
                  <motion.div variants={itemVariants} key={label} className={`bg-slate-900/80 backdrop-blur-xl border ${border} rounded-[2rem] p-6 hover:scale-105 transition-transform duration-300 shadow-2xl`}>
                    <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-6`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <p className="text-4xl font-black text-white tracking-tighter mb-1">{value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div 
              key="users"
              variants={containerVariants} 
              initial="hidden" 
              animate="show" 
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h2 className="text-2xl font-black tracking-tight text-white">Users Registry <span className="text-primary text-lg ml-2">({users.length})</span></h2>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-[10px] uppercase tracking-widest border-b border-white/5">
                      <th className="text-left px-4 py-4 font-black">Identity</th>
                      <th className="text-left px-4 py-4 font-black">Role</th>
                      <th className="text-right px-4 py-4 font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-16 text-center text-slate-500 font-bold">No users in registry</td></tr>
                    ) : users.map((u) => (
                      <tr key={u.uid} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-4">
                          <p className="font-black text-white text-base">{u.name || "Unknown User"}</p>
                          <p className="text-xs text-slate-500 font-mono mt-1">{u.email} · {u.uid}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                            u.role === "admin" ? "bg-primary/20 text-primary border-primary/30" :
                            u.role === "owner" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            u.role === "caretaker" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                            u.role === "disabled" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {u.email && (
                              <a href={`mailto:${u.email}`}>
                                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl bg-white/5 hover:bg-white/10 text-white">
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </a>
                            )}
                            {u.role !== "admin" && (
                              <Button
                                size="sm"
                                className={`h-9 px-4 rounded-xl font-bold text-xs ${u.role === "disabled" ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
                                onClick={() => handleToggleUserStatus(u.uid, u.role)}
                              >
                                {u.role === "disabled" ? "Enable" : "Disable"}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "properties" && (
            <motion.div 
              key="properties"
              variants={containerVariants} 
              initial="hidden" 
              animate="show" 
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h2 className="text-2xl font-black tracking-tight text-white">Property Assets <span className="text-primary text-lg ml-2">({pgs.length})</span></h2>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-[10px] uppercase tracking-widest border-b border-white/5">
                      <th className="text-left px-4 py-4 font-black">Asset Name</th>
                      <th className="text-left px-4 py-4 font-black">Capacity</th>
                      <th className="text-left px-4 py-4 font-black">Staff Assignment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pgs.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-16 text-center text-slate-500 font-bold">No assets found</td></tr>
                    ) : pgs.map((pg) => (
                      <tr key={pg.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-black text-white text-base">{pg.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{pg.city} · Owner: {pg.ownerId.substring(0,8)}...</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="bg-white/10 text-white font-black px-3 py-1.5 rounded-lg text-xs">{pg.totalRooms || 0} Units</span>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            className="bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                            value={pg.caretakerId || ""}
                            onChange={(e) => handleAssignCaretaker(pg.id, e.target.value)}
                          >
                            <option value="">-- Unassigned --</option>
                            {users.filter(u => u.role === "caretaker").map(c => (
                              <option key={c.uid} value={c.uid}>{c.name || "Unknown"} ({c.uid.substring(0, 6)}...)</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "bookings" && (
            <motion.div 
              key="bookings"
              variants={containerVariants} 
              initial="hidden" 
              animate="show" 
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h2 className="text-2xl font-black tracking-tight text-white">Active Bookings <span className="text-primary text-lg ml-2">({bookings.length})</span></h2>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-[10px] uppercase tracking-widest border-b border-white/5">
                      <th className="text-left px-4 py-4 font-black">ID</th>
                      <th className="text-left px-4 py-4 font-black">Property Details</th>
                      <th className="text-left px-4 py-4 font-black">Status</th>
                      <th className="text-left px-4 py-4 font-black">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bookings.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-16 text-center text-slate-500 font-bold">No bookings found</td></tr>
                    ) : bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-mono text-xs text-slate-500">{b.id}</td>
                        <td className="px-4 py-4">
                          <p className="font-black text-white text-base">{b.pgName || "Unknown PG"}</p>
                          <p className="text-xs text-slate-400 mt-1">Tenant UID: {b.tenantId.substring(0,8)}...</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                              b.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              b.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              b.status === "cancelled" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              "bg-white/10 text-white/70 border-white/20"
                            }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-400 text-xs font-bold">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
