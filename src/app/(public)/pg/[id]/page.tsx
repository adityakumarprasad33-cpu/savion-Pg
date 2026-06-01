"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Share2, Heart, Check, ChevronRight, ShieldCheck, Building2, Hash, Layers } from "lucide-react";
import { getPGById, PG, PGRoom } from "@/lib/db/pgs";
import { BookingSidebar } from "@/components/ui/BookingSidebar";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { getUserBookings } from "@/lib/db/bookings";
import { SpeedLoader } from "@/components/ui/SpeedLoader";

export default function PGDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pg, setPg] = useState<PG | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<PGRoom | null>(null);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [bookingBlockReason, setBookingBlockReason] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      getPGById(params.id).then((data) => {
        setPg(data);
        setLoading(false);
        // Check localStorage for liked state
        const likedPgs = JSON.parse(localStorage.getItem("savion_liked_pgs") || "[]");
        setLiked(likedPgs.includes(params.id));
      });
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const bookings = await getUserBookings(user.uid);
        // Statuses that mean the user is ACTIVELY occupying a space
        const ACTIVE_STATUSES = ["confirmed", "notice_given", "notice_approved"];
        const activeBooking = bookings.find((b) => ACTIVE_STATUSES.includes(b.status));
        if (activeBooking) {
          setHasActiveBooking(true);
          if (activeBooking.status === "notice_given") {
            setBookingBlockReason("Move-out notice pending (7-day window)");
          } else if (activeBooking.status === "notice_approved") {
            setBookingBlockReason("Notice approved — awaiting checkout");
          } else {
            setBookingBlockReason("You have an active booking");
          }
        } else {
          setHasActiveBooking(false);
          setBookingBlockReason(null);
        }
      } else {
        setHasActiveBooking(false);
        setBookingBlockReason(null);
      }
    });

    return () => unsub();
  }, [params?.id]);

  const handleLike = () => {
    if (!pg) return;
    const likedPgs: string[] = JSON.parse(localStorage.getItem("savion_liked_pgs") || "[]");
    if (liked) {
      const updated = likedPgs.filter((id) => id !== pg.id);
      localStorage.setItem("savion_liked_pgs", JSON.stringify(updated));
    } else {
      localStorage.setItem("savion_liked_pgs", JSON.stringify([...likedPgs, pg.id]));
    }
    setLiked(!liked);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Check out ${pg?.name} on Savion! ${pg?.price}/mo at ${pg?.location}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: pg?.name, text, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleSelectRoom = (room: PGRoom) => {
    setSelectedRoom(room);
    router.push(`/pg/${pg!.id}/book?roomId=${room.id}&room=${encodeURIComponent(room.type)}`);
  };

  const facilityIcons: Record<string, string> = {
    WiFi: "📶", AC: "❄️", "Food Included": "🍽️", Laundry: "🧺", Parking: "🚗",
    CCTV: "📹", "Security Guard": "💂", "Power Backup": "⚡", Gym: "💪",
    "Study Room": "📚", "RO Water": "💧", Housekeeping: "🧹", "TV Lounge": "📺", Lift: "🛗",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <SpeedLoader text="Loading Property" subtext="Fetching the best rooms for you..." />
      </div>
    );
  }

  if (!pg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Property Not Found</p>
          <p className="text-muted-foreground">This listing may have been removed.</p>
        </div>
      </div>
    );
  }

  // Gallery: main image + extra images from DB
  const galleryImages = [pg.img, ...(pg.images || [])].filter(Boolean);

  return (
    <div className="w-full bg-slate-50 dark:bg-zinc-800/50 min-h-screen pb-20 animate-fade-in">
      {/* Breadcrumb + Actions Header */}
      <header className="bg-white dark:bg-zinc-900 border-b sticky top-16 z-40 animate-fade-in-down">
        <div className="container mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-primary font-medium mb-1">
              <Link href="/search" className="hover:underline">Listings</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-muted-foreground">{pg.city || pg.location}</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-muted-foreground">{pg.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{pg.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{pg.location}</span>
              </div>
              <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                {pg.rating || "New"}
              </div>
              <Badge variant="secondary" className="bg-orange-50 text-orange-700">{pg.type}</Badge>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline" size="icon"
              onClick={handleShare}
              title={shared ? "Copied!" : "Share"}
              className={shared ? "border-green-500 text-green-600" : ""}
            >
              {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline" size="icon"
              onClick={handleLike}
              className={liked ? "border-red-400 text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100" : ""}
              title={liked ? "Remove from saved" : "Save property"}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            {hasActiveBooking ? (
              <Button disabled className="md:ml-2 font-semibold opacity-60 cursor-not-allowed">
                {bookingBlockReason || "Booked"}
              </Button>
            ) : (
              <Link href={`/pg/${pg.id}/book`}>
                <Button className="md:ml-2 font-semibold">Book Now</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 md:gap-3 h-[280px] md:h-[480px] rounded-3xl overflow-hidden mb-12 shadow-sm dark:shadow-slate-900/50 bg-slate-200 animate-scale-in">
          {/* Main image */}
          <div className="md:col-span-2 md:row-span-2 relative bg-slate-200">
            {galleryImages[0] ? (
              <Image src={galleryImages[0]} alt={pg.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <span className="text-6xl">🏠</span>
              </div>
            )}
          </div>
          {/* Extra gallery slots */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative hidden md:block bg-slate-100 dark:bg-zinc-800">
              {galleryImages[i] ? (
                <Image src={galleryImages[i]} alt={`${pg.name} photo ${i}`} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <span className="text-3xl opacity-30">🏠</span>
                </div>
              )}
              {i === 4 && galleryImages.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold">+{galleryImages.length - 5} more</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
          {/* Main Content */}
          <div className="space-y-10 animate-fade-in-up">
            {/* About */}
            <section className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border shadow-sm dark:shadow-slate-900/50 hover-lift">
              <h2 className="text-2xl font-bold mb-4">About this Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                {pg.description || `${pg.name} is a verified property located at ${pg.location}. Contact the owner for more details.`}
              </p>
              {/* Facilities from DB */}
              {pg.facilities?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {pg.facilities.map((f) => (
                    <Badge key={f} variant="secondary" className="px-3 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 gap-1">
                      {facilityIcons[f] || "✅"} {f}
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            {/* Rooms from DB */}
            <section id="rooms">
              <h2 className="text-2xl font-bold mb-6">Available Room Options</h2>
              {(!pg.rooms || pg.rooms.length === 0) ? (
                <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border text-center text-muted-foreground flex flex-col items-center shadow-sm dark:shadow-slate-900/50">
                  <span className="text-4xl mb-4 opacity-75">🛏️</span>
                  <h3 className="text-xl font-bold text-foreground mb-2">No Rooms Listed Yet</h3>
                  <p className="max-w-md text-sm">The owner hasn't added specific room details for this property. Please contact them directly.</p>
                </div>
              ) : (
                <div className="space-y-4 stagger">
                  {pg.rooms.map((room) => (
                    <div key={room.id} className="bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm dark:shadow-slate-900/50 overflow-hidden animate-fade-in-up hover-lift">
                      {/* Room header bar */}
                      <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-3">
                          {/* Room number badge */}
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm">
                            {room.roomNumber || "—"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold">Room {room.roomNumber}</h3>
                              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {room.type}
                              </span>
                              {room.floor && (
                                <span className="text-xs font-medium bg-slate-200 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                  Floor {room.floor}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Capacity: {room.capacity} person{room.capacity > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          room.available > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {room.available > 0 ? `${room.available} spot${room.available > 1 ? "s" : ""} free` : "Full"}
                        </span>
                      </div>

                      {/* Room body */}
                      <div className="flex flex-col md:flex-row justify-between gap-6 p-6">
                        {room.image && (
                          <div className="relative w-full md:w-48 h-32 md:h-auto rounded-xl overflow-hidden shrink-0 border bg-slate-100 dark:bg-zinc-800">
                            <Image src={room.image} alt={`Room ${room.roomNumber}`} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-center">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Amenities</p>
                          {room.amenities?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {room.amenities.map((a) => (
                                <span key={a} className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full">
                                  <Check className="w-3 h-3 text-green-500" /> {a}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No specific amenities listed.</p>
                          )}
                        </div>
                        <div className="flex flex-col border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 shrink-0 md:items-end justify-center gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Per Month</p>
                            <p className="text-2xl font-black text-primary">₹{room.monthlyRent.toLocaleString("en-IN")}</p>
                          </div>
                          <Button
                            onClick={() => handleSelectRoom(room)}
                            disabled={room.available === 0 || hasActiveBooking}
                            className={`px-8 rounded-xl font-semibold text-white ${
                              room.available === 0 || hasActiveBooking
                                ? "opacity-50 cursor-not-allowed"
                                : "bg-primary hover:bg-primary/90 shadow-lg dark:shadow-zinc-900/50 shadow-primary/25"
                            }`}
                          >
                            {hasActiveBooking 
                              ? (bookingBlockReason || "Already Booked") 
                              : (room.available > 0 ? "Select Room →" : "Join Waitlist")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Location Map */}
            {pg.lat && pg.lng && (
              <section className="bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm dark:shadow-slate-900/50 overflow-hidden hover-lift">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Location</h2>
                  <p className="text-muted-foreground text-sm mt-1">{pg.location}</p>
                </div>
                <iframe
                  title="Property Location"
                  width="100%"
                  height="280"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${pg.lng - 0.005},${pg.lat - 0.005},${pg.lng + 0.005},${pg.lat + 0.005}&layer=mapnik&marker=${pg.lat},${pg.lng}`}
                  style={{ border: 0 }}
                />
                {pg.nearbyPlaces?.some(Boolean) && (
                  <div className="p-6 border-t">
                    <p className="text-sm font-semibold mb-3 text-slate-600 dark:text-slate-400">Nearby Places</p>
                    <div className="flex flex-wrap gap-2">
                      {pg.nearbyPlaces.filter(Boolean).map((place) => (
                        <span key={place} className="text-xs bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300">📍 {place}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* House Rules */}
            {pg.rules?.some(Boolean) && (
              <section className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border shadow-sm dark:shadow-slate-900/50 hover-lift">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> House Rules</h2>
                <ul className="space-y-2">
                  {pg.rules.filter(Boolean).map((rule) => (
                    <li key={rule} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <BookingSidebar pgId={pg.id} pgName={pg.name} price={pg.price} hasActiveBooking={hasActiveBooking} />
          </div>

          {/* Mobile Booking Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t p-4 flex items-center justify-between lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Pricing starts from</p>
              <p className="text-xl font-black text-primary">
                {pg.price || "Contact"}
                <span className="text-sm text-muted-foreground font-medium">/mo</span>
              </p>
            </div>
            {hasActiveBooking ? (
              <Button size="lg" disabled className="w-1/2 rounded-xl font-bold bg-slate-300">
                Active Booking
              </Button>
            ) : (
              <Link href={`/pg/${pg.id}/book`} className="w-1/2">
                <Button size="lg" className="w-full rounded-xl font-bold text-white hover-glow">
                  Book Now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
