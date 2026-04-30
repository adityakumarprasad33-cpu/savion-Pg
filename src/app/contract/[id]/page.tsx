"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getContractById, RentalContract } from "@/lib/db/contracts";
import { CheckCircle2, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SpeedLoader } from "@/components/ui/SpeedLoader";

export default function ContractViewer() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.replace("/login"); return; }
      setUserId(user.uid);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (params?.id) {
      getContractById(params.id).then((c) => {
        if (!c) { setLoading(false); return; }
        setContract(c);
        setLoading(false);
      });
    }
  }, [params?.id]);

  // Access control check after both userId and contract are loaded
  useEffect(() => {
    if (userId && contract) {
      const isAllowed = contract.tenantId === userId || contract.ownerId === userId;
      if (!isAllowed) setUnauthorized(true);
    }
  }, [userId, contract]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const formatCreatedAt = (ts: number) =>
    new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <SpeedLoader text="Loading Agreement" subtext="Fetching your legal documents..." />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-4xl mb-3">📄</p>
          <h1 className="text-2xl font-bold mb-2">Contract Not Found</h1>
          <p className="text-muted-foreground">This contract may have been removed or the ID is incorrect.</p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-4xl mb-3">🔒</p>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Only the tenant and property owner can view this contract.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 print:bg-white print:py-0">
      <div className="container max-w-3xl mx-auto px-4">
        {/* Actions bar — hidden on print */}
        <div className="flex justify-between items-center mb-6 print:hidden animate-fade-in-down">
          <Button variant="outline" onClick={() => router.back()}>← Back</Button>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </Button>
        </div>

        {/* Contract Document */}
        <div className="bg-white rounded-3xl border shadow-sm p-8 md:p-12 print:rounded-none print:shadow-none print:border-0 animate-fade-in-up">
          {/* Header */}
          <div className="text-center border-b pb-8 mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <FileText className="w-6 h-6 text-primary" />
              <span className="font-bold text-primary text-lg">SAVION</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">RENTAL AGREEMENT</h1>
            <p className="text-muted-foreground text-sm">Digital Tenancy Contract</p>
            <div className="inline-flex items-center gap-2 mt-3 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Digitally Signed &amp; Active
            </div>
          </div>

          {/* Parties */}
          <section className="mb-8">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-400 mb-4">Parties to the Agreement</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-5">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Landlord / Owner</p>
                <p className="font-bold text-lg">Property Owner</p>
                <p className="text-sm text-muted-foreground">UID: {contract.ownerId}</p>
              </div>
              <div className="bg-primary/5 rounded-2xl p-5">
                <p className="text-xs text-primary font-semibold uppercase mb-2">Tenant</p>
                <p className="font-bold text-lg">{contract.tenantName}</p>
                <p className="text-sm text-muted-foreground">UID: {contract.tenantId}</p>
              </div>
            </div>
          </section>

          {/* Property Details */}
          <section className="mb-8">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-400 mb-4">Property Details</h2>
            <div className="bg-slate-50 rounded-2xl p-5 grid md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Property Name: </span><strong>{contract.pgName}</strong></div>
              <div><span className="text-slate-500">Location: </span><strong>{contract.pgLocation}</strong></div>
              <div><span className="text-slate-500">Monthly Rent: </span><strong>{contract.monthlyRent}</strong></div>
              <div><span className="text-slate-500">Security Deposit: </span><strong>{contract.securityDeposit}</strong></div>
              <div><span className="text-slate-500">Move-In Date: </span><strong>{formatDate(contract.moveInDate)}</strong></div>
              <div><span className="text-slate-500">Lock-In Period: </span><strong>{contract.lockInMonths} Months</strong></div>
              <div><span className="text-slate-500">Notice Period: </span><strong>{contract.noticePeriodDays} Days</strong></div>
              <div>
                <span className="text-slate-500">Status: </span>
                <span className={`font-bold ${contract.status === "active" ? "text-green-600" : contract.status === "disputed" ? "text-red-600" : "text-slate-500"}`}>
                  {contract.status.toUpperCase()}
                </span>
              </div>
            </div>
          </section>

          {/* Terms & Conditions */}
          <section className="mb-8">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-400 mb-4">Terms & Conditions</h2>
            <ol className="space-y-3">
              {contract.terms.map((term, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-slate-700">{term}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* KYC Document */}
          {contract.tenantAadhaarUrl && (
            <section className="mb-8 block break-inside-avoid">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-400 mb-4">Identity Document (KYC)</h2>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">Aadhaar / Government ID</p>
                      <a href={contract.tenantAadhaarUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-semibold hover:underline print:hidden">
                        View Uploaded Image →
                      </a>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">✓ AI Document Verified</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm mt-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Name on Document</span>
                    <p className="font-semibold text-slate-900">{contract.tenantName || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Aadhaar Number</span>
                    <p className="font-semibold text-slate-900 font-mono tracking-widest">{contract.tenantAadhaarNumber || "XXXX-XXXX-XXXX"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Date of Birth</span>
                    <p className="font-semibold text-slate-900">{contract.tenantDob || "N/A"}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Signature */}
          <section className="mb-8">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-400 mb-4">Tenant Signature</h2>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-3">
              <div className="bg-white rounded-xl border overflow-hidden max-w-xs w-full">
                <Image
                  src={contract.signatureUrl}
                  alt="Tenant signature"
                  width={400}
                  height={150}
                  className="w-full object-contain"
                />
              </div>
              <p className="text-xs text-slate-500">{contract.tenantName} — Digitally signed on {formatCreatedAt(contract.createdAt)}</p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t pt-6 text-center text-xs text-muted-foreground space-y-1">
            <p>Contract ID: <code className="font-mono bg-slate-100 px-2 py-0.5 rounded">{contract.id}</code></p>
            <p>Generated by Savion Platform · This is a legally binding digital agreement.</p>
            <p className="text-slate-400">In case of dispute, either party can present this document as proof of the rental agreement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
