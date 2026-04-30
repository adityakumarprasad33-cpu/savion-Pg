"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPaymentById } from "@/lib/db/payments";
import type { Payment } from "@/lib/db/payments";
import Link from "next/link";
import { ArrowLeft, Printer, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeedLoader } from "@/components/ui/SpeedLoader";

function maskAadhaar(aadhaar: string) {
  if (!aadhaar) return "XXXX-XXXX-XXXX";
  const clean = aadhaar.replace(/\D/g, "");
  if (clean.length < 4) return "XXXX-XXXX-" + aadhaar;
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

function formatMonth(month: string) {
  if (!month) return month;
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      getPaymentById(params.id)
        .then(setPayment)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <SpeedLoader text="Fetching Receipt" subtext="Securing your payment details..." />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-3xl">🔍</p>
        <p className="font-semibold text-lg">Receipt not found</p>
        <Link href="/dashboard/tenant"><Button variant="outline">← Back to Dashboard</Button></Link>
      </div>
    );
  }

  const statusConfig = {
    verified: { icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, label: "Verified ✅", color: "text-green-700 bg-green-50 border-green-200" },
    submitted: { icon: <Clock className="w-5 h-5 text-yellow-600" />, label: "Pending Verification", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
    rejected: { icon: <XCircle className="w-5 h-5 text-red-600" />, label: "Rejected ❌", color: "text-red-700 bg-red-50 border-red-200" },
  };
  const s = statusConfig[payment.status];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 print:bg-white print:p-0">
      {/* Top nav — hidden on print */}
      <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/dashboard/tenant">
          <Button variant="ghost" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </Link>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Print Receipt
        </Button>
      </div>

      {/* Receipt Card */}
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden print:shadow-none print:border-0">
        {/* Header */}
        <div className="bg-primary px-8 py-6 text-primary-foreground print:bg-gray-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xl font-black tracking-tight">Savion</p>
              <p className="text-sm opacity-75 mt-0.5">PG Rental Receipt</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70">Receipt No.</p>
              <p className="font-mono font-bold text-sm">RCP-{payment.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`mx-8 mt-6 px-4 py-3 rounded-xl border flex items-center gap-3 ${s.color}`}>
          {s.icon}
          <span className="font-semibold text-sm">{s.label}</span>
        </div>

        {/* Receipt Table */}
        <div className="px-8 py-6 space-y-0">
          <div className="divide-y divide-slate-100">
            {[
              { label: "Date Submitted", value: new Date(payment.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) },
              { label: "Payer Name", value: payment.tenantName },
              { label: "Aadhaar No.", value: maskAadhaar(payment.tenantAadhaar) },
              { label: "Room No. / Type", value: payment.roomNo },
              { label: "Property (PG)", value: payment.pgName },
              { label: "Paid To (Owner)", value: payment.ownerName },
              { label: "UPI ID (Paid To)", value: payment.ownerUpiId },
              { label: "Payment Month", value: formatMonth(payment.month) },
              { label: "Payment Type", value: payment.type === "rent" ? "Monthly Rent" : "Security Deposit" },
              { label: "UTR / Reference No.", value: payment.utrNumber, mono: true },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-3 gap-4">
                <span className="text-sm text-slate-500 shrink-0 w-44">{row.label}</span>
                <span className={`text-sm font-semibold text-slate-900 text-right ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
              </div>
            ))}

            {/* Amount — highlighted */}
            <div className="flex justify-between items-center py-4 gap-4 bg-slate-50 -mx-8 px-8 mt-2">
              <span className="text-base font-bold text-slate-700">Amount Paid</span>
              <span className="text-2xl font-black text-primary">₹{payment.amount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t bg-slate-50 text-center print:bg-white">
          <p className="text-xs text-slate-400">This is a self-declared receipt submitted by the tenant. Please verify UTR with your bank if needed.</p>
          <p className="text-xs text-slate-400 mt-1">Generated by Savion PG Platform · {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
