import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import Link from "next/link";
import { MainPageDynamicArea } from "@/components/ui/main-page-dynamic-area";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";

export default function Homepage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full py-16 md:py-32 overflow-hidden bg-orange-50/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-8 z-10">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium tracking-wide">
                  Simplifying Student Accommodation
                </div>
                <div className="text-4xl sm:text-5xl xl:text-6xl text-foreground">
                  <AnimatedHeading text="Find your perfect" delay={0.1} className="mr-3" />
                  <span className="text-primary font-extrabold tracking-tight md:tracking-tighter inline-block relative -top-1">student home</span>
                  <br className="hidden md:inline" />
                  <AnimatedHeading text="near your university" delay={0.8} />
                </div>
                <p className="max-w-[600px] text-muted-foreground md:text-xl leading-relaxed">
                  Book verified PGs, apartments, and student housing across major cities with 100% security and zero hassle.
                </p>
              </div>

              {/* Search Widget */}
              <form action="/search" className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-primary/5 p-2 flex flex-col md:flex-row gap-2">
                <div className="flex relative flex-1 items-center">
                  <MapPin className="absolute left-3 w-5 h-5 text-muted-foreground shrink-0" />
                  <Input
                    name="q"
                    placeholder="Search by city or university..."
                    className="border-0 shadow-none focus-visible:ring-0 pl-10 h-12 text-base w-full"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full md:w-auto h-12 px-8 rounded-xl font-semibold gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </form>

              <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-slate-200"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-slate-300"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-slate-400"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-primary text-background flex items-center justify-center text-xs font-bold">+2k</div>
                </div>
                Happy students booked through Savion
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-[500px] lg:max-w-none items-center justify-center lg:justify-end">
              <div className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-orange-400/20 mix-blend-multiply z-10 rounded-3xl ring-1 ring-inset ring-black/10"></div>
                <Image
                  alt="Students relaxing in a beautifully designed PG room"
                  className="object-cover"
                  fill
                  priority
                  unoptimized
                  src="https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1000&q=80"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic User Area / Latest PGs */}
      <MainPageDynamicArea />

      {/* Featured Cities */}
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <AnimatedHeading text="Popular Destinations" className="text-3xl sm:text-4xl" />
            <p className="text-muted-foreground md:text-lg max-w-[700px]">
              Explore top-rated student accommodations in the most vibrant educational hubs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12">
            {[
              { city: "Bangalore", places: "320+", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=80" },
              { city: "Pune", places: "210+", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&q=80" },
              { city: "Delhi", places: "450+", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80" },
              { city: "Mumbai", places: "180+", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&q=80" },
            ].map((item) => (
              <Link href={`/search?location=${item.city.toLowerCase()}`} key={item.city} className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer">
                <Image src={item.img} unoptimized alt={item.city} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white text-left">
                  <h3 className="text-xl font-bold">{item.city}</h3>
                  <p className="text-sm text-white/80">{item.places} properties</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
