"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, createUserWithEmailAndPassword, getAuth as getFirebaseAuth } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { auth } from "@/lib/firebase/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createPG, PGRoom, PGRoomInput, getRoomCapacity } from "@/lib/db/pgs";
import { createCaretaker, getSavedCaretakersByOwner, checkCaretakerUidExists, Caretaker } from "@/lib/db/caretakers";
import { createUserProfile } from "@/lib/db/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, MapPin, Loader2, CheckCircle2, UserPlus, Users, User, UsersRound, Handshake, BedSingle, BedDouble, Building2, Home, ImagePlus, Navigation } from "lucide-react";

const STEP_LABELS = ["Basic Info", "Location", "Rooms", "Facilities", "Caretaker"];
const ALL_FACILITIES = [
  "WiFi", "AC", "Food Included", "Laundry", "Parking", "CCTV", "Security Guard",
  "Power Backup", "Gym", "Study Room", "RO Water", "Housekeeping", "TV Lounge", "Lift",
];
const ROOM_TYPES = ["Single", "Double", "Triple", "Studio", "Dormitory"] as const;

type Step = 1 | 2 | 3 | 4 | 5;

export default function AddPGPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // ── Step 1: Basic Info ──────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"Boys" | "Girls" | "Co-living">("Boys");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

  // ── Step 2: Location ────────────────────────────────────────────────────────
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<string[]>([""]);
  const [rules, setRules] = useState<string[]>([""]);

  // ── Step 3: Rooms ───────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState<PGRoomInput[]>([
    { id: "room_1", roomNumber: "101", type: "Single", monthlyRent: 0, capacity: 1, currentOccupancy: 0, available: 1, amenities: [] },
  ]);

  // ── Step 4: Facilities ──────────────────────────────────────────────────────
  const [facilities, setFacilities] = useState<string[]>([]);

  // ── Step 5: Caretaker ───────────────────────────────────────────────────────
  const [caretakerMode, setCaretakerMode] = useState<"new" | "saved" | "none">("none");
  const [savedCaretakers, setSavedCaretakers] = useState<Caretaker[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState("");
  const [ctName, setCtName] = useState("");
  const [ctUid, setCtUid] = useState("");
  const [ctPassword, setCtPassword] = useState("");
  const [ctSaveToPool, setCtSaveToPool] = useState(true);
  const [ctUidChecking, setCtUidChecking] = useState(false);
  const [ctUidTaken, setCtUidTaken] = useState(false);

  // Detect auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setOwnerId(user.uid);
      const saved = await getSavedCaretakersByOwner(user.uid);
      setSavedCaretakers(saved);
    });
    return () => unsub();
  }, [router]);

  // UID uniqueness debounce
  useEffect(() => {
    if (!ctUid.trim() || caretakerMode !== "new") { setCtUidTaken(false); return; }
    setCtUidChecking(true);
    const timer = setTimeout(async () => {
      const taken = await checkCaretakerUidExists(ctUid.trim());
      setCtUidTaken(taken);
      setCtUidChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [ctUid, caretakerMode]);

  // Image preview
  const handleMainImage = (file: File) => {
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const handleRoomImage = (idx: number, file: File) => {
    setRooms((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        return { ...r, imageFile: file, imagePreview: URL.createObjectURL(file) };
      })
    );
  };

  // Detect location via browser
  const detectLocation = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported in this browser."); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        // Reverse geocode using Nominatim (free, no key needed)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const addr = data.address;
          setLocation(data.display_name || "");
          setCity(addr.city || addr.town || addr.suburb || addr.state_district || "");
        } catch {
          // geocoding failed, just use coordinates
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setGeoLoading(false);
      },
      () => { alert("Could not get your location. Please enter it manually."); setGeoLoading(false); }
    );
  };

  const addRoom = () => {
    const nextNum = rooms.length + 1;
    setRooms((prev) => [
      ...prev,
      { id: `room_${Date.now()}`, roomNumber: `${100 + nextNum}`, type: "Single", monthlyRent: 0, capacity: 1, currentOccupancy: 0, available: 1, amenities: [] },
    ]);
  };

  const updateRoom = (idx: number, field: keyof PGRoom, value: PGRoom[keyof PGRoom]) => {
    setRooms((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, [field]: value };
        // When type changes, auto-update capacity and recompute available
        if (field === "type") {
          updated.capacity = getRoomCapacity(value as PGRoom["type"]);
          updated.available = Math.max(0, updated.capacity - updated.currentOccupancy);
        }
        // When occupancy changes, recompute available
        if (field === "currentOccupancy") {
          updated.available = Math.max(0, updated.capacity - (value as number));
        }
        return updated;
      })
    );
  };

  const removeRoom = (idx: number) => {
    setRooms((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleRoomAmenity = (idx: number, amenity: string) => {
    setRooms((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, amenities: r.amenities.includes(amenity) ? r.amenities.filter((a) => a !== amenity) : [...r.amenities, amenity] }
          : r
      )
    );
  };

  const toggleFacility = (f: string) => {
    setFacilities((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  // Final submit
  const handleSubmit = async () => {
    if (!ownerId) return;
    setError("");
    try {
      setLoading(true);

      // Upload main image
      let imgUrl = "";
      if (mainImageFile) {
        imgUrl = await uploadToCloudinary(mainImageFile, "savion/pgs");
      }

      // Compute aggregate pricing & availability from individual rooms
      const lowestRent = rooms.length > 0 ? Math.min(...rooms.map((r) => r.monthlyRent)) : 0;
      const totalRooms = rooms.length;
      const availableRooms = rooms.filter((r) => r.available > 0).length;

      // Upload room images concurrently
      const finalRooms = await Promise.all(
        rooms.map(async (room) => {
          let roomImgUrl = room.image;
          if (room.imageFile) {
            roomImgUrl = await uploadToCloudinary(room.imageFile, "savion/rooms");
          }
          const { imageFile, imagePreview, ...dbRoomData } = room;
          return { ...dbRoomData, image: roomImgUrl || "" } as PGRoom;
        })
      );

      const newPG = await createPG({
        name,
        description,
        type,
        location,
        city,
        ...(lat !== null ? { lat } : {}),
        ...(lng !== null ? { lng } : {}),
        price: `₹${lowestRent.toLocaleString("en-IN")}`,
        img: imgUrl,
        images: [],
        rooms: finalRooms,
        totalRooms,
        availableRooms,
        facilities,
        rules: rules.filter(Boolean),
        nearbyPlaces: nearbyPlaces.filter(Boolean),
        ownerId,
        caretakerId: caretakerMode === "saved" ? selectedSavedId : undefined,
      });

      // Handle caretaker creation
      if (caretakerMode === "new") {
        if (!ctUid.trim() || !ctPassword) {
          setError("Please fill in Caretaker UID and Password.");
          setLoading(false);
          return;
        }
        const caretakerEmail = `${ctUid.trim().toLowerCase()}@savion.caretaker`;
        const secondaryApp = initializeApp({ ...auth.app.options }, `ct-${Date.now()}`);
        const secondaryAuth = getFirebaseAuth(secondaryApp);
        try {
          const ctResult = await createUserWithEmailAndPassword(secondaryAuth, caretakerEmail, ctPassword);
          await createUserProfile(ctResult.user.uid, { role: "caretaker", name: ctName || ctUid });
          await createCaretaker({ uid: ctUid.trim().toLowerCase(), name: ctName || ctUid, ownerId, pgIds: [newPG.id], saved: ctSaveToPool });
          
          // Link the new caretaker to the PG as well
          const { updateDoc, doc } = await import("firebase/firestore");
          await updateDoc(doc(db, "pgs", newPG.id), { caretakerId: ctResult.user.uid });
        } finally {
          await deleteApp(secondaryApp);
        }
      } else if (caretakerMode === "saved" && selectedSavedId) {
        // Update saved caretaker's pgIds
        const { updateDoc, arrayUnion, doc } = await import("firebase/firestore");
        await updateDoc(doc(db, "caretakers", selectedSavedId), {
          pgIds: arrayUnion(newPG.id)
        });
      }

      router.push("/dashboard/owner");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError(`Caretaker UID "${ctUid}" is already taken.`);
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Returns room numbers that appear more than once
  const duplicateRoomNumbers = (): Set<string> => {
    const seen = new Map<string, number>();
    rooms.forEach((r) => {
      const key = r.roomNumber.trim().toLowerCase();
      if (key) seen.set(key, (seen.get(key) ?? 0) + 1);
    });
    const dups = new Set<string>();
    seen.forEach((count, key) => { if (count > 1) dups.add(key); });
    return dups;
  };

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return location.trim().length > 0 && city.trim().length > 0;
    if (step === 3) {
      const dups = duplicateRoomNumbers();
      return rooms.length > 0 && rooms.every((r) => r.monthlyRent > 0) && dups.size === 0;
    }
    if (step === 4) return true;
    return !ctUidTaken;
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in">
      {/* Header */}
      <header className="bg-white border-b py-4 px-6 sticky top-0 z-40">
        <div className="container max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/dashboard/owner">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="font-bold text-lg">List a New Property</h1>
        </div>
      </header>

      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center mb-8 gap-1 overflow-x-auto">
          {STEP_LABELS.map((label, i) => {
            const sNum = (i + 1) as Step;
            const isActive = step === sNum;
            const isDone = step > sNum;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none min-w-0">
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${isDone ? "bg-green-500 text-white" : isActive ? "bg-primary text-white" : "bg-slate-200 text-slate-500"}`}>
                    {isDone ? "✓" : sNum}
                  </div>
                  <span className={`text-xs font-semibold truncate ${isActive ? "text-primary" : "text-slate-400"}`}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded ${step > sNum ? "bg-primary/40" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* ── STEP 1: Basic Info ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-8 space-y-5 animate-scale-in">
            <h2 className="text-xl font-bold">Basic Information</h2>

            <div>
              <label className="label-sm">Building Name <span className="text-red-500">*</span></label>
              <Input placeholder="e.g. Suraj Heights PG" value={name} onChange={(e) => setName(e.target.value)} className="h-12 mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">This is your building or hostel name. Room numbers under this building must be unique.</p>
            </div>

            <div>
              <label className="label-sm">Description</label>
              <textarea
                placeholder="Describe your property — amenities, surroundings, ideal tenant..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full mt-1.5 border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="label-sm">Property Type <span className="text-red-500">*</span></label>
              <div className="flex gap-3 mt-1.5">
                {(["Boys", "Girls", "Co-living"] as const).map((t) => (
                  <button
                    key={t} type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2
                      ${type === t ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                  >
                    {t === "Boys" ? <><User className="w-4 h-4" /> Boys</> : t === "Girls" ? <><User className="w-4 h-4" /> Girls</> : <><Handshake className="w-4 h-4" /> Co-living</>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-sm">Main Photo</label>
              <label className={`mt-1.5 flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all
                ${mainImagePreview ? "border-green-400" : "border-slate-300 hover:border-primary/50 hover:bg-slate-50"}`}>
                {mainImagePreview ? (
                  <img src={mainImagePreview} alt="preview" className="h-full w-full object-cover rounded-xl" />
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-muted-foreground">Click to upload main photo (JPG, PNG)</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleMainImage(e.target.files[0]); }} />
              </label>
            </div>
          </div>
        )}

        {/* ── STEP 2: Location ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-8 space-y-5 animate-scale-in">
            <h2 className="text-xl font-bold">Location Details</h2>

            <div>
              <label className="label-sm">Full Address <span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g. 12B, MG Road, Koramangala, Bangalore 560034"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-12 mt-1.5"
              />
            </div>

            <div>
              <label className="label-sm">City <span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g. Bangalore"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 mt-1.5"
              />
            </div>

            {/* GPS Button */}
            <button
              type="button"
              onClick={detectLocation}
              disabled={geoLoading}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary/40 rounded-xl py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-all disabled:opacity-60"
            >
              {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              {geoLoading ? "Detecting location..." : "Auto-detect my location (GPS)"}
            </button>

            {/* Map preview */}
            {lat && lng && (
              <div className="rounded-2xl overflow-hidden border h-52 animate-fade-in-up">
                <iframe
                  title="Map"
                  width="100%"
                  height="100%"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`}
                  style={{ border: 0 }}
                />
              </div>
            )}

            <div>
              <label className="label-sm">Nearby Places <span className="text-slate-400 font-normal">(colleges, metro, hospitals)</span></label>
              <div className="space-y-2 mt-1.5">
                {nearbyPlaces.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`e.g. IIT Bombay (0.5 km)`}
                      value={p}
                      onChange={(e) => { const arr = [...nearbyPlaces]; arr[i] = e.target.value; setNearbyPlaces(arr); }}
                      className="h-10"
                    />
                    {i > 0 && (
                      <button type="button" onClick={() => setNearbyPlaces((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setNearbyPlaces((prev) => [...prev, ""])} className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add more
                </button>
              </div>
            </div>

            <div>
              <label className="label-sm">House Rules</label>
              <div className="space-y-2 mt-1.5">
                {rules.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`e.g. No smoking inside rooms`}
                      value={r}
                      onChange={(e) => { const arr = [...rules]; arr[i] = e.target.value; setRules(arr); }}
                      className="h-10"
                    />
                    {i > 0 && (
                      <button type="button" onClick={() => setRules((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setRules((prev) => [...prev, ""])} className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add rule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Rooms ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4 animate-scale-in">
            <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold">Room Configuration</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Building: <span className="font-semibold text-foreground">{name}</span></p>
                </div>
                <button
                  type="button"
                  onClick={addRoom}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/30 rounded-xl px-4 py-2 hover:bg-primary/5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Room
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Add each room in your building. Every room number must be unique within this building.</p>
              {duplicateRoomNumbers().size > 0 && (
                <div className="bg-primary/5 border border-primary/20 text-primary text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
                  ⚠️ Duplicate room numbers detected: <strong>{[...duplicateRoomNumbers()].map(r => r.toUpperCase()).join(", ")}</strong>. Each room must have a unique number.
                </div>
              )}
            </div>

            {rooms.map((room, idx) => (
              <div key={room.id} className="bg-white rounded-2xl border shadow-sm p-6 animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary">
                      {room.roomNumber || idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold">Room {room.roomNumber || idx + 1}</h3>
                      <p className="text-xs text-muted-foreground">{room.type} · Capacity: {room.capacity} person{room.capacity > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {rooms.length > 1 && (
                    <button type="button" onClick={() => removeRoom(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {ROOM_TYPES.map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => updateRoom(idx, "type", t)}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2
                        ${room.type === t ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                    >
                      {t === "Single" ? <><BedSingle className="w-4 h-4" /> Single</> :
                       t === "Double" ? <><BedDouble className="w-4 h-4" /> Double</> :
                       t === "Triple" ? <><BedDouble className="w-4 h-4" /> Triple</> :
                       t === "Studio" ? <><Home className="w-4 h-4" /> Studio</> :
                       <><Building2 className="w-4 h-4" /> Dorm</>}
                    </button>
                  ))}
                </div>

                {/* Room Number + Floor */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Room Number *</label>
                    <Input
                      placeholder="e.g. 101, A1, GF-2"
                      value={room.roomNumber}
                      onChange={(e) => updateRoom(idx, "roomNumber", e.target.value)}
                      className={`h-10 font-mono ${
                        room.roomNumber.trim() && duplicateRoomNumbers().has(room.roomNumber.trim().toLowerCase())
                          ? "border-primary focus-visible:ring-primary/30 bg-primary/5"
                          : ""
                      }`}
                    />
                    {room.roomNumber.trim() && duplicateRoomNumbers().has(room.roomNumber.trim().toLowerCase()) && (
                      <p className="text-xs text-primary mt-1 font-semibold">⚠️ Duplicate room number</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Floor (optional)</label>
                    <Input
                      placeholder="e.g. G, 1, 2, Terrace"
                      value={room.floor || ""}
                      onChange={(e) => updateRoom(idx, "floor", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Rent + Occupancy */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Monthly Rent (₹) *</label>
                    <Input
                      type="number" min="0"
                      placeholder="12000"
                      value={room.monthlyRent || ""}
                      onChange={(e) => updateRoom(idx, "monthlyRent", parseInt(e.target.value) || 0)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Current Occupancy
                      <span className="ml-1 font-normal text-muted-foreground">(out of {room.capacity})</span>
                    </label>
                    <Input
                      type="number" min="0" max={room.capacity}
                      value={room.currentOccupancy}
                      onChange={(e) => updateRoom(idx, "currentOccupancy", Math.min(room.capacity, parseInt(e.target.value) || 0))}
                      className="h-10"
                    />
                    <p className={`text-xs mt-1 font-semibold ${room.available > 0 ? "text-green-600" : "text-red-500"}`}>
                      {room.available > 0 ? `${room.available} spot${room.available > 1 ? "s" : ""} free` : "Full"}
                    </p>
                  </div>
                </div>

                {/* Amenities + Image Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-2">Room Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {["AC", "Attached Bathroom", "Balcony", "Study Desk", "Wardrobe", "TV"].map((a) => (
                        <button
                          key={a} type="button"
                          onClick={() => toggleRoomAmenity(idx, a)}
                          className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all
                            ${room.amenities.includes(a) ? "bg-primary text-white border-primary" : "border-slate-300 hover:border-primary/40"}`}
                        >
                          {room.amenities.includes(a) ? "✓ " : ""}{a}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-2">Room Photo</label>
                    <label className={`flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden relative
                      ${room.imagePreview ? "border-green-400" : "border-slate-300 hover:border-primary/50 hover:bg-slate-50"}`}>
                      {room.imagePreview ? (
                        <>
                           <img src={room.imagePreview} alt="preview" className="h-full w-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-bold">
                             Change Image
                           </div>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-[11px] font-medium text-muted-foreground text-center px-4">Upload room specific photo</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleRoomImage(idx, e.target.files[0]); }} />
                    </label>
                  </div>
                </div>
              </div>
            ))}

            {rooms.length > 0 && (
              <div className="bg-slate-50 rounded-2xl border p-4 text-sm text-slate-600 flex flex-wrap gap-6">
                <div><span className="font-bold text-slate-800">{rooms.length}</span> rooms configured</div>
                <div><span className="font-bold text-green-600">{rooms.filter(r => r.available > 0).length}</span> with available spots</div>
                <div><span className="font-bold text-slate-500">{rooms.reduce((a, r) => a + r.currentOccupancy, 0)}</span> currently occupied</div>
                {rooms.some(r => r.monthlyRent > 0) && (
                  <div>Starting from <span className="font-bold text-primary">₹{Math.min(...rooms.filter(r => r.monthlyRent > 0).map(r => r.monthlyRent)).toLocaleString("en-IN")}/mo</span></div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Facilities ─────────────────────────────────────────── */}
        {step === 4 && (
          <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-8 animate-scale-in">
            <h2 className="text-xl font-bold mb-2">Facilities & Amenities</h2>
            <p className="text-sm text-muted-foreground mb-5">Select everything your property offers. This helps tenants filter and find you.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_FACILITIES.map((f) => {
                const icons: Record<string, string> = {
                  WiFi: "📶", AC: "❄️", "Food Included": "🍽️", Laundry: "🧺", Parking: "🚗",
                  CCTV: "📹", "Security Guard": "💂", "Power Backup": "⚡", Gym: "💪",
                  "Study Room": "📚", "RO Water": "💧", Housekeeping: "🧹", "TV Lounge": "📺", Lift: "🛗",
                };
                const isSelected = facilities.includes(f);
                return (
                  <button
                    key={f} type="button"
                    onClick={() => toggleFacility(f)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left
                      ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30"}`}
                  >
                    <span>{icons[f] || "✅"}</span>
                    <span>{f}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 5: Caretaker ─────────────────────────────────────────── */}
        {step === 5 && (
          <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-8 space-y-4 animate-scale-in">
            <h2 className="text-xl font-bold">Assign Caretaker</h2>
            <p className="text-sm text-muted-foreground">Assign someone to manage this property day-to-day. You can skip this and add one later.</p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "none", label: "Skip for now", icon: "—" },
                { id: "new", label: "Create New", icon: <UserPlus className="w-5 h-5" /> },
                { id: "saved", label: `Saved (${savedCaretakers.length})`, icon: <Users className="w-5 h-5" />, disabled: savedCaretakers.length === 0 },
              ].map((opt) => (
                <button
                  key={opt.id} type="button"
                  disabled={(opt as any).disabled}
                  onClick={() => setCaretakerMode(opt.id as any)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-40
                    ${caretakerMode === opt.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                >
                  <span>{opt.icon}</span>
                  <span className="text-center text-xs leading-tight">{opt.label}</span>
                  {caretakerMode === opt.id && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {caretakerMode === "new" && (
              <div className="space-y-3 pt-2">
                <div className="bg-primary/5 border border-primary/10 text-primary text-xs rounded-lg px-3 py-2">
                  💡 These credentials are what the caretaker will use to log in at <strong>/caretaker-login</strong>.
                </div>
                <Input placeholder="Caretaker Name (optional)" value={ctName} onChange={(e) => setCtName(e.target.value)} className="h-11" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">UID (Login ID) *</label>
                    <div className="relative">
                      <Input
                        placeholder="e.g. ravi_hsr"
                        value={ctUid}
                        onChange={(e) => { setCtUid(e.target.value.replace(/\s+/g, "_").toLowerCase()); setCtUidTaken(false); }}
                        className={`h-10 font-mono pr-8 ${ctUidTaken ? "border-red-400" : ctUid && !ctUidChecking && !ctUidTaken ? "border-green-400" : ""}`}
                      />
                      {ctUidChecking && <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2.5 top-3 text-primary" />}
                      {!ctUidChecking && ctUid && !ctUidTaken && <span className="absolute right-2.5 top-2.5 text-green-500">✓</span>}
                      {!ctUidChecking && ctUidTaken && <span className="absolute right-2.5 top-2.5 text-red-500">✗</span>}
                    </div>
                    {ctUidTaken && <p className="text-xs text-red-600 mt-1">⚠️ UID taken. Choose another.</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Password *</label>
                    <Input type="password" placeholder="Min. 6 chars" value={ctPassword} onChange={(e) => setCtPassword(e.target.value)} className="h-10" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={ctSaveToPool} onChange={(e) => setCtSaveToPool(e.target.checked)} className="rounded" />
                  Save to my caretaker pool (reuse for other PGs)
                </label>
              </div>
            )}

            {caretakerMode === "saved" && savedCaretakers.length > 0 && (
              <div className="space-y-2">
                {savedCaretakers.map((ct) => (
                  <button
                    key={ct.id} type="button"
                    onClick={() => setSelectedSavedId(ct.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                      ${selectedSavedId === ct.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {ct.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{ct.name}</p>
                      <p className="text-xs text-muted-foreground">@{ct.uid}</p>
                    </div>
                    {selectedSavedId === ct.id && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)} className="px-6">← Back</Button>
          ) : (
            <Link href="/dashboard/owner">
              <Button variant="outline" className="px-6">Cancel</Button>
            </Link>
          )}

          {step < 5 ? (
            <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canNext()} className="px-6 font-semibold">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || ctUidTaken}
              className="px-8 font-bold bg-primary hover:bg-primary/90 text-white"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
              ) : (
                "✓ Publish Property"
              )}
            </Button>
          )}
        </div>
      </div>

      <style jsx>{`
        .label-sm { font-size: 0.875rem; font-weight: 600; color: #374151; }
      `}</style>
    </div>
  );
}
