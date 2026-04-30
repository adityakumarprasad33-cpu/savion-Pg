"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getPGById, updatePG, PG } from "@/lib/db/pgs";
import { getBookingsByPG, updateBookingStatus } from "@/lib/db/bookings";
import { updateContractStatus } from "@/lib/db/contracts";
import { getComplaintsByPG, updateComplaintStatus, Complaint } from "@/lib/db/complaints";
import { createNotification } from "@/lib/db/notifications";
import { getPaymentsByPG, updatePaymentStatus, Payment } from "@/lib/db/payments";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Users, Home, Edit3, Check, MapPin, Wifi, AlertTriangle, Receipt, CheckCircle2, XCircle, ImagePlus } from "lucide-react";
import type { Booking } from "@/lib/db/bookings";

export default function ManagePGPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pg, setPg] = useState<PG | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "tenants" | "complaints" | "payments">("overview");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Room Edit State
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomType, setNewRoomType] = useState<"Single" | "Double" | "Triple" | "Studio" | "Dormitory">("Single");
  const [newRoomFloor, setNewRoomFloor] = useState("");
  const [newRoomRent, setNewRoomRent] = useState("");
  const [newRoomOccupancy, setNewRoomOccupancy] = useState("0");
  const [newRoomAmenities, setNewRoomAmenities] = useState<string[]>([]);
  const [roomNumberError, setRoomNumberError] = useState("");
  const [newRoomImageFile, setNewRoomImageFile] = useState<File | null>(null);
  const [newRoomImagePreview, setNewRoomImagePreview] = useState<string | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLocation, setEditLocation] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/login"); return; }
      setOwnerId(user.uid);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (params?.id) {
      // Load PG data
      getPGById(params.id).then((data) => {
        if (data) {
          setPg(data);
          setEditName(data.name);
          setEditDesc(data.description || "");
          setEditLocation(data.location || "");
        }
        setLoading(false);
      });

      // Load all relational data in parallel — don't block on any one
      setDataLoading(true);
      Promise.all([
        getBookingsByPG(params.id).then(setBookings),
        getComplaintsByPG(params.id).then(setComplaints),
        getPaymentsByPG(params.id).then(setPayments),
      ]).finally(() => setDataLoading(false));
    }
  }, [params?.id, router]);

  // Ensure only the owner can manage this PG
  useEffect(() => {
    if (pg && ownerId && pg.ownerId !== ownerId) {
      router.replace("/dashboard/owner");
    }
  }, [pg, ownerId, router]);

  const handleSave = async () => {
    if (!pg) return;
    setSaving(true);
    try {
      await updatePG(pg.id, { name: editName, description: editDesc, location: editLocation });
      setPg({ ...pg, name: editName, description: editDesc, location: editLocation });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const updateRoomAvail = async (roomId: string, newVal: number) => {
    if (!pg) return;
    const updatedRooms = pg.rooms.map((r) => r.id === roomId ? { ...r, available: newVal } : r);
    const availableRooms = updatedRooms.reduce((a, r) => a + r.available, 0);
    await updatePG(pg.id, { rooms: updatedRooms, availableRooms });
    setPg({ ...pg, rooms: updatedRooms, availableRooms });
  };

  const handleAddRoom = async () => {
    if (!pg || !newRoomNumber.trim() || !newRoomRent) return;

    // Duplicate room number check
    const isDuplicate = (pg.rooms || []).some(
      (r) => r.roomNumber.trim().toLowerCase() === newRoomNumber.trim().toLowerCase()
    );
    if (isDuplicate) {
      setRoomNumberError(`Room "${newRoomNumber}" already exists in this building.`);
      return;
    }

    const capacityMap = { Single: 1, Double: 2, Triple: 3, Studio: 1, Dormitory: 8 };
    const capacity = capacityMap[newRoomType];
    const occupancy = Math.min(capacity, Number(newRoomOccupancy) || 0);

    setIsAddingRoom(true);
    let imageUrl: string | undefined = undefined;
    try {
      if (newRoomImageFile) {
        imageUrl = await uploadToCloudinary(newRoomImageFile, "savion/rooms");
      }
    } catch (err) {
      setRoomNumberError("Failed to upload room image. Please try again.");
      setIsAddingRoom(false);
      return;
    }

    const newRoom = {
      id: `room_${Date.now()}`,
      roomNumber: newRoomNumber.trim(),
      type: newRoomType,
      floor: newRoomFloor.trim() || undefined,
      monthlyRent: Number(newRoomRent),
      capacity,
      currentOccupancy: occupancy,
      available: Math.max(0, capacity - occupancy),
      amenities: newRoomAmenities,
      image: imageUrl,
    };

    const updatedRooms = [...(pg.rooms || []), newRoom];
    const availableRooms = updatedRooms.filter((r) => r.available > 0).length;
    const totalRooms = updatedRooms.length;
    const lowestRent = Math.min(...updatedRooms.map((r) => r.monthlyRent));

    await updatePG(pg.id, {
      rooms: updatedRooms,
      availableRooms,
      totalRooms,
      price: `₹${lowestRent.toLocaleString("en-IN")}`,
    });
    setPg({ ...pg, rooms: updatedRooms, availableRooms, totalRooms });

    // Reset form
    setShowAddRoom(false);
    setNewRoomNumber("");
    setNewRoomType("Single");
    setNewRoomFloor("");
    setNewRoomRent("");
    setNewRoomOccupancy("0");
    setNewRoomAmenities([]);
    setRoomNumberError("");
    setNewRoomImageFile(null);
    setNewRoomImagePreview(null);
    setIsAddingRoom(false);
  };

  const handleBookingAction = async (
    bookingId: string,
    tenantId: string,
    action: "approved" | "confirmed" | "cancelled" | "notice_approved" | "disputed",
    roomType: string,
    contractId?: string
  ) => {
    if (!pg) return;
    await updateBookingStatus(bookingId, action);

    // If cancelling (e.g. they vacated), also terminate the contract
    if (action === "cancelled" && contractId) {
      await updateContractStatus(contractId, "terminated");
    }

    // Update local bookings state
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: action } : b));

    // Notify tenant
    await createNotification({
      userId: tenantId,
      title: `Booking ${
        action === "approved"
          ? "Pre-Approved"
          : action === "confirmed"
          ? "Approved"
          : action === "cancelled"
          ? "Cancelled"
          : action === "notice_approved"
          ? "Notice Approved"
          : "Update"
      }`,
      message: action === "approved"
        ? `Your inquiry for a ${roomType} room at ${pg.name} has been pre-approved! Please complete the payment to confirm your stay.`
        : action === "cancelled"
        ? `Your booking for a ${roomType} room at ${pg.name} has been marked as vacated/cancelled.`
        : action === "notice_approved"
          ? `Your move-out request for the ${roomType} room at ${pg.name} has been approved. Please hand over the keys by your scheduled date.`
          : `Your booking for a ${roomType} room at ${pg.name} has been ${action}.`,
      type: "booking"
    });

    // If confirmed, try to decrease the availability of that room type
    if (action === "confirmed" && pg.rooms) {
      const targetRoom = pg.rooms.find(r => r.type === roomType && r.available > 0);
      if (targetRoom) {
        await updateRoomAvail(targetRoom.id, targetRoom.available - 1);
      }
    }
  };

  const handleComplaintAction = async (complaintId: string, tenantId: string, status: "open" | "in-progress" | "resolved", category: string) => {
    await updateComplaintStatus(complaintId, status);
    setComplaints(complaints.map(c => c.id === complaintId ? { ...c, status } : c));

    let message = "";
    if (status === "in-progress") message = `Your complaint regarding '${category}' is now being worked on.`;
    if (status === "resolved") message = `Your complaint regarding '${category}' has been marked as resolved.`;

    if (message) {
      await createNotification({
        userId: tenantId,
        title: "Complaint Status Updated",
        message,
        type: "complaint"
      });
    }
  };

  const handleExportCSV = () => {
    if (!pg) return;
    const headers = "Date,Tenant,Room,Type,Amount,Status,UTR\n";
    const rows = payments.map(p => {
      const date = new Date(p.createdAt).toLocaleDateString("en-IN");
      return `"${date}","${p.tenantName || 'Unknown'}","${p.roomNo}","${p.type}","${p.amount}","${p.status}","${p.utrNumber}"`;
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payments_${pg.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!pg) return null;

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6 shadow sticky top-0 z-40">
        <div className="container mx-auto flex items-center gap-4">
          <Link href="/dashboard/owner">
            <button className="opacity-70 hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-lg">{pg.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{pg.city}</p>
          </div>
          <Link href={`/pg/${pg.id}`} target="_blank">
            <button className="text-xs border border-slate-600 rounded-lg px-3 py-1.5 hover:border-slate-400 transition-all">
              Public View →
            </button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 stagger">
          {[
            { label: "Total Rooms", value: pg.totalRooms || pg.rooms?.length || 0, color: "border-l-blue-500" },
            { label: "Available Now", value: pg.availableRooms ?? 0, color: "border-l-green-500" },
            { label: "Active Tenants", value: confirmedBookings.length, color: "border-l-primary" },
            { label: "Awaiting Payment", value: pendingBookings.length, color: "border-l-yellow-500" },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-xl border shadow-sm p-4 border-l-4 ${s.color} animate-fade-in-up hover-lift`}>
              <p className="text-xs text-muted-foreground font-semibold uppercase">{s.label}</p>
              <p className="text-3xl font-black mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 overflow-x-auto scroller">
          {(["overview", "rooms", "tenants", "complaints", "payments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all shrink-0
                 ${activeTab === tab ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}
            >
              {tab === "overview" ? "📋 Overview" : tab === "rooms" ? "🛏️ Rooms" : tab === "tenants" ? "👤 Tenants" : tab === "complaints" ? "⚠️ Complaints" : "💳 Payments"}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-5 animate-fade-in-up">
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Edit3 className="w-4 h-4" /> Edit Details</h3>
                <Button size="sm" onClick={handleSave} disabled={saving} className={`gap-1.5 ${saved ? "bg-green-600 hover:bg-green-600" : ""}`}>
                  {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Property Name</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-11" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Address</label>
                  <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="h-11" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* Facilities */}
            {pg.facilities?.length > 0 && (
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Wifi className="w-4 h-4" /> Facilities</h3>
                <div className="flex flex-wrap gap-2">
                  {pg.facilities.map((f) => (
                    <span key={f} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {pg.lat && pg.lng && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Property Location</span>
                </div>
                <iframe
                  title="Property Map"
                  width="100%"
                  height="220"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${pg.lng - 0.005},${pg.lat - 0.005},${pg.lng + 0.005},${pg.lat + 0.005}&layer=mapnik&marker=${pg.lat},${pg.lng}`}
                  style={{ border: 0 }}
                />
              </div>
            )}
          </div>
        )}

        {/* ROOMS TAB */}
        {activeTab === "rooms" && (
          <div className="space-y-4 animate-fade-in-up">

            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm">
              <h3 className="font-bold text-lg">Manage Inventory</h3>
              <Button onClick={() => setShowAddRoom(!showAddRoom)} variant={showAddRoom ? "outline" : "default"} size="sm">
                {showAddRoom ? "Cancel" : "+ Add Room"}
              </Button>
            </div>

            {showAddRoom && (
              <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 animate-scale-in space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base">Add New Room</h4>
                  <span className="text-xs text-muted-foreground">Building: <strong>{pg.name}</strong></span>
                </div>

                {roomNumberError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5">
                    ⚠️ {roomNumberError}
                  </div>
                )}

                {/* Row 1: Room Number + Type + Floor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Room Number <span className="text-red-500">*</span></label>
                    <Input
                      placeholder="e.g. 101, A1, GF-2"
                      value={newRoomNumber}
                      onChange={(e) => { setNewRoomNumber(e.target.value); setRoomNumberError(""); }}
                      className={`h-10 font-mono ${roomNumberError ? "border-red-400 bg-red-50" : ""}`}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Must be unique in this building</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Room Type <span className="text-red-500">*</span></label>
                    <select
                      value={newRoomType}
                      onChange={(e) => setNewRoomType(e.target.value as any)}
                      className="w-full border rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="Single">Single (1 person)</option>
                      <option value="Double">Double (2 persons)</option>
                      <option value="Triple">Triple (3 persons)</option>
                      <option value="Studio">Studio (1 person)</option>
                      <option value="Dormitory">Dormitory (8 persons)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Floor <span className="text-slate-400 font-normal">(optional)</span></label>
                    <Input
                      placeholder="e.g. G, 1, 2, Terrace"
                      value={newRoomFloor}
                      onChange={(e) => setNewRoomFloor(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Row 2: Rent + Occupancy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Monthly Rent (₹) <span className="text-red-500">*</span></label>
                    <Input
                      type="number" min="0"
                      placeholder="e.g. 8000"
                      value={newRoomRent}
                      onChange={(e) => setNewRoomRent(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Current Occupancy</label>
                    <Input
                      type="number" min="0"
                      placeholder="0"
                      value={newRoomOccupancy}
                      onChange={(e) => setNewRoomOccupancy(e.target.value)}
                      className="h-10"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">How many people are currently living here?</p>
                  </div>
                </div>

                {/* Row 3: Amenities + Image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-2">Room Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {["AC", "Attached Bathroom", "Balcony", "Study Desk", "Wardrobe", "TV"].map((a) => (
                        <button
                          key={a} type="button"
                          onClick={() => setNewRoomAmenities((prev) =>
                            prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                          )}
                          className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                            newRoomAmenities.includes(a)
                              ? "bg-primary text-white border-primary"
                              : "border-slate-300 hover:border-primary/40"
                          }`}
                        >
                          {newRoomAmenities.includes(a) ? "✓ " : ""}{a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-2">Room Photo</label>
                    <label className={`flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden relative
                      ${newRoomImagePreview ? "border-green-400" : "border-slate-300 hover:border-primary/50 hover:bg-slate-50"}`}>
                      {newRoomImagePreview ? (
                        <>
                           <img src={newRoomImagePreview} alt="preview" className="h-full w-full object-cover" />
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
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { 
                        if (e.target.files?.[0]) {
                          setNewRoomImageFile(e.target.files[0]);
                          setNewRoomImagePreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }} />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t">
                  <Button variant="outline" onClick={() => { setShowAddRoom(false); setRoomNumberError(""); }}>Cancel</Button>
                  <Button
                    onClick={handleAddRoom}
                    disabled={!newRoomNumber.trim() || !newRoomRent || isAddingRoom}
                    className="px-6 font-semibold"
                  >
                    {isAddingRoom ? "Saving..." : "+ Save Room"}
                  </Button>
                </div>
              </div>
            )}

            {(!pg.rooms || pg.rooms.length === 0) ? (
              <div className="bg-white rounded-2xl border p-10 text-center">
                <p className="text-3xl mb-2">🛏️</p>
                <p className="font-semibold">No rooms configured</p>
                <p className="text-sm text-muted-foreground mt-1">Click Add Room above to start inventory.</p>
              </div>
            ) : (
              pg.rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col md:flex-row justify-between gap-4 hover-lift">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{room.type} Room</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${room.available > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {room.available > 0 ? `${room.available} available` : "Full"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Room: {room.roomNumber} · Capacity: {room.capacity}</p>
                    {room.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.map((a) => (
                          <span key={a} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <p className="text-xl font-extrabold text-primary">₹{room.monthlyRent.toLocaleString("en-IN")}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Available:</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => updateRoomAvail(room.id, Math.max(0, room.available - 1))} className="w-7 h-7 rounded-lg border flex items-center justify-center font-bold hover:bg-slate-100">−</button>
                        <span className="w-8 text-center font-bold">{room.available}</span>
                        <button type="button" onClick={() => updateRoomAvail(room.id, Math.min(room.capacity, room.available + 1))} className="w-7 h-7 rounded-lg border flex items-center justify-center font-bold hover:bg-slate-100">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "tenants" && (
          <div className="space-y-3 animate-fade-in-up">


            {dataLoading ? (
              <div className="bg-white rounded-2xl border p-10 text-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center">
                <p className="text-3xl mb-2">👤</p>
                <p className="font-semibold">No tenants yet</p>
                <p className="text-sm text-muted-foreground mt-1">Bookings for this PG will appear here.</p>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex justify-between items-center hover-lift ${b.status === 'pending' ? 'border-yellow-300 bg-yellow-50/30' : ''
                  }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold">{b.roomType} Room</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${b.status === "confirmed" ? "bg-green-100 text-green-700" :
                          b.status === "notice_given" ? "bg-orange-100 text-orange-700" :
                            b.status === "notice_approved" ? "bg-blue-100 text-blue-700" :
                              b.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                        }`}>
                        {b.status === "notice_given" ? "NOTICE GIVEN" : b.status === "notice_approved" ? "NOTICE APPROVED" : b.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Move-in: {b.moveInDate} · ₹{b.amount.toLocaleString("en-IN")}/mo</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">Tenant: {b.tenantId.slice(0, 16)}…</p>
                    {b.status === "pending" && (
                      <p className="text-xs text-yellow-700 font-semibold mt-1.5 bg-yellow-100 px-2 py-0.5 rounded-md inline-block">
                        ⏳ Awaiting Payment
                      </p>
                    )}
                    {b.status === "notice_given" && (
                      <p className="text-xs text-orange-700 font-semibold mt-1.5 bg-orange-100 px-2 py-0.5 rounded-md inline-block">
                        ⚠️ 7-Day Move-out Notice Received
                      </p>
                    )}
                    {b.status === "notice_approved" && (
                      <p className="text-xs text-blue-700 font-semibold mt-1.5 bg-blue-100 px-2 py-0.5 rounded-md inline-block">
                        ℹ️ Notice Approved (Awaiting Vacate)
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                    {b.status === "pending" && (
                      <Button 
                        size="sm" 
                        className="bg-primary hover:bg-primary/90 text-white font-bold"
                        onClick={() => handleBookingAction(b.id, b.tenantId, "approved", b.roomType)}
                      >
                        Approve Inquiry
                      </Button>
                    )}
                    {b.status === "notice_given" && (
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white font-bold" onClick={() => handleBookingAction(b.id, b.tenantId, "notice_approved" as any, b.roomType)}>
                        Approve Notice
                      </Button>
                    )}
                    {b.status === "notice_approved" && (
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => handleBookingAction(b.id, b.tenantId, "cancelled", b.roomType, b.contractId)}>
                        Mark as Vacated
                      </Button>
                    )}
                    {b.contractId && (
                      <Link href={`/contract/${b.contractId}`}>
                        <Button variant="outline" size="sm">Contract</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* COMPLAINTS TAB */}
        {activeTab === "complaints" && (
          <div className="space-y-4 animate-fade-in-up">
            {complaints.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center">
                <p className="text-3xl mb-2">✅</p>
                <p className="font-semibold">No complaints filed</p>
                <p className="text-sm text-muted-foreground mt-1">Everything is running smoothly.</p>
              </div>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl border shadow-sm p-6 flex flex-col lg:flex-row justify-between gap-6 hover-lift relative overflow-hidden">
                  {/* Color Accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.status === "resolved" ? "bg-green-500" :
                      c.status === "in-progress" ? "bg-blue-500" : "bg-red-500"
                    }`} />

                  <div className="flex-1 pl-2">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md ${c.status === "resolved" ? "bg-green-100 text-green-700" :
                          c.status === "in-progress" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                        }`}>{c.status}</span>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
                        {c.category.toUpperCase()}
                      </h4>
                    </div>

                    <div className="mb-5 pl-1 text-slate-700">
                      <p className="text-base leading-relaxed">{c.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-3 p-4 bg-slate-50 border rounded-xl">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tenant Name</p>
                        <p className="text-sm font-semibold text-slate-900">{c.tenantName || "Unknown Profile"}</p>
                      </div>
                      <div className="border-l border-slate-200 hidden sm:block"></div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Room</p>
                        <p className="text-sm font-semibold text-slate-900">{c.roomNo || "Unspecified"}</p>
                      </div>
                      <div className="border-l border-slate-200 hidden sm:block"></div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reg-ID</p>
                        <p className="text-sm font-mono font-bold text-primary">{c.regId ? c.regId.slice(0, 10) : c.id.slice(0, 10)}</p>
                      </div>
                      <div className="border-l border-slate-200 hidden sm:block"></div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filed On</p>
                        <p className="text-sm font-medium text-slate-700">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Update Status</label>
                    <select
                      value={c.status}
                      onChange={(e) => handleComplaintAction(c.id, c.tenantId, e.target.value as any, c.category)}
                      className="border rounded-lg bg-slate-50 text-sm p-2 w-full md:w-40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">Working</option>
                      <option value="resolved">Done</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* PAYMENTS TAB */}
      {activeTab === "payments" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-scale-in">
          <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Payment History</h2>
              <p className="text-sm text-muted-foreground">All transactions related to this PG.</p>
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export CSV
            </Button>
          </div>
          {payments.length === 0 ? (
            <div className="bg-white rounded-2xl border p-10 text-center shadow-sm">
              <p className="text-4xl mb-3">💳</p>
              <p className="font-bold text-lg">No payments yet</p>
              <p className="text-muted-foreground text-sm mt-1">Payments submitted by tenants will appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Tenant</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Room</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Month</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Amount</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">UTR</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold">{p.tenantName}</p>
                          <p className="text-xs text-muted-foreground">{p.type === "rent" ? "Rent" : "Security Deposit"}</p>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{p.roomNo}</td>
                        <td className="px-5 py-4">{p.month}</td>
                        <td className="px-5 py-4 font-bold text-primary">₹{p.amount.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4 font-mono text-xs">{p.utrNumber}</td>
                        <td className="px-5 py-4">
                          {p.status === "verified" && <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Verified ✅</span>}
                          {p.status === "submitted" && <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Pending ⏳</span>}
                          {p.status === "rejected" && <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">Rejected ❌</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {p.status === "submitted" && (
                              <>
                                <button
                                  onClick={async () => {
                                    await updatePaymentStatus(p.id, "verified");
                                    setPayments(payments.map(pay => pay.id === p.id ? { ...pay, status: "verified" } : pay));
                                    await createNotification({ userId: p.tenantId, title: "✅ Payment Verified", message: `Your ${p.month} rent of ₹${p.amount.toLocaleString("en-IN")} at ${p.pgName} has been verified.`, type: "booking" });
                                  }}
                                  className="flex items-center gap-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                                </button>
                                <button
                                  onClick={async () => {
                                    await updatePaymentStatus(p.id, "rejected");
                                    setPayments(payments.map(pay => pay.id === p.id ? { ...pay, status: "rejected" } : pay));
                                    await createNotification({ userId: p.tenantId, title: "❌ Payment Rejected", message: `Your ${p.month} payment of ₹${p.amount.toLocaleString("en-IN")} at ${p.pgName} was rejected. Please resubmit with correct details.`, type: "booking" });
                                  }}
                                  className="flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </>
                            )}
                            <Link href={`/dashboard/tenant/receipt/${p.id}`} target="_blank">
                              <button className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-semibold transition-colors border border-blue-200">
                                <Receipt className="w-3.5 h-3.5" /> Receipt
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t flex justify-between items-center">
                <p className="text-xs text-muted-foreground">Total collected (verified only):</p>
                <p className="font-bold text-primary">₹{payments.filter(p => p.status === "verified").reduce((a, p) => a + p.amount, 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
