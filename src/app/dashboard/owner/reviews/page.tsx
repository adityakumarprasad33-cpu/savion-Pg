"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getPGsByOwner, PG } from "@/lib/db/pgs";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { SpeedLoader } from "@/components/ui/SpeedLoader";
import { Button } from "@/components/ui/button";
import {
  Star, ArrowLeft, MessageSquare, Clock, Building2,
  ChevronDown, Filter, ShieldAlert, User
} from "lucide-react";

interface ReviewItem {
  id: string;
  userName: string;
  userRole: string;
  text: string;
  title?: string;
  rating?: number;
  pgId?: string;
  createdAt: number;
}

// ── SENTIMENT CLASSIFICATION ────────────────────────────────────────────
type Sentiment = "all" | "bad" | "poor" | "good" | "excellent";

function classifyReview(rating: number): Sentiment {
  if (rating <= 1) return "bad";
  if (rating <= 2) return "poor";
  if (rating <= 3) return "good";
  return "excellent"; // 4-5
}

const SENTIMENT_CONFIG: Record<Exclude<Sentiment, "all">, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  bad:       { label: "Bad",       emoji: "😡", color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-950/30",    border: "border-rose-200 dark:border-rose-800" },
  poor:      { label: "Poor",      emoji: "😕", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800" },
  good:      { label: "Good",      emoji: "😊", color: "text-sky-600 dark:text-sky-400",      bg: "bg-sky-50 dark:bg-sky-950/30",      border: "border-sky-200 dark:border-sky-800" },
  excellent: { label: "Excellent", emoji: "🤩", color: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-50 dark:bg-emerald-950/30",border: "border-emerald-200 dark:border-emerald-800" },
};

export default function OwnerReviewsPage() {
  const { loading, userId: ownerId, error } = useRoleGuard("owner");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [pgs, setPgs] = useState<PG[]>([]);
  const [filterPgId, setFilterPgId] = useState<string>("all");
  const [filterSentiment, setFilterSentiment] = useState<Sentiment>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;

    // Load owner's PGs
    getPGsByOwner(ownerId).then(setPgs).catch(console.error);

    // Real-time subscription to pg-reviews tagged to this owner
    const q = query(
      collection(db, "communityMessages"),
      where("ownerId", "==", ownerId),
      where("channel", "==", "pg-reviews")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ReviewItem[];
      setReviews(items);
      setDataLoading(false);
    }, (err) => {
      console.warn("[Reviews] Subscription error:", err);
      setDataLoading(false);
    });

    return () => unsub();
  }, [ownerId]);

  // Apply filters (PG + Sentiment + Sort)
  const filteredReviews = reviews
    .filter(r => filterPgId === "all" || r.pgId === filterPgId)
    .filter(r => filterSentiment === "all" || classifyReview(r.rating || 0) === filterSentiment)
    .sort((a, b) => {
      if (sortBy === "newest") return b.createdAt - a.createdAt;
      if (sortBy === "oldest") return a.createdAt - b.createdAt;
      if (sortBy === "highest") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "lowest") return (a.rating || 0) - (b.rating || 0);
      return 0;
    });

  // Sentiment counts for the filter pills
  const sentimentCounts = {
    bad: reviews.filter(r => classifyReview(r.rating || 0) === "bad").length,
    poor: reviews.filter(r => classifyReview(r.rating || 0) === "poor").length,
    good: reviews.filter(r => classifyReview(r.rating || 0) === "good").length,
    excellent: reviews.filter(r => classifyReview(r.rating || 0) === "excellent").length,
  };

  // Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
    : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: totalReviews > 0 ? (reviews.filter(r => r.rating === star).length / totalReviews) * 100 : 0
  }));

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const getPgName = (pgId?: string) => {
    if (!pgId) return "Unknown PG";
    const pg = pgs.find(p => p.id === pgId);
    return pg?.name || "Unknown PG";
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md w-full px-6 bg-white dark:bg-zinc-900 p-12 rounded-[2rem] shadow-2xl border border-border">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2 text-foreground">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/dashboard">
            <Button className="w-full">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading || dataLoading) {
    return <SpeedLoader text="Loading reviews..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/owner">
              <button className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">PG Reviews</h1>
              <p className="text-xs text-muted-foreground font-medium">Reviews from tenants across your properties</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-black text-amber-700 dark:text-amber-400">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-amber-600 dark:text-amber-500">/ 5</span>
            </div>
            <div className="hidden sm:block bg-slate-100 dark:bg-zinc-800 rounded-xl px-3 py-2">
              <span className="text-sm font-black text-foreground">{totalReviews}</span>
              <span className="text-xs text-muted-foreground ml-1">reviews</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Panel — Stats & Filters */}
          <div className="lg:col-span-4 space-y-6">
            {/* Rating Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-6 shadow-sm dark:shadow-zinc-900/50"
            >
              <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4">Rating Overview</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl font-black text-foreground">{avgRating.toFixed(1)}</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{totalReviews} total reviews</p>
                </div>
              </div>

              {/* Distribution Bars */}
              <div className="space-y-2">
                {ratingDistribution.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-6">{star}★</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 * star }}
                        className="h-full bg-amber-400 rounded-full"
                      />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-6 shadow-sm dark:shadow-zinc-900/50"
            >
              <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </h3>

              {/* PG Filter */}
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Property</label>
              <select
                value={filterPgId}
                onChange={e => setFilterPgId(e.target.value)}
                className="w-full text-sm font-medium px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
              >
                <option value="all">All Properties</option>
                {pgs.map(pg => (
                  <option key={pg.id} value={pg.id}>{pg.name}</option>
                ))}
              </select>

              {/* Sort Filter */}
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">Sort By</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="w-full text-sm font-medium px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>

              {/* Sentiment / Quality Filter */}
              <label className="text-xs font-bold text-muted-foreground block mb-2 mt-4">Quality</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterSentiment("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                    filterSentiment === "all"
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                      : "bg-slate-100 dark:bg-zinc-800 text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  All ({totalReviews})
                </button>
                {(["excellent", "good", "poor", "bad"] as const).map(s => {
                  const cfg = SENTIMENT_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setFilterSentiment(filterSentiment === s ? "all" : s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1 ${
                        filterSentiment === s
                          ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm`
                          : "bg-slate-100 dark:bg-zinc-800 text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      <span>{cfg.emoji}</span> {cfg.label} ({sentimentCounts[s]})
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Right Panel — Reviews List */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="popLayout">
              {filteredReviews.length > 0 ? filteredReviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-6 shadow-sm dark:shadow-zinc-900/50 mb-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">{review.userName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{review.userRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(() => {
                        const sentiment = classifyReview(review.rating || 0) as Exclude<Sentiment, "all">;
                        const cfg = SENTIMENT_CONFIG[sentiment];
                        return (
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                            {cfg.emoji} {cfg.label}
                          </span>
                        );
                      })()}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= (review.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="text-base font-black text-foreground mt-4 leading-snug">{review.title}</h4>
                  )}

                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.text}</p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{getPgName(review.pgId)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeAgo(review.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-16 text-center shadow-sm dark:shadow-zinc-900/50"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-black text-foreground mb-2">No Reviews Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    When tenants leave reviews for your properties in the Community Hub, they will appear here in real time.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
