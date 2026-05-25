import { collection, doc, getDocs, query, setDoc, where, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/client";

export interface Complaint {
  id: string;
  tenantId: string;
  ownerId?: string;
  pgId: string;
  pgName: string;
  category: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: number;
  tenantName?: string;
  roomNo?: string;
  regId?: string;
}

export async function createComplaint(data: Omit<Complaint, "id" | "createdAt" | "status">): Promise<Complaint> {
  const ref = doc(collection(db, "complaints"));
  const newComplaint: Complaint = {
    ...data,
    id: ref.id,
    status: "open",
    createdAt: Date.now(),
  };

  const sanitized = Object.fromEntries(
    Object.entries(newComplaint).filter(([, v]) => v !== undefined)
  ) as Complaint;

  await setDoc(ref, sanitized);
  return sanitized;
}

export async function getUserComplaints(tenantId: string): Promise<Complaint[]> {
  const q = query(
    collection(db, "complaints"),
    where("tenantId", "==", tenantId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Complaint).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getComplaintsByPG(pgId: string): Promise<Complaint[]> {
  const q = query(collection(db, "complaints"), where("pgId", "==", pgId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Complaint).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getCaretakerComplaints(caretakerId: string): Promise<Complaint[]> {
  // Since complaints don't store caretakerId directly, we find the PGs first.
  const { getDocs, query, collection, where } = await import("firebase/firestore");
  const { db } = await import("../firebase/client");
  const pgQuery = query(collection(db, "pgs"), where("caretakerId", "==", caretakerId));
  const pgSnap = await getDocs(pgQuery);
  if (pgSnap.empty) return [];
  const pgIds = pgSnap.docs.map(d => d.id);
  
  // Firestore where("in") supports up to 10 items
  const chunks = [];
  for (let i = 0; i < pgIds.length; i += 10) {
    chunks.push(pgIds.slice(i, i + 10));
  }
  
  let allComplaints: Complaint[] = [];
  for (const chunk of chunks) {
    const q = query(collection(db, "complaints"), where("pgId", "in", chunk));
    const snap = await getDocs(q);
    allComplaints = [...allComplaints, ...snap.docs.map(d => d.data() as Complaint)];
  }
  
  return allComplaints.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateComplaintStatus(id: string, status: "open" | "in-progress" | "resolved"): Promise<void> {
  const ref = doc(db, "complaints", id);
  await updateDoc(ref, { status });
}

/** Deletes all complaints for a specific tenant at a specific PG — called on auto-checkout. */
export async function deleteComplaintsByTenantAndPG(tenantId: string, pgId: string): Promise<void> {
  const q = query(
    collection(db, "complaints"),
    where("tenantId", "==", tenantId),
    where("pgId", "==", pgId)
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
