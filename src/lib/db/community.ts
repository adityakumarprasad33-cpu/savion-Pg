import { db } from "../firebase/client";
import {
  collection, doc, setDoc, getDocs, deleteDoc,
  query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove,
  Unsubscribe, limit
} from "firebase/firestore";
import { createNotification } from "./notifications";

export interface CommunityMessage {
  id: string;
  channel: "general" | "ideas" | "pg-reviews" | "help" | "off-topic" | "tenants-only" | "owners-only";
  userId: string;
  userName: string;
  userRole: string;
  text: string;
  title?: string;       // Ideas & reviews only
  rating?: number;      // Reviews only (1-5)
  upvotes?: string[];   // Ideas only — array of userIds
  pgId?: string;        // PG Reviews only
  ownerId?: string;     // PG Reviews only
  createdAt: number;
}

export interface CommunityPresence {
  userId: string;
  userName: string;
  userRole: string;
  lastSeen: number;
  online: boolean;
}

// ─── PROFANITY FILTER ──────────────────────────────────────────────────────
const BLOCKED_WORDS = [
  "fuck","shit","bitch","asshole","bastard","damn","dick","pussy","cunt",
  "whore","slut","nigger","fag","retard","motherfucker","cocksucker",
  "bullshit","dumbass","jackass","piss","crap","stfu","wtf","lmao",
  "madarchod","bhenchod","chutiya","gaandu","randi","harami","saala",
  "bhosdike","lodu","chutiye","kamina","kutta","kutti","gandu",
  "bc","mc","bsdk","lode","chut","bhosdi","lavde","jhatu",
  "sex","porn","nude","boobs","penis","vagina","xxx","horny",
  "rape","molest","kill","murder","suicide","drugs","weed","cocaine",
];

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F ]/g, "");
  const words = lower.split(/\s+/);
  return words.some(w => BLOCKED_WORDS.includes(w));
}

export function sanitizeText(text: string): string {
  const lower = text.toLowerCase();
  let result = text;
  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    result = result.replace(regex, "***");
  }
  return result;
}

// ─── MESSAGES CRUD ─────────────────────────────────────────────────────────

export async function sendMessage(
  data: Omit<CommunityMessage, "id" | "createdAt">
): Promise<CommunityMessage | null> {
  // Block profanity
  if (containsProfanity(data.text) || (data.title && containsProfanity(data.title))) {
    return null; // Caller should show warning
  }
  const ref = doc(collection(db, "communityMessages"));
  const msg: CommunityMessage = {
    ...data,
    id: ref.id,
    text: sanitizeText(data.text),
    title: data.title ? sanitizeText(data.title) : undefined,
    createdAt: Date.now(),
  };
  const sanitized = Object.fromEntries(
    Object.entries(msg).filter(([, v]) => v !== undefined)
  ) as CommunityMessage;
  await setDoc(ref, sanitized);

  // If this is a review and an owner is tagged, send them a notification
  if (data.channel === "pg-reviews" && data.ownerId) {
    await createNotification({
      userId: data.ownerId,
      title: "New PG Review",
      message: `${data.userName} posted a ${data.rating}-star review for your PG in the Community: "${data.title}"`,
      type: "system",
    });
  }

  return sanitized;
}

export function subscribeToChannel(
  channel: string,
  callback: (msgs: CommunityMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "communityMessages"),
    where("channel", "==", channel),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }) as CommunityMessage);
    // Sort client-side (avoids needing a composite index)
    msgs.sort((a, b) => a.createdAt - b.createdAt);
    callback(msgs);
  }, (err) => {
    console.error("[Community] Channel listener error:", err.message);
    callback([]);
  });
}

export async function toggleUpvote(messageId: string, userId: string, hasUpvoted: boolean): Promise<void> {
  const ref = doc(db, "communityMessages", messageId);
  if (hasUpvoted) {
    await updateDoc(ref, { upvotes: arrayRemove(userId) });
  } else {
    await updateDoc(ref, { upvotes: arrayUnion(userId) });
  }
}

// ─── PRESENCE ──────────────────────────────────────────────────────────────

export async function setPresence(userId: string, userName: string, userRole: string): Promise<void> {
  const ref = doc(db, "communityPresence", userId);
  await setDoc(ref, { userId, userName, userRole, lastSeen: Date.now(), online: true }, { merge: true });
}

export async function removePresence(userId: string): Promise<void> {
  const ref = doc(db, "communityPresence", userId);
  await setDoc(ref, { online: false, lastSeen: Date.now() }, { merge: true });
}

export function subscribeToPresence(callback: (users: CommunityPresence[]) => void): Unsubscribe {
  const q = query(collection(db, "communityPresence"), where("online", "==", true));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data() as CommunityPresence));
  }, (err) => {
    console.warn("[Community] Presence listener error:", err.message);
    callback([]);
  });
}

// ─── AUTO-CLEANUP (30 DAYS) ────────────────────────────────────────────────

export async function cleanupOldMessages(): Promise<number> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const q = query(
    collection(db, "communityMessages"),
    where("createdAt", "<", thirtyDaysAgo)
  );
  const snap = await getDocs(q);
  let deleted = 0;
  for (const d of snap.docs) {
    const data = d.data() as CommunityMessage;
    // Preserve ideas channel forever
    if (data.channel === "ideas") continue;
    await deleteDoc(d.ref);
    deleted++;
  }
  return deleted;
}
