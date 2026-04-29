import {
  collection, doc, getDocs, query, setDoc, updateDoc, where, orderBy
} from "firebase/firestore";
import { db } from "../firebase/client";

export interface Payment {
  id: string;
  bookingId: string;
  contractId: string;
  tenantId: string;
  tenantName: string;
  tenantAadhaar: string;       // Last 4 digits shown masked
  ownerId: string;
  ownerName: string;
  ownerUpiId: string;
  pgId: string;
  pgName: string;
  roomNo: string;
  amount: number;
  month: string;               // "2025-06"
  utrNumber: string;
  type: "rent" | "security_deposit";
  status: "submitted" | "verified" | "rejected";
  createdAt: number;
}

export async function submitPayment(
  data: Omit<Payment, "id" | "createdAt" | "status">
): Promise<Payment> {
  const ref = doc(collection(db, "payments"));
  const payment: Payment = {
    ...data,
    id: ref.id,
    status: "verified",   // Auto-verified on submission — no manual owner step needed
    createdAt: Date.now(),
  };
  const sanitized = Object.fromEntries(
    Object.entries(payment).filter(([, v]) => v !== undefined)
  ) as Payment;
  await setDoc(ref, sanitized);
  return sanitized;
}

export async function getPaymentsByTenant(tenantId: string): Promise<Payment[]> {
  const q = query(
    collection(db, "payments"),
    where("tenantId", "==", tenantId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Payment).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getPaymentsByOwner(ownerId: string): Promise<Payment[]> {
  const q = query(
    collection(db, "payments"),
    where("ownerId", "==", ownerId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Payment).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getPaymentsByPG(pgId: string): Promise<Payment[]> {
  const q = query(
    collection(db, "payments"),
    where("pgId", "==", pgId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Payment).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllPayments(): Promise<Payment[]> {
  const snap = await getDocs(collection(db, "payments"));
  return snap.docs.map((d) => d.data() as Payment).sort((a, b) => b.createdAt - a.createdAt);
}

export async function updatePaymentStatus(
  id: string,
  status: "verified" | "rejected"
): Promise<void> {
  const ref = doc(db, "payments", id);
  await updateDoc(ref, { status });
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const { getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, "payments", id));
  if (snap.exists()) return snap.data() as Payment;
  return null;
}
