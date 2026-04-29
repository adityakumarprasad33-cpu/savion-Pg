"use client";

import { useEffect, useState } from "react";
import { getRecentPGs, PG } from "@/lib/db/pgs";
import { getUserProfile, UserProfile } from "@/lib/db/users";
import { auth } from "@/lib/firebase/client";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";

export function MainPageDynamicArea() {
  const [userId, setUserId] = useState<string | null>(null);
  const [pgs, setPgs] = useState<PG[]>([]);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        setUserId(user ? user.uid : null);
        if (!user) {
          getRecentPGs().then(setPgs);
        } else {
          getUserProfile(user.uid).then(p => {
             if (p) setProfile(p);
          });
        }
        setLoading(false);
      });
      return () => unsub();
    });
  }, []);

  if (loading) return null;

  if (userId) {
    const dashLink = profile?.role === "owner" ? "/dashboard/owner" : profile?.role === "caretaker" ? "/dashboard/caretaker" : "/dashboard/tenant";
    return (
      <div className="container mx-auto px-4 md:px-6 max-w-5xl py-8 mb-8 animate-fade-in-up flex items-center justify-center">
         <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 max-w-lg text-center shadow-sm">
            <AnimatedHeading text={`Welcome Back, ${profile?.name || "User"}!`} className="text-2xl text-primary mb-2" />
            <p className="text-muted-foreground mb-6">Looks like you already have an active profile. Head back into your control center to monitor your activities.</p>
            <Link href={dashLink} className="inline-flex items-center justify-center bg-primary text-primary-foreground h-12 px-8 rounded-xl font-bold hover:opacity-90 hover:scale-105 transition-all">
               Access Your Dashboard →
            </Link>
         </div>
      </div>
    );
  }

  // Not logged in: Show Recent Rooms Nearby
  if (pgs.length === 0) return null;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 border-t mt-4 bg-slate-50/50">
      <div className="flex flex-col items-center justify-center space-y-2 text-center mb-10">
        <AnimatedHeading text="Latest Rooms Added Nearby" className="text-2xl sm:text-3xl" />
        <p className="text-muted-foreground mt-2">Discover fresh verified listings right in your area.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {pgs.map((pg) => (
          <Link href={`/pg/${pg.id}`} key={pg.id} className="group rounded-2xl border bg-white shadow-sm hover:shadow-xl transition-all overflow-hidden block">
            <div className="relative h-48 w-full bg-slate-100">
               {pg.img ? (
                 <Image src={pg.img} alt={pg.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                   <span className="text-5xl opacity-40">🏠</span>
                 </div>
               )}
               <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm font-bold text-slate-900 shadow-sm">
                 {pg.price}/mo
               </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 truncate">{pg.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5" /> {pg.location}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
