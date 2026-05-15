"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getPGById, updatePG, PG } from "@/lib/db/pgs";
import { getBookingsByPG, updateBooking, Booking } from "@/lib/db/bookings";
import { updateContractStatus } from "@/lib/db/contracts";
import { getComplaintsByPG, updateComplaintStatus, Complaint } from "@/lib/db/complaints";
import { createNotification } from "@/lib/db/notifications";
import { getPaymentsByPG, updatePaymentStatus, Payment } from "@/lib/db/payments";
import { getUserProfile } from "@/lib/db/users";
import { db } from "@/lib/firebase/client";
import { collection, doc, query, where, onSnapshot } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { SpeedLoader } from "@/components/ui/SpeedLoader";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Users, Home, Edit3, Check, MapPin, Wifi, AlertTriangle, Receipt, CheckCircle2, XCircle, ImagePlus, ArrowUpRight, DollarSign, ClipboardCheck, UserCircle, MessageSquare, LayoutDashboard, Database, Clock } from "lucide-react";

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
  const [tenantNames, setTenantNames] = useState<Record<string, string>>({});
  const [isLive, setIsLive] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
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
    if (!params?.id) return;

    setIsLive(false);
    setSyncError(null);

    // 1. Real-time PG Document
    const unsubPg = onSnapshot(doc(db, "pgs", params.id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as PG;
        setPg(data);
        setEditName(data.name);
        setEditDesc(data.description || "");
        setEditLocation(data.location || "");
        setIsLive(true);
      }
      setLoading(false);
    }, (err) => {
      console.error("PG Sync Error:", err);
      setSyncError("Failed to sync building profile.");
    });

    // 2. Real-time Relational Data (Bookings, Complaints, Payments)
    setDataLoading(true);

    const qBookings = query(collection(db, "bookings"), where("pgId", "==", params.id));
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Booking[]);
    }, (err) => console.error("Bookings sync error:", err));

    const qComplaints = query(collection(db, "complaints"), where("pgId", "==", params.id));
    const unsubComplaints = onSnapshot(qComplaints, (snap) => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Complaint[]);
    }, (err) => console.error("Complaints sync error:", err));

    const qPayments = query(collection(db, "payments"), where("pgId", "==", params.id));
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Payment[]);
      setDataLoading(false);
    }, (err) => console.error("Payments sync error:", err));

    return () => {
      unsubPg();
      unsubBookings();
      unsubComplaints();
      unsubPayments();
    };
  }, [params?.id]);

  // --- AUTO-VANISH MONITOR (5:00 PM CHECKOUT SYNC) ---
  useEffect(() => {
    if (bookings.length === 0) return;

    const checkAndTerminate = async () => {
      const now = new Date();
      for (const booking of bookings) {
        if (booking.status === "notice_approved" && booking.moveOutDate) {
          const [year, month, day] = booking.moveOutDate.split("-").map(Number);
          const checkoutTime = new Date(year, month - 1, day, 17, 0, 0); // 5:00 PM

          if (now >= checkoutTime) {
            console.log(`[Auto-Vanish Sync] Terminating booking ${booking.id} - Checkout passed.`);
            try {
              // 1. Terminate Booking
              await updateBooking(booking.id, { status: "cancelled" }); // Move to history
              
              // 2. Terminate Contract
              if (booking.contractId) {
                await updateContractStatus(booking.contractId, "terminated");
              }

              // 3. Room Availability is usually handled manually or via a cloud function, 
              // but we ensure the status change reflects in the UI.
            } catch (err) {
              console.error("[Auto-Vanish Sync] Error:", err);
            }
          }
        }
      }
    };

    const interval = setInterval(checkAndTerminate, 60000); // Minute check
    checkAndTerminate(); 
    return () => clearInterval(interval);
  }, [bookings]);

  useEffect(() => {
    if (pg && ownerId && pg.ownerId !== ownerId) {
      router.replace("/dashboard/owner");
    }
  }, [pg, ownerId, router]);

  // Fetch names for tenants whose names aren't in the booking record
  useEffect(() => {
    if (bookings.length > 0) {
      const uids = Array.from(new Set(bookings.map(b => b.tenantId)));
      uids.forEach(uid => {
        if (!tenantNames[uid]) {
          getUserProfile(uid).then(profile => {
            if (profile) {
              setTenantNames(prev => ({ ...prev, [uid]: profile.name }));
            }
          });
        }
      });
    }
  }, [bookings]);

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
    const isDuplicate = (pg.rooms || []).some((r) => r.roomNumber.trim().toLowerCase() === newRoomNumber.trim().toLowerCase());
    if (isDuplicate) { setRoomNumberError(`Room "${newRoomNumber}" already exists.`); return; }
    const capacityMap = { Single: 1, Double: 2, Triple: 3, Studio: 1, Dormitory: 8 };
    const capacity = capacityMap[newRoomType];
    const occupancy = Math.min(capacity, Number(newRoomOccupancy) || 0);
    setIsAddingRoom(true);
    let imageUrl: string | undefined = undefined;
    try { if (newRoomImageFile) { imageUrl = await uploadToCloudinary(newRoomImageFile, "savion/rooms"); } } catch (err) { setRoomNumberError("Failed to upload image."); setIsAddingRoom(false); return; }
    const newRoom = { id: `room_${Date.now()}`, roomNumber: newRoomNumber.trim(), type: newRoomType, floor: newRoomFloor.trim() || undefined, monthlyRent: Number(newRoomRent), capacity, currentOccupancy: occupancy, available: Math.max(0, capacity - occupancy), amenities: newRoomAmenities, image: imageUrl };
    const updatedRooms = [...(pg.rooms || []), newRoom];
    const availRooms = updatedRooms.filter((r) => r.available > 0).length;
    const lowestRent = Math.min(...updatedRooms.map((r) => r.monthlyRent));
    await updatePG(pg.id, { rooms: updatedRooms, availableRooms: availRooms, totalRooms: updatedRooms.length, price: `₹${lowestRent.toLocaleString("en-IN")}` });
    setPg({ ...pg, rooms: updatedRooms, availableRooms: availRooms, totalRooms: updatedRooms.length });
    setShowAddRoom(false); setNewRoomNumber(""); setNewRoomRent(""); setRoomNumberError(""); setNewRoomImageFile(null); setNewRoomImagePreview(null); setIsAddingRoom(false);
  };

  const handleBookingAction = async (bookingId: string, tenantId: string, action: any, roomType: string, contractId?: string) => {
    if (!pg) return;
    await updateBooking(bookingId, { status: action });
    if (action === "cancelled" && contractId) await updateContractStatus(contractId, "terminated");
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: action } : b));
    await createNotification({ userId: tenantId, title: "Booking Update", message: `Your booking at ${pg.name} status: ${action}`, type: "booking" });
    if (action === "confirmed" && pg.rooms) {
      const targetRoom = pg.rooms.find(r => r.type === roomType && r.available > 0);
      if (targetRoom) await updateRoomAvail(targetRoom.id, targetRoom.available - 1);
    }
  };

  const handleNoticeAction = async (bookingId: string, tenantId: string, action: "approve" | "reject") => {
    if (!pg) return;
    const newStatus = action === "approve" ? "notice_approved" : "confirmed";
    await updateBooking(bookingId, { status: newStatus });
    
    await createNotification({
      userId: tenantId,
      title: action === "approve" ? "Notice Approved" : "Notice Reverted",
      message: action === "approve" 
        ? `Your move-out notice for ${pg.name} has been approved by the owner.`
        : `Your move-out notice for ${pg.name} was not accepted. Please contact the owner for details.`,
      type: "booking"
    });
  };

  const handleComplaintAction = async (complaintId: string, tenantId: string, status: any, category: string) => {
    await updateComplaintStatus(complaintId, status);
    setComplaints(complaints.map(c => c.id === complaintId ? { ...c, status } : c));
    await createNotification({ userId: tenantId, title: "Complaint Status", message: `Your ${category} complaint is now ${status}.`, type: "complaint" });
  };

  const handleExportCSV = () => {
    if (!pg) return;
    const headers = "Date,Tenant,Room,Type,Amount,Status,UTR\n";
    const rows = payments.map(p => `"${new Date(p.createdAt).toLocaleDateString()}","${p.tenantName}","${p.roomNo}","${p.type}","${p.amount}","${p.status}","${p.utrNumber}"`).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8," + headers + rows));
    link.setAttribute("download", `payments_${pg.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><SpeedLoader text="Loading Property" subtext="Syncing your assets..." /></div>;
  if (!pg) return null;

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10 selection:text-primary">
      {/* Clean White Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 py-4 px-6 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/owner">
              <button className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
            </Link>
            <div>
              <h1 className="font-black text-xl tracking-tight text-slate-900 leading-none">{pg.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-3 h-3 text-primary" />
                <p className="text-xs text-slate-500 font-medium">{pg.city} · {pg.location.split(',')[0]}</p>
                <div className="flex items-center gap-1.5 ml-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isLive ? 'Live' : 'Syncing'}</span>
                </div>
              </div>
            </div>
          </div>
          <Link href={`/pg/${pg.id}`} target="_blank">
            <Button variant="outline" className="h-9 rounded-xl text-xs font-bold gap-2 px-4 border-slate-200 text-slate-700 hover:bg-slate-50">
              Preview <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        {/* Clean Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Units", value: pg.totalRooms || pg.rooms?.length || 0, icon: LayoutDashboard, color: "text-slate-600", bg: "bg-slate-100" },
            { label: "Available", value: pg.availableRooms ?? 0, icon: ClipboardCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
            { label: "Residents", value: confirmedBookings.length, icon: Users, color: "text-primary", bg: "bg-orange-100" },
            { label: "Pending", value: pendingBookings.length, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-100" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Clean Tab Bar */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-8 overflow-x-auto">
          {(["overview", "rooms", "tenants", "complaints", "payments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 capitalize
                 ${activeTab === tab
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="animate-fade-in-up">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-slate-900 tracking-tight">Property Profile</h3>
                    <Button onClick={handleSave} disabled={saving} className={`h-9 rounded-xl font-semibold gap-2 px-5 text-sm ${saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary hover:bg-primary/90"}`}>
                      {saved ? <><Check className="w-4 h-4" />Saved</> : saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Building Name</label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-14 bg-slate-50 dark:bg-zinc-800/50 border-transparent rounded-2xl font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:bg-zinc-900 focus:ring-primary" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Details</label>
                        <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="h-14 bg-slate-50 dark:bg-zinc-800/50 border-transparent rounded-2xl font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:bg-zinc-900 focus:ring-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">About the Property</label>
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={4}
                        className="w-full border-transparent bg-slate-50 dark:bg-zinc-800/50 rounded-[1.5rem] p-5 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white dark:bg-zinc-900 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 shadow-sm dark:shadow-slate-900/50 p-10">
                  <h3 className="font-bold text-xl text-slate-900 tracking-tight mb-6">Amenities</h3>
                  <div className="flex flex-wrap gap-3">
                    {pg.facilities?.length ? (
                      pg.facilities.map((f) => (
                        <span key={f} className="bg-primary/5 text-primary px-5 py-2.5 rounded-2xl text-sm font-black border border-primary/10">{f}</span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 italic">No amenities listed for this property.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                    <div className="p-5 border-b border-slate-100">
                       <h4 className="text-slate-900 font-bold text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Geo-Location</h4>
                    </div>
                    {pg.lat && pg.lng ? (
                      <iframe title="Map" width="100%" height="260" src={`https://www.openstreetmap.org/export/embed.html?bbox=${pg.lng-0.002},${pg.lat-0.002},${pg.lng+0.002},${pg.lat+0.002}&layer=mapnik&marker=${pg.lat},${pg.lng}`} style={{ border: 0 }} />
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-sm">No location set</div>
                    )}
                 </div>
              </div>
            </div>
          )}

          {activeTab === "rooms" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <h3 className="font-black text-2xl text-slate-900 dark:text-slate-100 tracking-tight">Inventory Management</h3>
                <Button onClick={() => setShowAddRoom(!showAddRoom)} className={`h-11 rounded-xl font-black gap-2 ${showAddRoom ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100" : "bg-primary text-white"}`}>
                  {showAddRoom ? "Close Form" : "Create New Room"}
                </Button>
              </div>

              {showAddRoom && (
                <div className="bg-white dark:bg-zinc-900 border-2 border-primary/20 rounded-[2.5rem] p-10 animate-scale-in space-y-8 shadow-2xl dark:shadow-zinc-900/60 shadow-primary/5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room ID / No.</label>
                      <Input placeholder="e.g. 101" value={newRoomNumber} onChange={(e) => { setNewRoomNumber(e.target.value); setRoomNumberError(""); }} className={`h-14 rounded-2xl font-black ${roomNumberError ? "border-rose-400 bg-rose-50" : "bg-slate-50 dark:bg-zinc-800/50 border-transparent"}`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                      <select value={newRoomType} onChange={(e) => setNewRoomType(e.target.value as any)} className="w-full bg-slate-50 dark:bg-zinc-800/50 border-transparent rounded-2xl h-14 px-5 text-sm font-black focus:ring-2 focus:ring-primary/50">
                        {["Single", "Double", "Triple", "Studio", "Dormitory"].map(t => <option key={t} value={t}>{t} Room</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Rent</label>
                      <Input type="number" placeholder="₹ Amount" value={newRoomRent} onChange={(e) => setNewRoomRent(e.target.value)} className="h-14 rounded-2xl font-black bg-slate-50 dark:bg-zinc-800/50 border-transparent" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setShowAddRoom(false)} className="rounded-xl font-bold h-12 px-8">Discard</Button>
                    <Button onClick={handleAddRoom} disabled={isAddingRoom} className="bg-primary text-white font-black rounded-xl h-12 px-10 shadow-lg dark:shadow-zinc-900/50 shadow-primary/20">
                      {isAddingRoom ? "Syncing..." : "Confirm & Add"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pg.rooms?.map((room) => (
                  <div key={room.id} className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 shadow-sm dark:shadow-slate-900/50 p-8 flex flex-col justify-between hover:shadow-xl dark:shadow-zinc-900/50 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-black text-xl text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{room.type} Suite</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Room {room.roomNumber} · Max {room.capacity} Pax</p>
                      </div>
                      <span className={`text-[10px] font-black px-4 py-2 rounded-xl border tracking-widest
                        ${room.available > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                        {room.available > 0 ? `${room.available} VACANT` : "FULL"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateRoomAvail(room.id, Math.max(0, room.available - 1))} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center font-black hover:bg-primary/10 hover:text-primary transition-all">−</button>
                        <span className="w-6 text-center font-black text-lg">{room.available}</span>
                        <button onClick={() => updateRoomAvail(room.id, Math.min(room.capacity, room.available + 1))} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center font-black hover:bg-primary/10 hover:text-primary transition-all">+</button>
                      </div>
                      <p className="text-2xl font-black text-primary tracking-tight">₹{room.monthlyRent.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "tenants" && (
            <div className="space-y-6">
              <h3 className="font-black text-2xl text-slate-900 dark:text-slate-100 tracking-tight px-4">Resident List</h3>
              {bookings.length === 0 ? (
                 <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border p-20 text-center text-slate-400 font-bold italic shadow-sm dark:shadow-slate-900/50">No residents found for this building.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {bookings.map((b) => (
                    <div key={b.id} className={`bg-white dark:bg-zinc-900 rounded-[2rem] border p-8 shadow-sm dark:shadow-slate-900/50 flex flex-col md:flex-row justify-between items-center transition-all hover:shadow-xl dark:shadow-zinc-900/50
                      ${b.status === 'pending' ? 'border-primary/20 bg-primary/[0.02]' : 'border-slate-100'}`}>
                      <div className="flex items-center gap-6 w-full">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center shadow-inner shrink-0 group-hover:bg-primary/10 transition-colors duration-500">
                           <UserCircle className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-black text-lg text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                                {b.tenantName || tenantNames[b.tenantId] || `${b.roomType} Resident`}
                              </p>
                               <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border tracking-widest
                                ${b.status === "confirmed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                                  b.status === "notice_given" ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" :
                                  b.status === "notice_approved" ? "bg-slate-900 text-white border-slate-800" :
                                  "bg-amber-50 text-amber-600 border-amber-100"}`}>
                                {b.status.replace("_", " ").toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Joined: {new Date(b.createdAt).toLocaleDateString()} · ID: {b.id.slice(0, 8)}</p>
                              {b.status === "notice_approved" && b.moveOutDate && (
                                <div className="flex items-center gap-2 text-rose-600">
                                   <Clock className="w-3.5 h-3.5" />
                                   <p className="text-[10px] font-black uppercase tracking-widest">Out: {new Date(b.moveOutDate).toLocaleDateString("en-IN")} @ 5:00 PM</p>
                                </div>
                              )}
                            </div>
                          </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 md:mt-0 w-full md:w-auto">
                        {b.status === "pending" && (
                          <Button onClick={() => handleBookingAction(b.id, b.tenantId, "confirmed", b.roomType)} className="h-12 px-6 bg-primary text-white font-black rounded-xl shadow-lg dark:shadow-zinc-900/50 shadow-primary/20 flex-1">Approve Inquiry</Button>
                        )}
                        
                        {b.status === "notice_given" && (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                              onClick={() => handleNoticeAction(b.id, b.tenantId, "approve")}
                              className="h-12 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg dark:shadow-zinc-900/50 shadow-emerald-900/10 flex-1 text-xs"
                            >
                              Approve Checkout
                            </Button>
                            <Button 
                              onClick={() => handleNoticeAction(b.id, b.tenantId, "reject")}
                              variant="outline"
                              className="h-12 px-4 border-rose-200 text-rose-600 hover:bg-rose-50 font-black rounded-xl flex-1 text-xs"
                            >
                              Stay Active
                            </Button>
                          </div>
                        )}

                        {b.contractId && (
                          <Link href={`/contract/${b.contractId}`} className="flex-1 w-full sm:w-auto">
                            <Button variant="outline" className="h-12 w-full rounded-xl font-black border-slate-200 dark:border-zinc-700">Contract File</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "complaints" && (
            <div className="space-y-6">
              <h3 className="font-black text-2xl text-slate-900 dark:text-slate-100 tracking-tight px-4">Support Tickets</h3>
              {complaints.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border p-20 text-center text-slate-400 font-bold italic shadow-sm dark:shadow-slate-900/50">No active complaints. Everything is perfect!</div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {complaints.map((c) => (
                    <div key={c.id} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 shadow-sm dark:shadow-slate-900/50 p-10 flex flex-col lg:flex-row gap-10 hover:shadow-xl dark:shadow-zinc-900/50 transition-all group">
                      <div className="flex-1">
                         <div className="flex items-center gap-4 mb-6">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border
                              ${c.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                              {c.status}
                            </span>
                            <h4 className="font-black text-primary uppercase tracking-widest text-xs">{c.category} Issue</h4>
                         </div>
                         <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-snug">{c.description}</p>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                            <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Resident</p><p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{c.tenantName || 'Resident'}</p></div>
                            <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Room</p><p className="text-xs font-black text-slate-900 dark:text-slate-100">{c.roomNo}</p></div>
                            <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Reported</p><p className="text-xs font-black text-slate-900 dark:text-slate-100">{new Date(c.createdAt).toLocaleDateString()}</p></div>
                            <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Priority</p><p className="text-xs font-black text-rose-600">HIGH</p></div>
                         </div>
                      </div>
                      <div className="lg:w-48 space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Quick Action</label>
                         <select value={c.status} onChange={(e) => handleComplaintAction(c.id, c.tenantId, e.target.value as any, c.category)} className="w-full bg-slate-50 dark:bg-zinc-800/50 border-transparent rounded-2xl h-14 px-5 text-xs font-black focus:ring-2 focus:ring-primary/50 transition-all">
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                         </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-6">
               <div className="flex justify-between items-center px-4">
                  <h3 className="font-black text-2xl text-slate-900 dark:text-slate-100 tracking-tight">Ledger</h3>
                  <Button onClick={handleExportCSV} variant="outline" className="rounded-xl font-black gap-2 border-slate-200 dark:border-zinc-700">Export Ledger <Receipt className="w-4 h-4" /></Button>
               </div>
               {payments.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border p-20 text-center text-slate-400 font-bold italic shadow-sm dark:shadow-slate-900/50">No transactions recorded yet.</div>
               ) : (
                  <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 shadow-sm dark:shadow-slate-900/50 overflow-hidden">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-slate-50 dark:bg-zinc-800/50/50 border-b border-slate-100">
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {payments.map(p => (
                              <tr key={p.id} className="hover:bg-slate-50 dark:bg-zinc-800/50/50 transition-colors">
                                 <td className="p-6">
                                    <p className="font-black text-slate-900 dark:text-slate-100">{p.tenantName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room {p.roomNo}</p>
                                 </td>
                                 <td className="p-6 font-black text-sm text-slate-600 dark:text-slate-400 uppercase">{p.month}</td>
                                 <td className="p-6 font-black text-xl text-primary tracking-tight">₹{p.amount.toLocaleString()}</td>
                                  <td className="p-6 text-right">
                                     <div className="flex items-center justify-end gap-2">
                                       <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border tracking-widest
                                          ${p.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : p.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                          {p.status.toUpperCase()}
                                       </span>
                                       {p.status === 'submitted' && (
                                         <div className="flex gap-1">
                                           <button onClick={() => updatePaymentStatus(p.id, 'verified')} className="text-[10px] font-black px-2 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">✓ Verify</button>
                                           <button onClick={() => updatePaymentStatus(p.id, 'rejected')} className="text-[10px] font-black px-2 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors">✗ Reject</button>
                                         </div>
                                       )}
                                     </div>
                                  </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
