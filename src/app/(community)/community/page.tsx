"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/db/users";
import {
  CommunityMessage, CommunityPresence,
  sendMessage, subscribeToChannel, toggleUpvote,
  setPresence, removePresence, subscribeToPresence,
  containsProfanity, cleanupOldMessages
} from "@/lib/db/community";
import {
  Hash, Send, ArrowUp, Star, Users, MessageCircle,
  Lightbulb, HelpCircle, Coffee, MessageSquare, AlertTriangle,
  ChevronLeft, X, Lock
} from "lucide-react";
import { SpeedLoader } from "@/components/ui/SpeedLoader";
import { getPGs, PG } from "@/lib/db/pgs";

type Channel = "general" | "ideas" | "pg-reviews" | "help" | "off-topic" | "tenants-only" | "owners-only";

const CHANNELS: { id: Channel; name: string; icon: any; desc: string; roles?: string[] }[] = [
  { id: "general", name: "General", icon: MessageCircle, desc: "Say hi, share updates" },
  { id: "ideas", name: "Ideas", icon: Lightbulb, desc: "Share & upvote ideas" },
  { id: "pg-reviews", name: "PG Reviews", icon: Star, desc: "Honest PG reviews" },
  { id: "tenants-only", name: "Tenants Lounge", icon: Users, desc: "Only for tenants", roles: ["tenant", "student", "admin"] },
  { id: "owners-only", name: "Owners Hub", icon: Users, desc: "Only for owners", roles: ["owner", "caretaker", "admin"] },
  { id: "help", name: "Help", icon: HelpCircle, desc: "Ask questions" },
  { id: "off-topic", name: "Off Topic", icon: Coffee, desc: "Fun & random chats" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500", owner: "bg-blue-500", tenant: "bg-green-500",
  caretaker: "bg-purple-500", student: "bg-amber-500",
};

const AVATAR_COLORS = [
  "bg-primary", "bg-blue-500", "bg-emerald-500", "bg-purple-500",
  "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

export default function CommunityPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [activeChannel, setActiveChannel] = useState<Channel>("general");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<CommunityPresence[]>([]);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [profanityWarn, setProfanityWarn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [sortIdeas, setSortIdeas] = useState<"newest" | "top">("newest");
  const [permissionError, setPermissionError] = useState(false);

  // PG Mentions
  const [pgs, setPgs] = useState<PG[]>([]);
  const [showPgDropdown, setShowPgDropdown] = useState(false);
  const [selectedPg, setSelectedPg] = useState<PG | null>(null);

  // User Mentions
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const prevMessagesLength = useRef(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u: any) => {
      if (u) {
        setUserId(u.uid);
        const profile = await getUserProfile(u.uid);
        setUserName(profile?.name || u.displayName || "Anonymous");
        setUserRole(profile?.role || "tenant");
        await setPresence(u.uid, profile?.name || "Anonymous", profile?.role || "tenant");
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Request Notification Permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Presence cleanup
  useEffect(() => {
    if (!userId) return;
    const handleUnload = () => removePresence(userId);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      handleUnload();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [userId]);

  // Fetch PGs for tagging
  useEffect(() => {
    getPGs().then(setPgs).catch(console.error);
  }, []);

  // Subscribe to channel messages
  useEffect(() => {
    if (!userId) return;
    try {
      const unsub = subscribeToChannel(activeChannel, setMessages);
      return () => unsub();
    } catch (err) {
      console.warn("[Community] Channel subscription failed:", err);
      setPermissionError(true);
    }
  }, [activeChannel, userId]);

  // Subscribe to presence
  useEffect(() => {
    if (!userId) return;
    try {
      const unsub = subscribeToPresence(setOnlineUsers);
      return () => unsub();
    } catch (err) {
      console.warn("[Community] Presence subscription failed:", err);
    }
  }, [userId]);

  // Auto scroll on new messages and trigger notifications for mentions
  useEffect(() => {
    if (["general", "help", "off-topic", "tenants-only", "owners-only"].includes(activeChannel)) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    if (messages.length > prevMessagesLength.current && prevMessagesLength.current > 0) {
      const latestMsg = messages[messages.length - 1];
      if (latestMsg.userId !== userId && latestMsg.text.includes(`@${userName}`)) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`New mention from ${latestMsg.userName}`, {
            body: latestMsg.text,
            icon: "/icon.png"
          });
        }
        if ("vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, activeChannel, userId, userName]);

  // Monthly cleanup on mount
  useEffect(() => {
    if (!userId) return;
    cleanupOldMessages().then(n => {
      if (n > 0) console.log(`[Community] Cleaned ${n} old messages.`);
    }).catch(err => {
      console.warn("[Community] Cleanup failed:", err);
    });
  }, [userId]);

  const handleSend = async () => {
    if (!userId || !text.trim()) return;
    if (containsProfanity(text) || (title && containsProfanity(title))) {
      setProfanityWarn(true);
      setTimeout(() => setProfanityWarn(false), 4000);
      return;
    }
    setSending(true);
    const result = await sendMessage({
      channel: activeChannel,
      userId, userName, userRole,
      text: text.trim(),
      ...(["ideas", "pg-reviews"].includes(activeChannel) && title.trim() ? { title: title.trim() } : {}),
      ...(activeChannel === "pg-reviews" ? { rating } : {}),
      ...(activeChannel === "ideas" ? { upvotes: [] } : {}),
      ...(activeChannel === "pg-reviews" && selectedPg ? { pgId: selectedPg.id, ownerId: selectedPg.ownerId } : {}),
    });
    if (result) {
      setText("");
      setTitle("");
      setSelectedPg(null);
      inputRef.current?.focus();
    } else {
      setProfanityWarn(true);
      setTimeout(() => setProfanityWarn(false), 4000);
    }
    setSending(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    
    // Check for user mentions
    const words = val.split(" ");
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("@") && lastWord.length > 0 && activeChannel !== "pg-reviews") {
      setShowUserDropdown(true);
      setMentionQuery(lastWord.slice(1).toLowerCase());
    } else {
      setShowUserDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUpvote = async (msg: CommunityMessage) => {
    if (!userId) return;
    const hasVoted = msg.upvotes?.includes(userId) || false;
    await toggleUpvote(msg.id, userId, hasVoted);
  };

  const isChat = ["general", "help", "off-topic"].includes(activeChannel);
  const channelInfo = CHANNELS.find(c => c.id === activeChannel)!;

  const displayMessages = activeChannel === "ideas" && sortIdeas === "top"
    ? [...messages].sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0))
    : messages;

  if (loading) return <SpeedLoader />;

  if (!userId) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto p-8">
          <MessageSquare className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black mb-3">Savion Community</h1>
          <p className="text-muted-foreground mb-6">Sign in to join live discussions, share ideas, and connect with fellow residents.</p>
          <a href="/login" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">Sign In to Join</a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR — Channels */}
      <motion.aside
        className={`fixed lg:relative z-50 lg:z-auto top-0 left-0 h-full w-64 bg-zinc-900 text-white flex flex-col shrink-0 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight">Savion Community</h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Back to main site */}
        <a href="/" className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white/40 hover:text-white/70 border-b border-white/5 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Savion
        </a>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {CHANNELS.filter(ch => !ch.roles || ch.roles.includes(userRole)).map(ch => {
            const Icon = ch.icon;
            const active = activeChannel === ch.id;
            return (
              <button key={ch.id} onClick={() => { setActiveChannel(ch.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-white dark:bg-zinc-900/15 text-white" : "text-white/50 hover:text-white/80 hover:bg-white dark:bg-zinc-900/5"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div>{ch.name}</div>
                  <div className="text-[10px] opacity-60">{ch.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-white/10 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${getAvatarColor(userName)} flex items-center justify-center text-white text-sm font-bold`}>
            {userName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{userName}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">{userRole}</div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
        </div>
      </motion.aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="h-14 border-b flex items-center px-4 gap-3 shrink-0 bg-background">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <Hash className="w-5 h-5" />
          </button>
          <channelInfo.icon className="w-5 h-5 text-primary hidden lg:block" />
          <h3 className="font-bold text-foreground">#{channelInfo.name}</h3>
          <span className="text-xs text-muted-foreground hidden md:block">— {channelInfo.desc}</span>
          <div className="ml-auto flex items-center gap-2">
            {activeChannel === "ideas" && (
              <select value={sortIdeas} onChange={e => setSortIdeas(e.target.value as any)}
                className="text-xs bg-slate-100 dark:bg-zinc-800 border-0 rounded-lg px-2 py-1 font-medium">
                <option value="newest">Newest</option>
                <option value="top">Most Upvoted</option>
              </select>
            )}
            <button onClick={() => setUsersOpen(!usersOpen)}
              className="lg:hidden flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Users className="w-4 h-4" /><span>{onlineUsers.length}</span>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {displayMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <channelInfo.icon className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No messages yet in #{channelInfo.name}</p>
              <p className="text-sm">Be the first to start the conversation!</p>
            </div>
          )}

          {displayMessages.map((msg, i) => {
            const isOwn = msg.userId === userId;
            const showAvatar = i === 0 || displayMessages[i - 1]?.userId !== msg.userId;
            const isIdea = msg.channel === "ideas" && msg.title;
            const isReview = msg.channel === "pg-reviews" && msg.title;

            if (isIdea || isReview) {
              // Card format for ideas & reviews
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-zinc-900 border rounded-2xl p-5 mb-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(msg.userName)} flex items-center justify-center text-white text-xs font-bold`}>
                      {msg.userName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-sm">{msg.userName}</span>
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full text-white ${ROLE_COLORS[msg.userRole] || "bg-slate-400"}`}>{msg.userRole}</span>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">{timeAgo(msg.createdAt)}</span>
                  </div>
                  <h4 className="font-bold text-lg text-foreground mb-1">{msg.title}</h4>
                  {isReview && msg.rating && (
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= msg.rating! ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                  )}
                  <p className="text-muted-foreground text-sm leading-relaxed">{msg.text}</p>
                  {isIdea && (
                    <button onClick={() => handleUpvote(msg)}
                      className={`mt-3 flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${msg.upvotes?.includes(userId) ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200"}`}>
                      <ArrowUp className="w-4 h-4" />
                      {msg.upvotes?.length || 0}
                    </button>
                  )}
                </motion.div>
              );
            }

            // Chat bubble format
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, x: isOwn ? 10 : -10 }} animate={{ opacity: 1, x: 0 }}
                className={`flex gap-2.5 ${showAvatar ? "mt-4" : "mt-0.5"} ${isOwn ? "flex-row-reverse" : ""}`}>
                {showAvatar ? (
                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(msg.userName)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {msg.userName[0]?.toUpperCase()}
                  </div>
                ) : <div className="w-8 shrink-0" />}
                <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                  {showAvatar && (
                    <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? "justify-end" : ""}`}>
                      <span className="text-xs font-bold">{msg.userName}</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded text-white ${ROLE_COLORS[msg.userRole] || "bg-slate-400"}`}>{msg.userRole}</span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(msg.createdAt)}</span>
                    </div>
                  )}
                  <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${isOwn ? "bg-primary text-white rounded-br-md" : "bg-slate-100 dark:bg-zinc-800 text-foreground rounded-bl-md"}`}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Profanity warning */}
        <AnimatePresence>
          {profanityWarn && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Your message contains inappropriate language. Please keep it respectful.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compose bar */}
        <div className="p-3 border-t bg-background/80 backdrop-blur-sm relative">
          {activeChannel === "pg-reviews" && userRole !== "tenant" && userRole !== "admin" ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Only tenants can post PG reviews.</span>
            </div>
          ) : (
            <>
              {["ideas", "pg-reviews"].includes(activeChannel) && (
                <div className="flex gap-2 mb-2 relative">
                  <input 
                    value={title} 
                    onChange={e => {
                      setTitle(e.target.value);
                      if (activeChannel === "pg-reviews" && e.target.value.includes("@")) {
                        setShowPgDropdown(true);
                      } else {
                        setShowPgDropdown(false);
                      }
                      if (!e.target.value.includes("@" + selectedPg?.name)) {
                        setSelectedPg(null); // Clear selection if user edits it out
                      }
                    }}
                    placeholder={activeChannel === "ideas" ? "Idea title..." : "Type @ to select a PG..."}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/30" 
                  />
                  
                  {/* PG Tagging Dropdown */}
                  <AnimatePresence>
                    {showPgDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 w-72 max-h-48 overflow-y-auto bg-white dark:bg-zinc-900 border shadow-xl dark:shadow-zinc-900/50 rounded-xl z-50 p-1"
                      >
                        <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Select a PG</div>
                        {pgs.filter(p => p.name.toLowerCase().includes(title.split("@")[1]?.toLowerCase() || "")).map(pg => (
                          <button 
                            key={pg.id}
                            onClick={() => {
                              setSelectedPg(pg);
                              setTitle(`@${pg.name} `);
                              setShowPgDropdown(false);
                              inputRef.current?.focus();
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:bg-zinc-800 text-sm font-medium flex items-center justify-between"
                          >
                            <span>{pg.name}</span>
                            <span className="text-[10px] text-muted-foreground">{pg.city}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {activeChannel === "pg-reviews" && (
                    <div className="flex items-center gap-1 px-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Star className={`w-5 h-5 transition-colors ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-300"}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 items-end relative">
            {/* User Tagging Dropdown */}
            <AnimatePresence>
              {showUserDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 w-64 max-h-48 overflow-y-auto bg-white dark:bg-zinc-900 border shadow-xl dark:shadow-zinc-900/50 rounded-xl z-50 p-1"
                >
                  <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Mention User</div>
                  {onlineUsers.filter(u => u.userName.toLowerCase().includes(mentionQuery) && u.userId !== userId).map(user => (
                    <button 
                      key={user.userId}
                      onClick={() => {
                        const words = text.split(" ");
                        words.pop();
                        words.push(`@${user.userName} `);
                        setText(words.join(" "));
                        setShowUserDropdown(false);
                        inputRef.current?.focus();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:bg-zinc-800 text-sm font-medium flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <Users className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="truncate">{user.userName}</span>
                    </button>
                  ))}
                  {onlineUsers.filter(u => u.userName.toLowerCase().includes(mentionQuery) && u.userId !== userId).length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No matching online users found.</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <textarea ref={inputRef} value={text} onChange={handleTextChange} onKeyDown={handleKeyDown}
              placeholder={`Message #${channelInfo.name.toLowerCase()}... (Type @ to mention)`} rows={1}
              className="flex-1 resize-none text-sm px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32" />
            <button onClick={handleSend} disabled={sending || !text.trim() || (activeChannel === "pg-reviews" && !selectedPg)}
              className="h-11 w-11 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shrink-0"
              title={activeChannel === "pg-reviews" && !selectedPg ? "Please tag a PG using @" : ""}>
              <Send className="w-5 h-5" />
            </button>
          </div>
            </>
          )}
        </div>
      </main>

      {/* RIGHT PANEL — Online Users (desktop) */}
      <aside className={`w-56 border-l bg-background shrink-0 flex-col hidden lg:flex`}>
        <div className="p-4 border-b">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Online — {onlineUsers.length}
          </h4>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {onlineUsers.map(u => (
            <div key={u.userId} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:bg-zinc-800/50 transition-colors">
              <div className="relative">
                <div className={`w-8 h-8 rounded-full ${getAvatarColor(u.userName)} flex items-center justify-center text-white text-xs font-bold`}>
                  {u.userName[0]?.toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{u.userName}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{u.userRole}</div>
              </div>
            </div>
          ))}
          {onlineUsers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No one else is online</p>
          )}
        </div>
      </aside>

      {/* Mobile users drawer */}
      <AnimatePresence>
        {usersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setUsersOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring" as const, damping: 25 }}
              className="fixed right-0 top-0 h-full w-64 bg-background border-l z-50 lg:hidden flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h4 className="text-sm font-bold">Online — {onlineUsers.length}</h4>
                <button onClick={() => setUsersOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {onlineUsers.map(u => (
                  <div key={u.userId} className="flex items-center gap-2.5 px-2 py-1.5">
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(u.userName)} flex items-center justify-center text-white text-xs font-bold`}>
                      {u.userName[0]?.toUpperCase()}
                    </div>
                    <div className="text-sm font-medium truncate">{u.userName}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
