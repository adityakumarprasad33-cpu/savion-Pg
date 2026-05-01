import { db } from "../firebase/client";
import { collection, doc, setDoc, getDocs, query, where, orderBy, addDoc } from "firebase/firestore";

export interface Review {
  id: string;
  tenantId: string;
  tenantName: string;
  pgId: string;
  pgName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export async function createReview(data: Omit<Review, "id" | "createdAt">): Promise<Review> {
  const reviewsRef = collection(db, "reviews");
  const docRef = await addDoc(reviewsRef, {
    ...data,
    createdAt: Date.now(),
  });
  return { id: docRef.id, ...data, createdAt: Date.now() };
}

export async function getReviewsByPG(pgId: string): Promise<Review[]> {
  const q = query(collection(db, "reviews"), where("pgId", "==", pgId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
}

export async function getAllReviews(): Promise<Review[]> {
  const snap = await getDocs(collection(db, "reviews"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
}

export async function hasTenantReviewedPG(tenantId: string, pgId: string): Promise<boolean> {
  const q = query(collection(db, "reviews"), where("tenantId", "==", tenantId), where("pgId", "==", pgId));
  const snap = await getDocs(q);
  return !snap.empty;
}
