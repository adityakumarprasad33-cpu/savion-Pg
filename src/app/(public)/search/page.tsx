"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Filter, Star, Search, SlidersHorizontal, X, BedDouble, Building2, DoorOpen } from "lucide-react";
import Link from "next/link";
import { getPGs, PG } from "@/lib/db/pgs";
import { SpeedLoader } from "@/components/ui/SpeedLoader";

// ─── FilterCheckbox sub-component ─────────────────────────────────────────────
function FilterCheckbox({
  label,
  value,
  list,
  setList,
}: {
  label: string;
  value: string;
  list: string[];
  setList: (v: string[]) => void;
}) {
  const active = list.includes(value);
  return (
    <label
      className={`flex items-center gap-2 text-sm cursor-pointer transition-all rounded-lg px-2 py-1.5 -mx-2 select-none ${
        active ? "bg-primary/10 text-primary font-semibold" : "hover:text-primary hover:bg-slate-50"
      }`}
    >
      <input
        type="checkbox"
        className="rounded accent-primary w-4 h-4"
        checked={active}
        onChange={() =>
          setList(active ? list.filter((x) => x !== value) : [...list, value])
        }
      />
      {label}
    </label>
  );
}

// ─── Main search content ───────────────────────────────────────────────────────
function SearchContent() {
  const searchParams = useSearchParams();
  const initQuery = searchParams.get("q") || searchParams.get("location") || "";

  const [listings, setListings] = useState<PG[]>([]);
  const [filtered, setFiltered] = useState<PG[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initQuery);

  // Active filter states
  const [priceFilters, setPriceFilters] = useState<string[]>([]);
  const [genderFilters, setGenderFilters] = useState<string[]>([]);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);

  // Load all PGs once
  useEffect(() => {
    getPGs().then((data) => {
      setListings(data);
      setLoading(false);
    });
  }, []);

  // Combined filter logic — runs whenever any filter changes
  useEffect(() => {
    let result = listings;

    // Text search — name, location, city
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (pg) =>
          pg.name.toLowerCase().includes(q) ||
          pg.location.toLowerCase().includes(q) ||
          (pg.city || "").toLowerCase().includes(q)
      );
    }

    // Price filter — parse "₹8,500" or "8500" or "8500/mo"
    if (priceFilters.length > 0) {
      result = result.filter((pg) => {
        const raw = parseInt((pg.price || "0").replace(/[^0-9]/g, "")) || 0;
        return priceFilters.some((f) => {
          if (f === "under10k") return raw < 10000;
          if (f === "10k-15k") return raw >= 10000 && raw <= 15000;
          if (f === "above15k") return raw > 15000;
          return true;
        });
      });
    }

    // Gender filter — checks pg.type or pg.gender field
    if (genderFilters.length > 0) {
      result = result.filter((pg) => {
        const combined =
          `${pg.type || ""} ${(pg as any).gender || ""}`.toLowerCase();
        return genderFilters.some((f) => {
          if (f === "boys")
            return (
              combined.includes("boys") ||
              combined.includes("male") ||
              combined.includes("gents")
            );
          if (f === "girls")
            return (
              combined.includes("girls") ||
              combined.includes("female") ||
              combined.includes("ladies")
            );
          if (f === "coliving")
            return (
              combined.includes("co") ||
              combined.includes("mix") ||
              combined.includes("unisex")
            );
          return true;
        });
      });
    }

    // Amenity filter — checks pg.facilities array
    if (amenityFilters.length > 0) {
      result = result.filter((pg) => {
        const facs = (pg.facilities || []).map((f: string) => f.toLowerCase());
        return amenityFilters.every((af) => {
          if (af === "wifi")
            return facs.some(
              (f) =>
                f.includes("wi-fi") || f.includes("wifi") || f.includes("internet")
            );
          if (af === "food")
            return facs.some(
              (f) =>
                f.includes("food") || f.includes("meal") || f.includes("tiffin")
            );
          if (af === "ac")
            return facs.some((f) => f.includes("ac") || f.includes("air"));
          if (af === "washing")
            return facs.some(
              (f) => f.includes("wash") || f.includes("laundry")
            );
          return true;
        });
      });
    }

    setFiltered(result);
  }, [searchQuery, listings, priceFilters, genderFilters, amenityFilters]);

  const activeFilterCount =
    priceFilters.length + genderFilters.length + amenityFilters.length;

  const clearAllFilters = () => {
    setPriceFilters([]);
    setGenderFilters([]);
    setAmenityFilters([]);
    setSearchQuery("");
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 animate-fade-in">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find Your PG</h1>
          <p className="text-muted-foreground mt-1">
            {loading
              ? "Loading properties..."
              : `Showing ${filtered.length} of ${listings.length} verified properties${
                  activeFilterCount > 0
                    ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active`
                    : ""
                }`}
          </p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative flex-1 md:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by city or property name..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 border-red-300 hover:bg-red-50 shrink-0 gap-1"
            >
              <X className="w-3 h-3" /> Clear ({activeFilterCount})
            </Button>
          )}
          <Button variant="outline" size="icon" title="Filters">
            <div className="relative">
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 border-t pt-8">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block animate-slide-in-left">
          <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-5 sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-500 hover:underline font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Price */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm text-slate-700 mb-3">
                💰 Price Range / Month
              </h4>
              <div className="space-y-1">
                <FilterCheckbox
                  label="Under ₹10,000"
                  value="under10k"
                  list={priceFilters}
                  setList={setPriceFilters}
                />
                <FilterCheckbox
                  label="₹10,000 – ₹15,000"
                  value="10k-15k"
                  list={priceFilters}
                  setList={setPriceFilters}
                />
                <FilterCheckbox
                  label="Above ₹15,000"
                  value="above15k"
                  list={priceFilters}
                  setList={setPriceFilters}
                />
              </div>
            </div>

            {/* Gender */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm text-slate-700 mb-3">
                👤 Gender Setting
              </h4>
              <div className="space-y-1">
                <FilterCheckbox
                  label="Boys Only"
                  value="boys"
                  list={genderFilters}
                  setList={setGenderFilters}
                />
                <FilterCheckbox
                  label="Girls Only"
                  value="girls"
                  list={genderFilters}
                  setList={setGenderFilters}
                />
                <FilterCheckbox
                  label="Co-living / Unisex"
                  value="coliving"
                  list={genderFilters}
                  setList={setGenderFilters}
                />
              </div>
            </div>

            {/* Amenities */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm text-slate-700 mb-3">
                🏠 Amenities
              </h4>
              <div className="space-y-1">
                <FilterCheckbox
                  label="Wi-Fi"
                  value="wifi"
                  list={amenityFilters}
                  setList={setAmenityFilters}
                />
                <FilterCheckbox
                  label="Food Included"
                  value="food"
                  list={amenityFilters}
                  setList={setAmenityFilters}
                />
                <FilterCheckbox
                  label="AC Room"
                  value="ac"
                  list={amenityFilters}
                  setList={setAmenityFilters}
                />
                <FilterCheckbox
                  label="Washing Machine"
                  value="washing"
                  list={amenityFilters}
                  setList={setAmenityFilters}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Listings Grid */}
        <div className="flex flex-col gap-6 w-full">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border overflow-hidden animate-pulse">
                  <div className="skeleton h-48 w-full" />
                  <div className="p-5 space-y-3">
                    <div className="skeleton h-5 w-3/4 rounded" />
                    <div className="skeleton h-4 w-1/2 rounded" />
                    <div className="skeleton h-4 w-1/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-2xl bg-card w-full min-h-[400px] animate-scale-in">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🏙️</span>
              </div>
              <h3 className="text-xl font-bold mb-2">
                {activeFilterCount > 0 || searchQuery ? "No matches found" : "No Properties Yet"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {activeFilterCount > 0 || searchQuery
                  ? "Try adjusting your filters or search terms."
                  : "When owners list their properties, they will appear here instantly!"}
              </p>
              {(activeFilterCount > 0 || searchQuery) && (
                <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full stagger">
              {filtered.map((pkg) => {
                const availableRooms = pkg.rooms?.filter((r) => r.available > 0).length ?? pkg.availableRooms ?? 0;
                const totalRooms = pkg.rooms?.length ?? pkg.totalRooms ?? 0;
                const roomTypes = [...new Set(pkg.rooms?.map((r) => r.type) ?? [])];
                const isFull = availableRooms === 0 && totalRooms > 0;

                return (
                  <Link
                    href={`/pg/${pkg.id}`}
                    key={pkg.id}
                    className="group flex flex-col bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in-up card-hover"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                      {pkg.img ? (
                        <Image
                          src={pkg.img}
                          alt={pkg.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                          <Building2 className="w-8 h-8 opacity-30" />
                          <span className="text-sm font-medium opacity-50">No Photo Yet</span>
                        </div>
                      )}
                      {/* Top badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="bg-white/90 backdrop-blur text-foreground font-semibold text-xs">
                          {pkg.type || "Co-living"}
                        </Badge>
                        {isFull && (
                          <Badge className="bg-red-500/90 text-white text-xs font-semibold">Full</Badge>
                        )}
                        {!isFull && availableRooms > 0 && (
                          <Badge className="bg-green-500/90 text-white text-xs font-semibold">
                            {availableRooms} room{availableRooms > 1 ? "s" : ""} free
                          </Badge>
                        )}
                      </div>
                      {/* Rating */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur text-amber-600 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        {pkg.rating || "New"}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5 flex flex-col flex-1">
                      {/* Building name + city */}
                      <div className="flex justify-between items-start gap-3 mb-1">
                        <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                          {pkg.name}
                        </h3>
                        {pkg.city && (
                          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                            {pkg.city}
                          </span>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-start text-muted-foreground text-xs mb-3 gap-1">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{pkg.location}</span>
                      </div>

                      {/* Room types available */}
                      {roomTypes.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <BedDouble className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {roomTypes.map((t) => (
                              <span key={t} className="text-xs bg-primary/8 text-primary font-semibold px-2 py-0.5 rounded-full">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Facilities */}
                      {pkg.facilities && pkg.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {pkg.facilities.slice(0, 3).map((f: string) => (
                            <span key={f} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                              {f}
                            </span>
                          ))}
                          {pkg.facilities.length > 3 && (
                            <span className="text-xs text-muted-foreground font-medium">+{pkg.facilities.length - 3} more</span>
                          )}
                        </div>
                      )}

                      {/* Footer: price + rooms count + CTA */}
                      <div className="mt-auto pt-4 border-t flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground font-medium">Starting from</span>
                          <span className="text-xl font-black text-foreground">
                            {pkg.price || "—"}
                            <span className="text-sm font-normal text-muted-foreground">/mo</span>
                          </span>
                          {totalRooms > 0 && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                              <DoorOpen className="w-3 h-3 inline mr-0.5" />
                              {totalRooms} room{totalRooms > 1 ? "s" : ""} total
                            </span>
                          )}
                        </div>
                        <Button variant="default" size="sm" className="font-semibold">
                          View Rooms
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <SpeedLoader text="Scanning Properties" subtext="Finding the best match..." />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
