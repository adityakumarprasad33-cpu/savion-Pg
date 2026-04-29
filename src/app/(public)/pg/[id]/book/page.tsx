"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { getPGById, PG } from "@/lib/db/pgs";
import { getUserProfile } from "@/lib/db/users";
import { createBooking, getUserBookings } from "@/lib/db/bookings";
import { createContract } from "@/lib/db/contracts";
import { createPaymentSession } from "@/lib/db/paymentSessions";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createNotification } from "@/lib/db/notifications";
import { AadhaarVerifier, AadhaarExtracted } from "@/components/booking/AadhaarVerifier";
import { SignaturePad } from "@/components/booking/SignaturePad";
import { SpeedLoader } from "@/components/ui/SpeedLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ChevronRight, FileText, PenLine, Upload, User } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1, label: "Details", icon: User },
  { id: 2, label: "Documents", icon: Upload },
  { id: 3, label: "Signature", icon: PenLine },
  { id: 4, label: "Review", icon: FileText },
];

export default function BookingWizard() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRoomId = searchParams.get("roomId");
  const [pg, setPg] = useState<PG | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [selectedRoomId, setSelectedRoomId] = useState<string>(preselectedRoomId || "");
  const [moveInDate, setMoveInDate] = useState("");

  // Step 2
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [aadhaarData, setAadhaarData] = useState<AadhaarExtracted | null>(null);
  const [extraFile, setExtraFile] = useState<File | null>(null);

  // Step 3
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureSaved, setSignatureSaved] = useState(false);

  // Result
  const [contractId, setContractId] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/login"); return; }
      setUserId(user.uid);
      const profile = await getUserProfile(user.uid);
      setTenantName(profile?.name || "Tenant");

      // Check for active booking and block
      const bookings = await getUserBookings(user.uid);
      const active = bookings.some(b => b.status === "confirmed" || b.status === "pending");
      if (active) {
        alert("You already have an active booking! You cannot book multiple properties.");
        router.replace("/dashboard/tenant");
        return;
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (params?.id) {
      getPGById(params.id).then((data) => {
        setPg(data);
        if (data && data.rooms && data.rooms.length > 0) {
          // If no preselected room, default to the first available room
          if (!preselectedRoomId) {
             const firstAvailable = data.rooms.find(r => r.available > 0);
             if (firstAvailable) setSelectedRoomId(firstAvailable.id);
          }
        }
        setLoading(false);
      });
    }
  }, [params?.id, preselectedRoomId]);

  const selectedRoomDetails = pg?.rooms?.find(r => r.id === selectedRoomId);
  const selectedRent = selectedRoomDetails?.monthlyRent || parseInt(pg?.price.replace(/[^0-9]/g, "") || "0");
  const roomType = selectedRoomDetails?.type || "Unknown Type";
  const roomNo = selectedRoomDetails?.roomNumber || "Unknown";

  const next = () => setStep((s) => Math.min(s + 1, 4) as Step);
  const back = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const handleFinalSubmit = async () => {
    if (!pg || !userId || !aadhaarFile || !signatureDataUrl) return;

    try {
      setSubmitting(true);

      // 1. Upload Aadhaar
      const aadhaarUrl = await uploadToCloudinary(aadhaarFile, "savion/kyc");

      // 2. Upload extra doc if provided
      let extraDocUrl: string | undefined;
      if (extraFile) {
        extraDocUrl = await uploadToCloudinary(extraFile, "savion/kyc");
      }

      // 3. Upload signature (base64 → blob → Cloudinary)
      const sigBlob = await (await fetch(signatureDataUrl)).blob();
      const sigFile = new File([sigBlob], "signature.png", { type: "image/png" });
      const signatureUrl = await uploadToCloudinary(sigFile, "savion/signatures");

      // 4. Create contract first
      const contract = await createContract({
        pgId: pg.id,
        pgName: pg.name,
        pgLocation: pg.location,
        ownerId: pg.ownerId,
        tenantId: userId,
        tenantName,
        tenantAadhaarUrl: aadhaarUrl,
        tenantAadhaarNumber: aadhaarData?.aadhaarNumber || "Unknown",
        tenantDob: aadhaarData?.dob || "Unknown",
        monthlyRent: `₹${selectedRent.toLocaleString("en-IN")}/mo`,
        moveInDate,
        securityDeposit: `₹${selectedRent.toLocaleString("en-IN")}`,
        lockInMonths: 3,
        noticePeriodDays: 30,
        signatureUrl,
        status: "active",
        bookingId: "", // filled below
      });

      // 5. Create booking with contractId — omit optional fields if undefined
      const booking = await createBooking({
        tenantId: userId,
        pgId: pg.id,
        pgName: pg.name,
        ownerId: pg.ownerId,
        roomId: selectedRoomDetails?.id,
        roomNo: selectedRoomDetails?.roomNumber,
        roomType,
        moveInDate,
        amount: selectedRent,
        status: "pending", // Will be verified upon payment
        aadhaarUrl,
        ...(extraDocUrl ? { extraDocUrl } : {}),
        signatureUrl,
        contractId: contract.id,
      });

      // Send initial pending notification to Tenant
      await createNotification({
        userId,
        title: "Booking Initiated",
        message: `Your booking for Room ${roomNo} at ${pg.name} is initiated. Please complete the payment to confirm your booking.`,
        type: "booking"
      });

      // 6. Generate Payment Session
      const ownerProfile = await getUserProfile(pg.ownerId);
      const session = await createPaymentSession({
        tenantId: userId,
        ownerId: pg.ownerId,
        ownerUpiId: ownerProfile?.upiId || "unknown@upi",
        ownerName: ownerProfile?.name || "Owner",
        pgId: pg.id,
        pgName: pg.name,
        roomNo: roomType,
        bookingId: booking.id,
        contractId: contract.id,
        tenantName: tenantName,
        tenantAadhaar: aadhaarData?.aadhaarNumber || "Unknown",
        amount: selectedRent,
        month: new Date().toISOString().slice(0, 7), // e.g. "2024-06"
        type: "rent"
      });

      setPaymentSessionId(session.id);
      setContractId(contract.id);
      setStep(4);
    } catch (err) {
      console.error("Booking failed:", err);
      alert("Booking failed. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !pg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <SpeedLoader text="Preparing Booking Engine" subtext="Securing connection..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 animate-fade-in">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 animate-fade-in-down">
          <p className="text-sm text-primary font-semibold mb-1">Booking for</p>
          <h1 className="text-2xl font-extrabold">{pg.name}</h1>
          <p className="text-muted-foreground text-sm">{pg.location}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-8 animate-fade-in-up">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id || (step === 4 && contractId);
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className={`flex flex-col items-center gap-1 transition-all ${isActive ? "scale-105" : ""}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all font-bold text-sm
                    ${isDone ? "bg-green-500 text-white" : isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-200 text-slate-500"}`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? "text-primary" : "text-slate-400"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 rounded transition-all ${step > s.id ? "bg-green-400" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-8 animate-scale-in">

          {/* Step 1 — Details */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Room & Move-In Details</h2>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Select Room</label>
                {(pg.rooms && pg.rooms.length > 0) ? (
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {pg.rooms.map((room) => (
                       <option key={room.id} value={room.id} disabled={room.available === 0}>
                         Room {room.roomNumber} - {room.type} {room.available === 0 ? "(Full)" : `(${room.available} available)`}
                       </option>
                    ))}
                  </select>
                ) : (
                  <select disabled className="w-full border rounded-xl px-4 py-3 text-sm bg-slate-50 cursor-not-allowed">
                    <option>No specific rooms added by owner</option>
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Preferred Move-In Date</label>
                <Input
                  type="date"
                  value={moveInDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-sm text-orange-800">
                <strong>Monthly Rent:</strong> ₹{selectedRent.toLocaleString("en-IN")}/mo &nbsp;|&nbsp;
                <strong>Security Deposit:</strong> ₹{selectedRent.toLocaleString("en-IN")} &nbsp;|&nbsp;
                <strong>Lock-in:</strong> 3 months
              </div>
            </div>
          )}

          {/* Step 2 — KYC Documents */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Identity Verification</h2>
              <p className="text-sm text-muted-foreground">
                Required by law. Your documents are encrypted and only shared with the property owner.
              </p>

              {/* Aadhaar Verification */}
              <div>
                <AadhaarVerifier 
                  onVerified={(data) => {
                    setAadhaarFile(data.file);
                    setAadhaarData(data);
                    // Use Aadhaar name if no proper profile name exists
                    if (data.name && tenantName === "Tenant") {
                      setTenantName(data.name);
                    }
                  }}
                  onReset={() => {
                    setAadhaarFile(null);
                    setAadhaarData(null);
                  }}
                />
              </div>

              {/* Extra doc */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Additional Document <span className="text-slate-400 font-normal">(Optional — College ID, PAN, Passport)</span>
                </label>
                <label className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all
                  ${extraFile ? "border-green-400 bg-green-50" : "border-slate-300 hover:border-primary/50 hover:bg-slate-50"}`}>
                  <span className="text-xl mb-1">{extraFile ? "✅" : "📄"}</span>
                  <span className="text-sm font-medium">
                    {extraFile ? extraFile.name : "Upload additional document"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setExtraFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 3 — Signature */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Sign the Rental Agreement</h2>
              <p className="text-sm text-muted-foreground">
                By signing, you agree to the rental terms for <strong>{pg.name}</strong>. This signature will appear on your digital contract.
              </p>
              <SignaturePad
                onSave={(dataUrl) => {
                  setSignatureDataUrl(dataUrl);
                  setSignatureSaved(true);
                }}
              />
              {signatureSaved && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl text-sm font-semibold animate-fade-in-up">
                  <CheckCircle2 className="w-4 h-4" /> Signature saved! You can update it before submitting.
                </div>
              )}

              {/* Terms summary */}
              <div className="bg-slate-50 border rounded-xl p-4 text-xs text-slate-600 space-y-1.5 max-h-40 overflow-y-auto">
                <p className="font-semibold text-slate-800 mb-2">Key Terms:</p>
                <p>• Rent due by 5th of each month.</p>
                <p>• Security deposit refundable within 30 days of vacancy.</p>
                <p>• 3-month lock-in period. Early exit = 1 month rent penalty.</p>
                <p>• 30-day notice required before vacating.</p>
                <p>• No subletting without owner consent.</p>
              </div>
            </div>
          )}

          {/* Step 4 — Success (Payment Prompt) */}
          {step === 4 && contractId && paymentSessionId && (
            <div className="text-center space-y-6 py-4 animate-scale-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold mb-2">Contract Signed! ✍️</h2>
                <p className="text-muted-foreground">Your rental agreement is ready. Pay the first month's rent to gain instant access.</p>
              </div>
              <div className="bg-slate-50 border rounded-2xl p-5 text-sm text-left space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">Property</span><strong>{pg.name}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Room</span><strong>{roomNo} ({roomType})</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Monthly Rent</span><strong>₹{selectedRent.toLocaleString("en-IN")}</strong></div>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full font-bold h-12 bg-primary hover:bg-primary/90 text-white"
                  onClick={() => router.push(`/pay?session=${paymentSessionId}`)}
                >
                  Proceed to Payment →
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/contract/${contractId}`)}
                >
                  View Digital Contract
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step !== 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 ? (
                <Button variant="outline" onClick={back} className="px-6">← Back</Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button
                  onClick={next}
                  disabled={
                    (step === 1 && !moveInDate) ||
                    (step === 2 && !aadhaarFile)
                  }
                  className="px-6 font-semibold"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinalSubmit}
                  disabled={!signatureSaved || submitting}
                  className="px-8 font-bold bg-green-600 hover:bg-green-700 text-white"
                >
                  {submitting ? "Creating Contract..." : "✓ Confirm & Sign"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
