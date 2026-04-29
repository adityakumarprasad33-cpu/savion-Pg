"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/db/users";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users, Building2, BookOpen, TrendingUp,
  Shield, LogOut, ExternalLink, ArrowLeft
} from "lucide-react";
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }

      // Strict role check — admin only
      const profile = await getUserProfile(user.uid);
      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }

      // Load platform stats
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Terminal Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <FaultyTerminalBackground 
          scale={2.0}
          curvature={0.15}
          glitchAmount={1.5}
          tint="#8b5cf6" // Violet tint to match admin theme
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10 animate-fade-in-down">
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none">Savion Admin</h1>
                <p className="text-xs text-slate-400 mt-0.5">Platform Control Center</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://console.firebase.google.com/project/savion-231006/firestore"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="text-slate-300 border-slate-700 hover:bg-slate-800 gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Firestore Console
              </Button>
            </a>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-red-400 gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Role Edit Notice */}
        <div className="bg-violet-900/30 border border-violet-700/50 rounded-xl px-4 py-3 mb-8 flex items-start gap-3 animate-fade-in-up">
          <Shield className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-200">Role Management is Firestore-only</p>
            <p className="text-xs text-violet-300/70 mt-0.5">
              To promote or demote users, go to <strong>Firestore Console → users collection → edit the <code>role</code> field</strong> directly.
              Valid roles: <code>tenant</code>, <code>owner</code>, <code>caretaker</code>, <code>admin</code>.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-slate-900 p-1 rounded-xl w-fit">
          {(["overview", "users", "properties", "bookings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger">
              {[
                { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
                { label: "Tenants", value: stats.totalTenants, icon: Users, color: "text-green-400" },
                { label: "Owners", value: stats.totalOwners, icon: Building2, color: "text-amber-400" },
                { label: "Caretakers", value: stats.totalCaretakers, icon: Shield, color: "text-emerald-400" },
                { label: "Properties", value: stats.totalPGs, icon: Building2, color: "text-violet-400" },
                { label: "Bookings", value: stats.totalBookings, icon: BookOpen, color: "text-pink-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-fade-in-up hover-lift transition-all">
                  <Icon className={`w-5 h-5 ${color} mb-2`} />
                  <p className="text-2xl font-black animate-count-up">{value}</p>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold mb-1">Platform Health</h2>
              <p className="text-slate-400 text-sm mb-6">A quick snapshot of recent platform activity.</p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tenant fill rate</span>
                    <span className="font-bold text-green-400">
                      {stats.totalUsers > 0 ? Math.round((stats.totalTenants / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${stats.totalUsers > 0 ? (stats.totalTenants / stats.totalUsers) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Owner fill rate</span>
                    <span className="font-bold text-amber-400">
                      {stats.totalUsers > 0 ? Math.round((stats.totalOwners / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${stats.totalUsers > 0 ? (stats.totalOwners / stats.totalUsers) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Booking conversion</span>
                    <span className="font-bold text-violet-400">
                      {stats.totalTenants > 0 ? Math.round((stats.totalBookings / stats.totalTenants) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${Math.min(stats.totalTenants > 0 ? (stats.totalBookings / stats.totalTenants) * 100 : 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold">All Users <span className="text-slate-500 font-normal text-sm ml-2">({users.length})</span></h2>
              <a
                href="https://console.firebase.google.com/project/savion-231006/firestore/data/users"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-400 hover:underline flex items-center gap-1"
              >
                Edit roles in Firestore <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Name / UID</th>
                    <th className="text-left px-6 py-3">Email</th>
                    <th className="text-left px-6 py-3">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-500">No users found</td>
                    </tr>
                  ) : users.map((u) => (
                    <tr key={u.uid} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{u.name || "—"}</p>
                        <p className="text-xs text-slate-500 font-mono">{u.uid}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{u.email || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          u.role === "admin" ? "bg-violet-900/50 text-violet-300" :
                          u.role === "owner" ? "bg-amber-900/50 text-amber-300" :
                          u.role === "caretaker" ? "bg-emerald-900/50 text-emerald-300" :
                          "bg-blue-900/50 text-blue-300"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === "properties" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold">All Properties <span className="text-slate-500 font-normal text-sm ml-2">({pgs.length})</span></h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Property Name</th>
                    <th className="text-left px-6 py-3">Owner UID</th>
                    <th className="text-left px-6 py-3">Rooms</th>
                    <th className="text-left px-6 py-3">Caretaker Assignment</th>
                  </tr>
                </thead>
                <tbody>
                  {pgs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No properties found</td>
                    </tr>
                  ) : pgs.map((pg) => (
                    <tr key={pg.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{pg.name}</p>
                        <p className="text-xs text-slate-500">{pg.city}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{pg.ownerId}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs">{pg.totalRooms || 0} Total</span>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                          value={pg.caretakerId || ""}
                          onChange={(e) => handleAssignCaretaker(pg.id, e.target.value)}
                        >
                          <option value="">-- Unassigned --</option>
                          {users.filter(u => u.role === "caretaker").map(c => (
                            <option key={c.uid} value={c.uid}>{c.name || "Unknown"} ({c.uid.substring(0,6)}...)</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold">All Bookings <span className="text-slate-500 font-normal text-sm ml-2">({bookings.length})</span></h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Booking ID</th>
                    <th className="text-left px-6 py-3">Property</th>
                    <th className="text-left px-6 py-3">Tenant UID</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-left px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No bookings found</td>
                    </tr>
                  ) : bookings.map((b) => (
                    <tr key={b.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{b.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{b.pgName || "Unknown PG"}</p>
                        <p className="text-xs text-slate-500">Room {b.roomNumber || "?"}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{b.tenantId}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          b.status === "active" ? "bg-green-900/50 text-green-400" :
                          b.status === "pending" ? "bg-amber-900/50 text-amber-400" :
                          b.status === "cancelled" ? "bg-red-900/50 text-red-400" :
                          "bg-slate-800 text-slate-400"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
