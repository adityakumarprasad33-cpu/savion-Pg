"use client";

import { useEffect, useState, useRef } from "react";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from "@/lib/db/notifications";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

// BUG-P7 FIX: Replaced one-shot getDocs with onSnapshot for real-time badge updates.
// Also added proper cleanup on unmount.
export function NotificationDropdown({ userId }: { userId: string | null | undefined }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    unsubRef.current = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Notification));
    }, (err) => {
      console.error("[NotificationDropdown] Listener error:", err);
    });

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [userId]);

  if (!userId) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-slate-100 dark:bg-zinc-800/20 transition-colors focus:outline-none">
          <Bell className="w-5 h-5 text-current opacity-80 hover:opacity-100" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white"></span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[80vh] overflow-y-auto z-50 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-bold">Notifications</span>
          {unreadCount > 0 && (
             <button 
               onClick={async () => {
                 if(userId) await markAllNotificationsAsRead(userId, notifications);
                 setNotifications(notifications.map(n => ({...n, read: true})));
               }}
               className="text-xs text-primary hover:underline font-medium"
             >
               Mark all read
             </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No recent notifications.</div>
        ) : (
          notifications.map(n => (
            <DropdownMenuItem 
              key={n.id} 
              className={`flex flex-col items-start p-3 focus:bg-slate-50 dark:bg-zinc-800/50 cursor-pointer ${!n.read ? 'bg-orange-50/50 dark:bg-orange-950/30' : ''}`}
              onClick={async () => {
                if (!n.read) {
                  await markNotificationAsRead(n.id);
                  setNotifications(notifications.map(nt => nt.id === n.id ? {...nt, read: true} : nt));
                }
              }}
            >
              <div className="flex w-full justify-between gap-2 mb-1">
                <span className={`font-semibold text-sm ${!n.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>{n.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
              <p className={`text-xs block w-full whitespace-normal ${!n.read ? 'text-slate-700 dark:text-slate-300' : 'text-muted-foreground'}`}>{n.message}</p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
