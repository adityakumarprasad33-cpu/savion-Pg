import { db } from "../firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface TopCity {
  city: string;
  places: string;
  img: string;
  tag: string;
}

export interface PlatformStats {
  id: string; // usually 'global'
  count: number;
  rating: number;
  reviews: number;
  cities: number;
  pgs: number;
  topCities: TopCity[];
  lastUpdated: number;
}

export async function getPlatformStats(): Promise<PlatformStats | null> {
  try {
    const docRef = doc(db, "platformStats", "global");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as PlatformStats;
    }
    return null;
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return null;
  }
}

export async function updatePlatformStats(stats: Partial<PlatformStats>): Promise<void> {
  try {
    const docRef = doc(db, "platformStats", "global");
    await setDoc(docRef, { ...stats, lastUpdated: Date.now() }, { merge: true });
  } catch (error) {
    console.error("Error updating platform stats:", error);
    throw error;
  }
}
