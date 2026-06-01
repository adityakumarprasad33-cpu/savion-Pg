"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { getPGsByOwner, PG } from "@/lib/db/pgs"; // We can reuse or adapt for caretaker if needed
import { getComplaintsByPG, Complaint, updateComplaintStatus } from "@/lib/db/complaints";
import { getUserProfile, UserProfile } from "@/lib/db/users";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, Clock, MessageSquare, ShieldCheck, 
  LogOut, AlertTriangle, Hammer, XCircle, LayoutDashboard,
  UserCircle, Building2, Sparkles, Phone, CheckCircle
} from "lucide-react";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { SpeedLoader } from "@/components/ui/SpeedLoader";

export default function CaretakerDashboard() {
  const router = useRouter();
  const { loading, userId: caretakerId, error } = useRoleGuard("caretaker");
  const [caretakerProfile, setCaretakerProfile] = useState<UserProfile | null>(null);
  const [assignedPGs, setAssignedPGs] = useState<PG[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  useEffect(() => {
    if (!caretakerId) return;

    getUserProfile(caretakerId).then(p => {
      if (p) setCaretakerProfile(p);
    });

    let unsubComplaints: (() => void) | null = null;

    // Fetch PGs assigned to this caretaker
    const qPgs = query(collection(db, "pgs"), where("caretakerId", "==", caretakerId));
    const unsubPgs = onSnapshot(qPgs, (snapshot) => {
      const pgsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as PG[];
      setAssignedPGs(pgsData);
      
      // Clean up previous complaints listener before creating a new one
      if (unsubComplaints) unsubComplaints();

      if (pgsData.length > 0) {
        // Fetch complaints for these PGs
        const pgIds = pgsData.map(pg => pg.id);
        const qComplaints = query(collection(db, "complaints"), where("pgId", "in", pgIds));
        unsubComplaints = onSnapshot(qComplaints, (compSnap) => {
          setComplaints(compSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Complaint[]);
        });
      } else {
        setComplaints([]);
      }
    });

    return () => {
      unsubPgs();
      if (unsubComplaints) unsubComplaints();
    };
  }, [caretakerId]);

  const handleResolve = async (complaintId: string) => {
    setUpdating(complaintId);
    try {
      await updateComplaintStatus(complaintId, "resolved");
    } catch (err) {
      console.error(err);
      alert("Failed to resolve complaint.");
    } finally {
      setUpdating(null);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="text-center max-w-md w-full px-6 bg-white dark:bg-zinc-900/70 backdrop-blur-3xl p-12 rounded-[3.5rem] shadow-2xl dark:shadow-zinc-900/60 shadow-slate-200/40 border border-white/60 animate-scale-in">
          <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <AlertTriangle className="w-12 h-12 text-rose-500 animate-pulse" />
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <SpeedLoader text="Preparing Caretaker Hub" subtext="Authenticating staff credentials..." />
      </div>
    );
  }

  const openComplaints = complaints.filter(c => c.status !== "resolved");
  const resolvedComplaints = complaints.filter(c => c.status === "resolved");

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#030712] selection:bg-primary/10 selection:text-primary relative overflow-x-hidden">
      {/* Aurora Background Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-blue-400/20 dark:bg-blue-500/20 blur-[120px] rounded-full mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-purple-500/20 dark:bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="bg-white/70 dark:bg-[#030712]/70 backdrop-blur-3xl border-b border-slate-200/50 dark:border-white/5 sticky top-0 z-50 py-5 px-6 md:px-12 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl dark:shadow-zinc-900/60 shadow-emerald-500/30 group cursor-pointer hover:rotate-6 transition-transform duration-500">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-slate-100">Staff Portal</h1>
          </div>
          <div className="flex items-center gap-6">
            <NotificationDropdown userId={caretakerId} />
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

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full space-y-12 relative z-10">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-12">
        
        {/* Welcome Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-600 mb-2">
              <Sparkles className="w-4 h-4 fill-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Ground Operations</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              Welcome, {caretakerProfile?.name?.split(" ")[0] || "Staff"}!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-3 text-lg">Manage daily operations and tenant issues.</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-[#0a0a0f]/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_40px_rgb(79,70,229,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-1000" />
            <div className="relative z-10 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <Building2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="relative z-10 text-4xl font-bold text-slate-900 dark:text-slate-100">{assignedPGs.length}</h3>
            <p className="relative z-10 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">Assigned Properties</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-[#0a0a0f]/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_40px_rgb(79,70,229,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-1000" />
            <div className="relative z-10 w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="relative z-10 text-4xl font-bold text-slate-900 dark:text-slate-100">{openComplaints.length}</h3>
            <p className="relative z-10 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">Active Issues</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white/40 dark:bg-[#0a0a0f]/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_40px_rgb(79,70,229,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-1000" />
            <div className="relative z-10 w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <CheckCircle2 className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="relative z-10 text-4xl font-bold text-slate-900 dark:text-slate-100">{resolvedComplaints.length}</h3>
            <p className="relative z-10 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-2">Resolved Issues</p>
          </motion.div>
        </motion.div>

        {/* Action Center */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
            <h3 className="font-bold text-2xl text-slate-900 dark:text-slate-100 tracking-tight px-2">Active Operations</h3>
            {openComplaints.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-white rounded-[3rem] p-16 text-center shadow-lg dark:shadow-zinc-900/50 shadow-slate-200/20">
                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">All Clear!</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No pending tenant issues in your assigned properties.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {openComplaints.map(c => (
                  <div key={c.id} className="bg-white/40 dark:bg-[#0a0a0f]/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-inner">
                        <Hammer className="w-6 h-6 text-rose-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-rose-600 bg-rose-50/50 px-2 py-1 rounded-md border border-rose-100">{c.category}</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Room {c.roomNo}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-snug">{c.description}</h4>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">{c.tenantName} · {c.pgName}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleResolve(c.id)} 
                      disabled={updating === c.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-12 px-6 w-full sm:w-auto shadow-lg shadow-emerald-600/20"
                    >
                      {updating === c.id ? "Resolving..." : "Mark Resolved"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
            <h3 className="font-bold text-2xl text-slate-900 dark:text-slate-100 tracking-tight px-2">Your Properties</h3>
            {assignedPGs.length === 0 ? (
              <div className="bg-white/40 dark:bg-[#0a0a0f]/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/60 dark:border-white/10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No properties assigned to you yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedPGs.map(pg => (
                  <div key={pg.id} className="bg-slate-900/90 dark:bg-[#0a0a0f]/80 backdrop-blur-2xl p-6 rounded-[2rem] text-white shadow-xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-md shadow-inner">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg tracking-tight">{pg.name}</h4>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] mt-1">{pg.city}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
