import { db } from "../firebase/client";
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc, limit, deleteDoc, orderBy } from "firebase/firestore";

export interface PGRoom {
  id: string;
  roomNumber: string;        // e.g., "101", "A1", "Ground-1"
  type: "Single" | "Double" | "Triple" | "Studio" | "Dormitory";
  monthlyRent: number;       // in INR
  capacity: number;          // max people (Single=1, Double=2, Triple=3, Studio=1, Dorm=8)
  currentOccupancy: number;  // how many people are currently living in this room
  available: number;         // computed: capacity - currentOccupancy
  floor?: string;            // optional floor (G, 1, 2, etc.)
  amenities: string[];
  image?: string;            // Cloudinary URL for specific room image
}

export interface PGRoomInput extends PGRoom {
  imageFile?: File;          // For UI upload state
  imagePreview?: string;     // For UI preview state
}

// Helper: get max capacity from room type
export function getRoomCapacity(type: PGRoom["type"]): number {
  const map: Record<PGRoom["type"], number> = {
    Single: 1, Double: 2, Triple: 3, Studio: 1, Dormitory: 8,
  };
  return map[type];
}

export interface PG {
  id: string;
  name: string;
  description: string;
  // Location
  location: string;        // full display address
  city: string;
  lat?: number;
  lng?: number;
  // Pricing (auto-set to lowest room rent)
  price: string;
  // Media
  img: string;             // main image URL
  images?: string[];       // extra gallery images
  // Property
  type: "Boys" | "Girls" | "Co-living";
  rating: number;
  ownerId: string;
  caretakerId?: string;
  // Rooms & Availability
  rooms: PGRoom[];
  totalRooms: number;      // sum of all room counts
  availableRooms: number;  // sum of available
  // Amenities & Rules
  facilities: string[];    // WiFi, AC, Food Included, etc.
  rules: string[];         // No smoking, No pets, etc.
  nearbyPlaces: string[];  // nearby colleges, metro stations, etc.
  createdAt?: number;
}

// Recursive Sanitize — strip undefined values from objects and arrays before Firestore writes
function sanitize(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => sanitize(v));
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitize(v)])
    );
  }
  return obj;
}

export async function getPGs(): Promise<PG[]> {
  try {
    const snapshot = await getDocs(collection(db, "pgs"));
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as PG[];
  } catch (error) {
    console.error("Error fetching PGs:", error);
    return [];
  }
}

export async function getPGById(id: string): Promise<PG | null> {
  try {
    const snap = await getDoc(doc(db, "pgs", id));
    if (snap.exists()) return { id: snap.id, ...snap.data() } as PG;
    return null;
  } catch (error) {
    console.error("Error fetching PG:", error);
    return null;
  }
}

export async function getPGsByOwner(ownerId: string): Promise<PG[]> {
  try {
    const q = query(collection(db, "pgs"), where("ownerId", "==", ownerId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as PG[];
  } catch (error) {
    console.error("Error fetching PGs by owner:", error);
    return [];
  }
}

export async function createPG(data: Omit<PG, "id" | "createdAt" | "rating">): Promise<PG> {
  const pgRef = doc(collection(db, "pgs"));
  const newPG: PG = sanitize({
    ...data,
    id: pgRef.id,
    rating: 0,
    createdAt: Date.now(),
  });
  await setDoc(pgRef, newPG);
  return newPG;
}

export async function updatePG(id: string, data: Partial<PG>): Promise<void> {
  await updateDoc(doc(db, "pgs", id), sanitize(data));
}

export async function deletePG(id: string): Promise<void> {
  await deleteDoc(doc(db, "pgs", id));
}

export async function getRecentPGs(): Promise<PG[]> {
  try {
    // BUG-L6 FIX: Added orderBy so newest PGs are returned, not arbitrary ones.
    const q = query(collection(db, "pgs"), orderBy("createdAt", "desc"), limit(4));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as PG[];
  } catch (error) {
    console.error("Error fetching recent PGs:", error);
    return [];
  }
}

/** Restores room availability by decrementing occupancy and incrementing free spots. */
export async function restoreRoomAvailability(pgId: string, roomId: string): Promise<void> {
  const pg = await getPGById(pgId);
  if (!pg || !pg.rooms) return;

  const updatedRooms = pg.rooms.map((r) => {
    // Match by roomNumber (the actual identifier) or by any runtime 'id' field
    if (r.roomNumber === roomId || (r as any).id === roomId) {
      const newOccupancy = Math.max(0, r.currentOccupancy - 1);
      return {
        ...r,
        currentOccupancy: newOccupancy,
        available: r.capacity - newOccupancy,
      };
    }
    return r;
  });

  const totalAvailable = updatedRooms.reduce((sum, r) => sum + r.available, 0);

  await updatePG(pgId, {
    rooms: updatedRooms,
    availableRooms: totalAvailable,
  });
}
