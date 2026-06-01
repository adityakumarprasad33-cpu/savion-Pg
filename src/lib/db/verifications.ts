import { db } from "../firebase/client";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

export interface VerificationRecord {
  id: string; // userId
  userEmail: string;
  fullName: string;
  idType: "Aadhaar" | "Driving License" | "Passport";
  idUrl: string;
  selfieUrl?: string;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  mlConfidence?: number;
  faceMatchScore?: number;
  // BUG-Q5 FIX: Replaced 'any' with proper Firestore Timestamp union
  createdAt: Timestamp | number;
  updatedAt: Timestamp | number;
}


const COLLECTION_NAME = "verifications";

export const submitVerification = async (data: Omit<VerificationRecord, "createdAt" | "updatedAt">) => {
  const docRef = doc(db, COLLECTION_NAME, data.id);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getVerificationStatus = async (userId: string): Promise<VerificationRecord | null> => {
  const docRef = doc(db, COLLECTION_NAME, userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as VerificationRecord;
  }
  return null;
};

export const getPendingVerifications = async (): Promise<VerificationRecord[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("status", "==", "pending"),
    orderBy("updatedAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VerificationRecord));
};

export const getAllVerifications = async (): Promise<VerificationRecord[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("updatedAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VerificationRecord));
};

export const updateVerificationStatus = async (userId: string, status: "verified" | "rejected", reason?: string) => {
  const docRef = doc(db, COLLECTION_NAME, userId);
  await setDoc(docRef, {
    status,
    rejectionReason: reason || null,
    updatedAt: serverTimestamp()
  }, { merge: true });
};
