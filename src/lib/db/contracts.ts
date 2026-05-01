import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/client";

export interface RentalContract {
  id: string;
  bookingId: string;
  pgId: string;
  pgName: string;
  pgLocation: string;
  ownerId: string;
  tenantId: string;
  tenantName: string;
  tenantAadhaarUrl: string;
  tenantAadhaarNumber?: string;
  tenantDob?: string;
  monthlyRent: string;
  moveInDate: string;
  securityDeposit: string;
  lockInMonths: number;
  noticePeriodDays: number;
  terms: string[];
  signatureUrl: string;
  status: "active" | "terminated" | "disputed";
  createdAt: number;
}

const DEFAULT_TERMS = [
  "The tenant agrees to pay rent on or before the 5th of every month.",
  "The security deposit is refundable within 30 days of vacating, subject to deductions for damages.",
  "The tenant shall not sub-let or assign the premises without the owner's written consent.",
  "The lock-in period is 3 months from the move-in date. Early termination incurs a 1-month rent penalty.",
  "A notice period of 30 days must be given before vacating the premises.",
  "The tenant agrees to keep the premises clean and not cause any structural damage.",
  "The owner reserves the right to take strict legal action and pursue collection proceedings if rent payment dues exceed the allowed timeline.",
  "Electricity and water charges (if any) are payable as per actual consumption.",
  "This agreement is governed by the laws of India and disputes shall be settled in local jurisdiction.",
];

export async function createContract(
  data: Omit<RentalContract, "id" | "createdAt" | "terms">
): Promise<RentalContract> {
  const contractRef = doc(collection(db, "contracts"));
  const contract: RentalContract = {
    ...data,
    id: contractRef.id,
    terms: DEFAULT_TERMS,
    createdAt: Date.now(),
  };
  await setDoc(contractRef, contract);
  return contract;
}

export async function getContractById(id: string): Promise<RentalContract | null> {
  const snap = await getDoc(doc(db, "contracts", id));
  if (snap.exists()) return snap.data() as RentalContract;
  return null;
}

export async function getContractsByOwner(ownerId: string): Promise<RentalContract[]> {
  const q = query(collection(db, "contracts"), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as RentalContract);
}

export async function getContractsByTenant(tenantId: string): Promise<RentalContract[]> {
  const q = query(collection(db, "contracts"), where("tenantId", "==", tenantId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as RentalContract);
}

export async function updateContractStatus(id: string, status: "active" | "terminated" | "disputed"): Promise<void> {
  const ref = doc(db, "contracts", id);
  await updateDoc(ref, { status });
}

export async function deleteContract(id: string): Promise<void> {
  const ref = doc(db, "contracts", id);
  await deleteDoc(ref);
}
