import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/client";

export type UserRole = "tenant" | "owner" | "caretaker" | "admin" | "student" | "disabled";

export interface UserProfile {
  uid: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  upiId?: string;       // For owners — their UPI ID for rent collection
  isVerified?: boolean;  // KYC verification status
  createdAt: number;
}

// ── SECURITY: Reserved names that cannot be used as display names ────────
const RESERVED_NAMES = [
  "admin", "support", "savion", "system", "moderator", "mod",
  "helpdesk", "official", "staff", "team", "bot", "administrator",
];

// ── SECURITY: Roles that users are allowed to self-assign ───────────────
const ALLOWED_SELF_ROLES: UserRole[] = ["tenant", "owner", "caretaker", "student"];

export function isReservedName(name: string): boolean {
  const lower = name.toLowerCase().replace(/[^a-z]/g, "");
  return RESERVED_NAMES.some(r => lower.includes(r));
}

export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  // Block reserved names
  if (data.name && isReservedName(data.name)) {
    throw new Error("This display name is reserved. Please choose another.");
  }

  // Block self-escalation to admin/disabled
  if (data.role && !ALLOWED_SELF_ROLES.includes(data.role)) {
    data.role = "tenant"; // Fallback to safe default
  }

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      role: data.role || "tenant",
      name: data.name || "Anonymous",
      email: data.email || null,
      phone: data.phone || null,
      isVerified: false,
      createdAt: Date.now(),
      ...data,
    });
  } else {
    // SECURITY: Never allow role change via client update
    const { role: _role, ...safeData } = data;
    await updateDoc(userRef, safeData as Record<string, unknown>);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return snap.data() as UserProfile;
  return null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, "users", uid);
  const sanitized = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  await setDoc(userRef, sanitized, { merge: true });
}
