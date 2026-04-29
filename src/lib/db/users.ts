import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/client";

export type UserRole = "tenant" | "owner" | "caretaker" | "admin" | "student";

export interface UserProfile {
  uid: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  upiId?: string;       // For owners — their UPI ID for rent collection
  createdAt: number;
}

export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      role: data.role || "tenant",
      name: data.name || "Anonymous",
      email: data.email || null,
      phone: data.phone || null,
      createdAt: Date.now(),
      ...data,
    });
  } else {
    await updateDoc(userRef, data as Record<string, unknown>);
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
  await updateDoc(userRef, sanitized);
}
