import {
  collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs
} from "firebase/firestore";
import { db } from "../firebase/client";

export interface PaymentSession {
  id: string;
  tenantId: string;          // Locked to auth.uid — cannot be changed after creation
  ownerId: string;           // From actual booking document
  ownerUpiId: string;        // From actual owner Firestore profile
  ownerName: string;
  pgId: string;
  pgName: string;
  roomNo: string;
  bookingId: string;
  contractId: string;
  tenantName: string;
  tenantAadhaar: string;
  amount: number;            // From actual booking — cannot be URL-tampered
  month: string;             // YYYY-MM
  type: "rent" | "security_deposit";
  status: "pending" | "used" | "expired";
  expiresAt: number;         // Server-set unix ms timestamp
  createdAt: number;
}

/** Creates a server-side payment session. The amount and all fields come from the
 *  verified booking document, NOT from user-controlled input. */
export async function createPaymentSession(
  data: Omit<PaymentSession, "id" | "createdAt" | "status" | "expiresAt">
): Promise<PaymentSession> {
  const ref = doc(collection(db, "paymentSessions"));
  const session: PaymentSession = {
    ...data,
    id: ref.id,
    status: "pending",
    expiresAt: Date.now() + 10 * 60 * 1000,  // 10 minutes from now
    createdAt: Date.now(),
  };
  await setDoc(ref, session);
  return session;
}

export async function getPaymentSession(id: string): Promise<PaymentSession | null> {
  const snap = await getDoc(doc(db, "paymentSessions", id));
  if (!snap.exists()) return null;
  return snap.data() as PaymentSession;
}

/** Marks session as used so it can never be replayed */
export async function markSessionUsed(id: string): Promise<void> {
  await updateDoc(doc(db, "paymentSessions", id), { status: "used" });
}

/** Marks session as expired */
export async function markSessionExpired(id: string): Promise<void> {
  await updateDoc(doc(db, "paymentSessions", id), { status: "expired" });
}
