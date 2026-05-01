import { collection, doc, getDocs, query, setDoc, where, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/client";

export interface Booking {
  id: string;
  tenantId: string;        // Firebase Auth UID of the tenant
  tenantName?: string;     // Full name of the resident
  pgId: string;
  pgName: string;
  ownerId: string;         // Owner's UID — for owner dashboard access
  roomId?: string;         // Specific room ID
  roomNo?: string;         // Specific room number (e.g., "101")
  roomType: string;
  moveInDate: string;      // ISO date string e.g. "2024-06-01"
  amount: number;
  paymentChoice?: "payNow" | "payLater";
  status: "pending" | "approved" | "confirmed" | "cancelled" | "disputed" | "notice_given" | "notice_approved";
  moveOutDate?: string; // ISO date string e.g. "2024-06-15"
  // KYC Documents
  aadhaarUrl: string;      // Required — Aadhaar or Govt ID
  extraDocUrl?: string;    // Optional extra document
  // Signature
  signatureUrl: string;    // Tenant drawn/uploaded signature (Cloudinary)
  // Contract
  contractId: string;      // Links to contracts/ collection
  createdAt: number;
}

export async function createBooking(
  data: Omit<Booking, "id" | "createdAt">
): Promise<Booking> {
  const bookingRef = doc(collection(db, "bookings"));
  const newBooking: Booking = {
    ...data,
    id: bookingRef.id,
    createdAt: Date.now(),
  };

  // Firestore rejects undefined values — strip them before writing
  const sanitized = Object.fromEntries(
    Object.entries(newBooking).filter(([, v]) => v !== undefined)
  ) as Booking;

  await setDoc(bookingRef, sanitized);
  return sanitized;
}


export async function getUserBookings(tenantId: string): Promise<Booking[]> {
  const q = query(
    collection(db, "bookings"),
    where("tenantId", "==", tenantId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Booking);
}

export async function getBookingsByOwner(ownerId: string): Promise<Booking[]> {
  const q = query(collection(db, "bookings"), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Booking);
}

export async function getBookingsByPG(pgId: string): Promise<Booking[]> {
  const q = query(collection(db, "bookings"), where("pgId", "==", pgId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Booking);
}

export async function updateBooking(id: string, data: Partial<Booking>): Promise<void> {
  const ref = doc(db, "bookings", id);
  await updateDoc(ref, data);
}

export async function deleteBooking(id: string): Promise<void> {
  const ref = doc(db, "bookings", id);
  await deleteDoc(ref);
}
