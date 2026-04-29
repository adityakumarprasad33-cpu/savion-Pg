import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "../firebase/client";

export interface Caretaker {
  id: string;
  uid: string;            // custom login ID e.g. "CT001" or "john_hk"
  email: string;          // uid@savion.caretaker (used for Firebase Auth, hidden)
  name: string;
  ownerId: string;        // which owner created this caretaker
  pgIds: string[];        // PGs this caretaker manages
  saved: boolean;         // saved to owner's reusable pool
  createdAt: number;
}

/**
 * Check if a caretaker UID already exists globally.
 * Must be globally unique since it maps to a Firebase Auth email.
 */
export async function checkCaretakerUidExists(uid: string): Promise<boolean> {
  const email = `${uid.trim().toLowerCase()}@savion.caretaker`;
  const q = query(collection(db, "caretakers"), where("email", "==", email));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function createCaretaker(
  data: Omit<Caretaker, "id" | "email" | "createdAt">
): Promise<Caretaker> {
  const caretakerRef = doc(collection(db, "caretakers"));
  const email = `${data.uid}@savion.caretaker`;
  const caretaker: Caretaker = {
    ...data,
    id: caretakerRef.id,
    email,
    createdAt: Date.now(),
  };
  await setDoc(caretakerRef, caretaker);
  return caretaker;
}

export async function getSavedCaretakersByOwner(ownerId: string): Promise<Caretaker[]> {
  const q = query(
    collection(db, "caretakers"),
    where("ownerId", "==", ownerId),
    where("saved", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Caretaker);
}

export async function getCaretakerByEmail(email: string): Promise<Caretaker | null> {
  const q = query(collection(db, "caretakers"), where("email", "==", email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Caretaker;
}
