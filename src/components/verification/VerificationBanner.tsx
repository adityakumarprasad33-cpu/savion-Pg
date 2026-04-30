"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Clock, XCircle, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { VerificationModal } from "./VerificationModal";
import { getVerificationStatus } from "@/lib/db/verifications";

export function VerificationBanner({ userId }: { userId: string }) {
  const [status, setStatus] = useState<string>("loading");
  const [showModal, setShowModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      if (!userId) return;
      try {
        const record = await getVerificationStatus(userId);
        setStatus(record?.status || "not_started");
      } catch (err) {
        setStatus("not_started");
      }
    }
    checkStatus();
  }, [userId]);

  if (status === "verified" || status === "loading") return null;

  const configMap = {
    not_started: {
      bg: "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20",
      iconBg: "bg-amber-500",
      icon: <ShieldAlert className="text-white w-6 h-6" />,
      title: "Identity Verification Required",
      desc: "To access secure bookings and legal contracts, please verify your government ID.",
      button: "Verify Now",
      accent: "text-amber-600"
    },
    pending: {
      bg: "bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border-blue-500/20",
      iconBg: "bg-blue-500",
      icon: <Clock className="text-white w-6 h-6" />,
      title: "Verification in Progress",
      desc: "Our AI is currently reviewing your documents. You'll be notified within 2 hours.",
      button: "View Status",
      accent: "text-blue-600"
    },
    rejected: {
      bg: "bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent border-red-500/20",
      iconBg: "bg-red-500",
      icon: <XCircle className="text-white w-6 h-6" />,
      title: "Verification Failed",
      desc: "We couldn't verify your document. Please ensure the photo is clear and try again.",
      button: "Re-upload ID",
      accent: "text-red-600"
    }
  };
  const config = configMap[status as keyof typeof configMap] || configMap.not_started;

  return (
    <>
    <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-md ${config.bg} p-6 mb-8 transition-all duration-500 hover:shadow-xl group`}>
      {/* Decorative Glow */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 blur-3xl rounded-full" />
      
      <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Icon with pulsing effect */}
        <div className="relative">
          <div className={`absolute inset-0 ${config.iconBg} blur-lg opacity-40 animate-pulse rounded-full`} />
          <div className={`${config.iconBg} p-4 rounded-2xl shadow-lg relative z-10`}>
            {config.icon}
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
             <h3 className="text-xl font-black text-slate-900 tracking-tight">{config.title}</h3>
             {status === 'not_started' && <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />}
          </div>
          <p className="text-slate-600 text-sm max-w-xl mb-6 font-medium leading-relaxed">
            {config.desc}
          </p>
          
          {(status === "not_started" || status === "rejected") && (
            <div className="flex flex-col gap-4 items-center md:items-start">
               <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={termsAccepted} 
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="peer w-5 h-5 rounded-md border-2 border-slate-300 text-primary focus:ring-primary/20 transition-all checked:border-primary"
                    />
                  </div>
                  <span className="text-xs text-slate-500 peer-checked:text-slate-900 transition-colors">
                    I agree to share my government ID for secure identity verification.
                  </span>
               </label>

               <button
                 onClick={() => setShowModal(true)}
                 disabled={!termsAccepted}
                 className={`group relative flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                   termsAccepted 
                    ? "bg-slate-900 text-white hover:bg-black hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:scale-95" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                 }`}
               >
                 {config.button} 
                 <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${termsAccepted ? "group-hover:translate-x-1" : ""}`} />
               </button>
            </div>
          )}

          {status === 'pending' && (
            <div className="flex items-center gap-2 text-blue-700 font-bold bg-blue-100/50 w-fit px-4 py-2 rounded-lg">
               <ShieldCheck className="w-4 h-4" />
               Awaiting Review
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Modal rendered OUTSIDE overflow-hidden container */}
    <VerificationModal 
      isOpen={showModal} 
      onClose={() => setShowModal(false)} 
      userId={userId}
      onSuccess={(finalStatus) => setStatus(finalStatus)}
    />
    </>
  );
}
