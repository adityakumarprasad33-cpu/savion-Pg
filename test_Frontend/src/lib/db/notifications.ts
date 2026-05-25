import { collection, doc, getDocs, query, setDoc, where, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase/client";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "booking" | "complaint" | "system";
  read: boolean;
  createdAt: number;
}

export async function createNotification(data: Omit<Notification, "id" | "read" | "createdAt">): Promise<Notification> {
  const ref = doc(collection(db, "notifications"));
  const newNotification: Notification = {
    ...data,
    id: ref.id,
    read: false,
    createdAt: Date.now(),
  };

  const sanitized = Object.fromEntries(
    Object.entries(newNotification).filter(([, v]) => v !== undefined)
  ) as Notification;

  await setDoc(ref, sanitized);
  return sanitized;
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Notification).sort((a,b) => b.createdAt - a.createdAt);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const ref = doc(db, "notifications", id);
  await updateDoc(ref, { read: true });
}

export async function markAllNotificationsAsRead(userId: string, notifications: Notification[]): Promise<void> {
  const batch = writeBatch(db);
  notifications.forEach(n => {
    if (!n.read) {
      const ref = doc(db, "notifications", n.id);
      batch.update(ref, { read: true });
    }
  });
  await batch.commit();
}
