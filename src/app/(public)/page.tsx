"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, ShieldCheck, Zap, Sparkles, Building, ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MainPageDynamicArea } from "@/components/ui/main-page-dynamic-area";
import { getPlatformStats } from "@/lib/db/platformStats";
import { getActiveLocations } from "@/lib/db/pgs";

export default function Homepage() {
  // BUG-01 FIX: Removed useScroll + useTransform — they fired JS on every scroll
  // pixel and were the primary cause of PC lag. Now using CSS-only transitions.

  const [platformStats, setPlatformStats] = useState({ 
    count: 0, 
    rating: 0,
    reviews: 0 
  });
  
  const [topCities, setTopCities] = useState<{city: string, places: string, img: string, tag: string}[]>([]);
  const [activeLocations, setActiveLocations] = useState<{ state: string; city: string; count: number; image?: string }[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const locations = await getActiveLocations();
        setActiveLocations(locations);

        const { getAllReviews } = await import("@/lib/db/reviews");
        const { collection, getDocs } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase/client");
        
        const allReviews = await getAllReviews();
        const reviewsCount = allReviews.length;
        let avgRating = 0;
        if (reviewsCount > 0) {
          const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
          avgRating = Number((totalRating / reviewsCount).toFixed(1));
        }

        // Fetch bookings to count active users
        const bookingsSnap = await getDocs(collection(db, "bookings"));
        const studentsCount = bookingsSnap.docs.length;

        setPlatformStats({
          count: studentsCount,
          rating: avgRating,
          reviews: reviewsCount
        });
      } catch (e) {
        console.error("Failed to fetch platform stats or locations", e);
      }
    }
    fetchStats();
  }, []);

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  return (
    <div className="w-full bg-background overflow-hidden selection:bg-primary/20">
      {/* Static CSS radial-gradient orbs — BUG-01 FIX: no more blur-[120px] GPU drain */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full pointer-events-none" style={{background: 'radial-gradient(circle at center, rgba(249,115,22,0.06) 0%, transparent 70%)'}} />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full pointer-events-none" style={{background: 'radial-gradient(circle at center, rgba(251,146,60,0.05) 0%, transparent 70%)'}} />
      
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            
            {/* Left Content */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-col justify-center space-y-8"
            >
              <motion.div variants={itemVariant} className="flex items-center gap-2 inline-flex w-fit rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                <span className="tracking-wide">Next-Gen Student Housing</span>
              </motion.div>
              
              <motion.div variants={itemVariant} className="space-y-4">
                <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                  Elevate your <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-primary bg-[length:200%_auto] animate-shimmer-bg">
                    student living
                  </span> <br/>
                  experience.
                </h1>
                <p className="max-w-[550px] text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
                  Discover premium, verified accommodations designed for the modern student. Zero broker fees, 100% security.
                </p>
              </motion.div>

              {/* Search Widget */}
              <motion.div variants={itemVariant} className="relative w-full max-w-xl group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <form action="/search" className="relative w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl dark:shadow-zinc-900/60 p-2 flex flex-col md:flex-row gap-2 border border-border/50">
                  <div className="flex relative flex-1 items-center px-2">
                    <MapPin className="absolute left-4 w-5 h-5 text-primary shrink-0" />
                    <Input
                      name="q"
                      placeholder="Search city, university, or PG..."
                      className="border-0 shadow-none focus-visible:ring-0 pl-10 h-14 text-lg w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full md:w-auto h-14 px-8 rounded-xl font-bold text-base gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg dark:shadow-zinc-900/50 hover:shadow-primary/25 transition-all hover:-translate-y-0.5">
                    <Search className="w-5 h-5" />
                    Explore Now
                  </Button>
                </form>
              </motion.div>

              {/* Stats */}
              <motion.div variants={itemVariant} className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex -space-x-4">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
                  ].map((src, i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-background bg-slate-200 overflow-hidden relative">
                      <Image src={src} alt="User" fill className="object-cover" unoptimized/>
                    </div>
                  ))}
                  {platformStats.count > 0 && (
                    <div className="w-12 h-12 rounded-full border-4 border-background bg-primary text-background flex items-center justify-center text-xs font-bold z-10 relative">
                      +{platformStats.count}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  {platformStats.rating > 0 ? (
                    <div className="flex items-center gap-1 text-amber-500" title={`Average Rating: ${platformStats.rating.toFixed(1)}/5`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${star <= Math.round(platformStats.rating) ? "fill-current" : "fill-transparent text-slate-300"}`} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">({platformStats.reviews} reviews)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400">
                      <span className="text-xs font-medium">New Community</span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {platformStats.count > 0 ? `Loved by ${platformStats.count} students` : "Loved by our students"}
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Images / Visuals — BUG-01 FIX: removed scroll-driven y1/opacity */}
            <div className="relative hidden lg:flex items-center justify-center h-full w-full">
              <div className="relative w-full aspect-square max-w-[600px]">
                {/* Main large image */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 1, delay: 0.2, type: "spring" as const }}
                  className="absolute top-10 right-10 w-[70%] h-[75%] rounded-[2rem] overflow-hidden shadow-2xl dark:shadow-zinc-900/60 border border-white/20 z-10"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <Image 
                    src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000&auto=format&fit=crop" 
                    alt="Premium PG" 
                    fill 
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    className="object-cover hover:scale-105 transition-transform duration-700" 
                    unoptimized
                  />
                  <div className="absolute bottom-6 left-6 z-20 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">Featured</span>
                    </div>
                    <h3 className="text-2xl font-bold">The Luxe Residency</h3>
                    <p className="text-white/80 flex items-center gap-1 text-sm"><MapPin className="w-3 h-3"/> Bangalore, India</p>
                  </div>
                </motion.div>

                {/* Floating smaller image 1 */}
                <motion.div 
                  initial={{ opacity: 0, x: -50, y: 50 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 1, delay: 0.5, type: "spring" as const }}
                  className="absolute bottom-0 left-0 w-[45%] h-[45%] rounded-[2rem] overflow-hidden shadow-2xl dark:shadow-zinc-900/60 border-4 border-background z-20"
                >
                  <Image 
                    src="https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=600&auto=format&fit=crop" 
                    alt="Student Life" 
                    fill 
                    className="object-cover" 
                    unoptimized
                  />
                </motion.div>

                {/* Floating Status Card */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.8, type: "spring" as const }}
                  className="absolute top-20 left-4 bg-background/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl dark:shadow-zinc-900/50 border border-border/50 z-30 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                    <p className="font-bold text-foreground">100% Verified</p>
                  </div>
                </motion.div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* BENTO GRID FEATURES */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-900/50 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-6 tracking-tight"
            >
              Why choose Savion?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground"
            >
              We've completely reimagined how students find housing. No more shady brokers, fake photos, or hidden fees. Just seamless living.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 relative rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-border/50 shadow-sm dark:shadow-slate-900/50 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0" />
              <div className="relative z-10 p-8 flex flex-col h-full justify-between">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Verified Properties Only</h3>
                  <p className="text-muted-foreground max-w-md">Every single property is physically verified by our team. What you see on the platform is exactly what you get in reality.</p>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-full hidden md:block opacity-90 group-hover:opacity-100 transition-opacity duration-500">
                <Image src="/card-verified.png" alt="Verified PG Room" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="relative rounded-3xl overflow-hidden bg-primary text-primary-foreground shadow-xl dark:shadow-zinc-900/50 group"
            >
              {/* Custom booking image as background */}
              <div className="absolute inset-0 z-0">
                <Image src="/card-booking.png" alt="Instant Booking" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-100 group-hover:scale-105 transition-all duration-500" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-[1]" />
              <div className="relative z-10 p-8 flex flex-col h-full justify-between">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900/20 backdrop-blur-sm flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-white">Instant Booking</h3>
                  <p className="text-white/80">Skip the wait. Book your room instantly with our secure digital payment gateway.</p>
                </div>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="relative rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-border/50 shadow-sm dark:shadow-slate-900/50 group"
            >
              {/* Amenities image background */}
              <div className="absolute inset-0 z-0">
                <Image src="/card-amenities.png" alt="Premium Amenities" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute inset-0 bg-white dark:bg-zinc-900/20" />
              </div>
              <div className="relative z-10 p-8 flex flex-col h-full justify-between">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-500">
                  <Building className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Premium Amenities</h3>
                  <p className="text-muted-foreground text-sm">High-speed WiFi, laundry, meals, and housekeeping included.</p>
                </div>
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 relative rounded-3xl overflow-hidden bg-zinc-900 text-white shadow-xl dark:shadow-zinc-900/50 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/60 via-zinc-900/30 to-transparent z-10" />
              <Image src="/card-community.png" alt="Vibrant Community" fill sizes="(max-width: 768px) 100vw, 66vw" className="object-cover z-0 opacity-100 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-20 p-8 flex flex-col h-full justify-center w-full md:w-2/3">
                <h3 className="text-3xl font-bold mb-4">Vibrant Community</h3>
                <p className="text-zinc-300 mb-6 text-lg">Connect with like-minded students, attend exclusive events, and make memories that last a lifetime.</p>
                <Link href="/community">
                  <Button variant="secondary" className="w-fit rounded-full group/btn">
                    Join the community <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DYNAMIC AREA / PROPERTIES */}
      <div className="py-12 relative z-20 bg-background">
        <MainPageDynamicArea />
      </div>

      {/* HORIZONTAL SCROLLING CITIES */}
      <section className="py-24 bg-background overflow-hidden relative border-t border-border/50">
        <div className="container mx-auto px-4 md:px-6 mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Explore Top Cities</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">Find the best student accommodations across India's major educational hubs.</p>
          </div>
          <Button variant="outline" className="hidden md:flex rounded-full">View All Cities</Button>
        </div>

        <div className="flex gap-6 px-4 md:px-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {(activeLocations.length > 0 ? activeLocations : [
            { city: "Bangalore", state: "Karnataka", count: 320, image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=800&auto=format&fit=crop" },
            { city: "Pune", state: "Maharashtra", count: 210, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&q=80" },
            { city: "Delhi", state: "Delhi", count: 450, image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=800&auto=format&fit=crop" },
            { city: "Mumbai", state: "Maharashtra", count: 180, image: "https://images.unsplash.com/photo-1566438480900-0609be27a4be?q=80&w=800&auto=format&fit=crop" },
            { city: "Hyderabad", state: "Telangana", count: 250, image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=800&auto=format&fit=crop" },
          ]).map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              key={`${item.state}-${item.city}`} 
            >
              <Link href={`/search?state=${item.state.toLowerCase()}&city=${item.city.toLowerCase()}`} className="group relative w-[300px] h-[400px] rounded-3xl overflow-hidden cursor-pointer snap-center block flex-shrink-0">
                <Image src={item.image || "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=800&auto=format&fit=crop"} unoptimized alt={item.city} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                <div className="absolute top-6 left-6">
                  <span className="bg-black/40 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/10">
                    {item.state}
                  </span>
                </div>
                <div className="absolute bottom-6 left-6 text-white text-left transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-3xl font-bold mb-1">{item.city}</h3>
                  <p className="text-sm font-medium text-white/80 flex items-center gap-2">
                    <Building className="w-4 h-4"/> {item.count} properties
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary z-0" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white dark:bg-zinc-900/10 rounded-full blur-3xl z-0" />
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Ready to move in?</h2>
            <p className="text-xl text-white/80 mb-10 font-light">Join thousands of students who have already found their perfect home with Savion.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/search">
                <Button size="lg" className="h-14 px-12 text-lg rounded-full bg-white dark:bg-zinc-900 text-primary hover:bg-zinc-100 font-bold shadow-xl dark:shadow-zinc-900/50 hover:scale-105 transition-transform">
                  Search Properties
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
