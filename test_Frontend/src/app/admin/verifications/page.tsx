"use client";

import { useEffect, useState } from "react";
import { Check, X, Eye, ShieldCheck, AlertCircle, ArrowLeft, Filter, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllVerifications, updateVerificationStatus, VerificationRecord } from "@/lib/db/verifications";
import { updateUserProfile } from "@/lib/db/users";
import Link from "next/link";
import { SpeedLoader } from "@/components/ui/SpeedLoader";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

type FilterType = "all" | "pending" | "verified" | "rejected";

export default function AdminVerifications() {
  const { loading: guardLoading, error: guardError } = useRoleGuard("admin");
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const data = await getAllVerifications();
      setRecords(data);
    } catch (err) {
      console.error("Failed to fetch verifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleAction = async (userId: string, action: "verified" | "rejected") => {
    const reason = action === "rejected" ? prompt("Enter rejection reason:") : "";
    if (action === "rejected" && reason === null) return;

    setActionLoading(userId);
    try {
      await updateVerificationStatus(userId, action, reason || undefined);
      // If approved, also update the user profile
      if (action === "verified") {
        await updateUserProfile(userId, { isVerified: true } as any);
      }
      if (action === "rejected") {
        await updateUserProfile(userId, { isVerified: false } as any);
      }
      await fetchRecords();
    } catch (err) {
      alert("Failed to update status. Check console for details.");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === "all" ? records : records.filter(r => r.status === filter);

  const counts = {
    all: records.length,
    pending: records.filter(r => r.status === "pending").length,
    verified: records.filter(r => r.status === "verified").length,
    rejected: records.filter(r => r.status === "rejected").length,
  };

  if (guardError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md w-full bg-white dark:bg-zinc-900 p-12 rounded-[2rem] shadow-2xl border border-border">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2 text-foreground">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">{guardError}</p>
          <Link href="/">
            <Button className="w-full">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (guardLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-800/50">
        <SpeedLoader text="Loading Verifications" subtext="Reviewing tenant documents..." />
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 dark:bg-zinc-800/50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-slate-500 dark:text-slate-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">User Verifications</h1>
              <p className="text-slate-500 dark:text-slate-400">Review and manage tenant identity documents.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchRecords(); }} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "pending", "verified", "rejected"] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-slate-400 border hover:bg-slate-50 dark:bg-zinc-800/50"
              }`}
            >
              {f} <span className="ml-1 opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm dark:shadow-slate-900/50 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User / ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Face Match</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{r.fullName || "Anonymous"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{r.userEmail}</p>
                    <span className="inline-block mt-1 text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">{r.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        (r.faceMatchScore || r.mlConfidence || 0) >= 60 ? "bg-green-500" : "bg-red-500"
                      }`} />
                      <span className="font-bold text-sm">
                        {r.faceMatchScore ? `${Math.round(r.faceMatchScore)}%` : r.mlConfidence ? `${Math.round(r.mlConfidence)}%` : "N/A"}
                      </span>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold mt-1 inline-block">{r.idType}</span>
                    {r.rejectionReason && (
                      <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={r.rejectionReason}>
                        Reason: {r.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setPreviewImg(r.idUrl)} className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg hover:bg-slate-200 transition-colors" title="View ID Card">
                        <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                      {r.selfieUrl && (
                        <button onClick={() => setPreviewImg(r.selfieUrl!)} className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="View Selfie">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                      r.status === 'verified' ? 'bg-green-100 text-green-700' :
                      r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:bg-red-950/30"
                        onClick={() => handleAction(r.id, "rejected")}
                        disabled={r.status === 'rejected' || actionLoading === r.id}
                      >
                        {actionLoading === r.id ? <Loader2Icon /> : <X className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleAction(r.id, "verified")}
                        disabled={r.status === 'verified' || actionLoading === r.id}
                      >
                        {actionLoading === r.id ? <Loader2Icon /> : <Check className="w-4 h-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No {filter === "all" ? "" : filter} verification requests found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-2xl max-h-[80vh]">
            <button onClick={() => setPreviewImg(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-white dark:bg-zinc-900 rounded-full shadow-lg dark:shadow-zinc-900/50 flex items-center justify-center z-10">
              <X className="w-4 h-4" />
            </button>
            <img src={previewImg} alt="Document" className="max-w-full max-h-[80vh] rounded-xl shadow-2xl dark:shadow-zinc-900/60 object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

function Loader2Icon() {
  return <div className="w-4 h-4 border-2 border-slate-300 dark:border-zinc-600 border-t-slate-600 rounded-full animate-spin" />;
}
