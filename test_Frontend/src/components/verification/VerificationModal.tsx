"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Upload, Camera, CheckCircle2, Loader2, FileText, ShieldCheck, AlertTriangle, ChevronRight, Scan } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { submitVerification } from "@/lib/db/verifications";
import { auth } from "@/lib/firebase/client";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (status: string) => void;
}

// Load face-api models from CDN
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model";

async function loadFaceModels() {
  const faceapi = await import("face-api.js");
  if (!(faceapi.nets.ssdMobilenetv1 as any).isLoaded) {
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  }
  if (!(faceapi.nets.faceLandmark68Net as any).isLoaded) {
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  }
  if (!(faceapi.nets.faceRecognitionNet as any).isLoaded) {
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  }
  return faceapi;
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

const ID_TYPES = ["Aadhaar", "Driving License", "Passport"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 30 * 1024; // 30KB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function VerificationModal({ isOpen, onClose, userId, onSuccess }: ModalProps) {
  const [step, setStep] = useState(1);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [idType, setIdType] = useState<typeof ID_TYPES[number]>("Aadhaar");
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchError, setMatchError] = useState("");
  const [progressText, setProgressText] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face models when modal opens
  useEffect(() => {
    if (isOpen && !modelsLoaded) {
      loadFaceModels().then(() => setModelsLoaded(true)).catch(console.error);
    }
  }, [isOpen, modelsLoaded]);

  // Cleanup previews
  useEffect(() => {
    return () => {
      if (idPreview) URL.revokeObjectURL(idPreview);
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [idPreview, selfiePreview]);

  if (!isOpen) return null;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return "Only JPG, PNG, or WebP images are accepted.";
    if (file.size < MIN_FILE_SIZE) return "Image is too small. Please use a clearer photo.";
    if (file.size > MAX_FILE_SIZE) return "File exceeds 10MB limit. Please compress and retry.";
    return null;
  };

  const handleIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { alert(err); return; }
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
  };

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { alert(err); return; }
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  };

  const runFaceMatch = async () => {
    if (!idFile || !selfieFile) return;
    setIsProcessing(true);
    setMatchError("");
    setMatchScore(null);
    setStep(3);

    try {
      setProgressText("Loading AI face detection models...");
      setProgressPct(10);
      const faceapi = await loadFaceModels();

      setProgressText("Analyzing ID document face...");
      setProgressPct(30);
      const idImg = await fileToImage(idFile);
      const idDetection = await faceapi.detectSingleFace(idImg).withFaceLandmarks().withFaceDescriptor();

      if (!idDetection) {
        setMatchError("No face detected on ID card. Please upload a clearer photo showing the face on your ID.");
        setIsProcessing(false);
        return;
      }

      setProgressText("Analyzing selfie face...");
      setProgressPct(55);
      const selfieImg = await fileToImage(selfieFile);
      const selfieDetection = await faceapi.detectSingleFace(selfieImg).withFaceLandmarks().withFaceDescriptor();

      if (!selfieDetection) {
        setMatchError("No face detected in selfie. Please take a clear, well-lit photo of your face.");
        setIsProcessing(false);
        return;
      }

      setProgressText("Comparing face embeddings...");
      setProgressPct(75);
      const distance = faceapi.euclideanDistance(idDetection.descriptor, selfieDetection.descriptor);
      // Convert distance to percentage (distance 0 = 100% match, distance 1.0+ = 0%)
      const score = Math.max(0, Math.round((1 - distance) * 100));
      setMatchScore(score);
      setProgressPct(100);

      if (score >= 20) {
        setProgressText("Face match successful! Uploading documents...");
        await handleUpload(score);
      } else {
        setProgressText("");
        setMatchError(`Face match score: ${score}%. Minimum required: 20%. Please ensure both photos clearly show the same person.`);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Face matching error:", err);
      setMatchError("Face analysis failed. Please try with clearer, well-lit photos.");
      setIsProcessing(false);
    }
  };

  const handleUpload = async (faceScore: number) => {
    if (!idFile) return;
    try {
      setProgressText("Uploading ID document...");
      setProgressPct(82);
      const idUrl = await uploadToCloudinary(idFile, "verifications/ids");

      let selfieUrl = "";
      if (selfieFile) {
        setProgressText("Uploading selfie...");
        setProgressPct(90);
        selfieUrl = await uploadToCloudinary(selfieFile, "verifications/selfies");
      }

      setProgressText("Submitting verification record...");
      setProgressPct(95);
      const finalStatus = faceScore >= 20 ? "verified" : "pending";
      
      await submitVerification({
        id: userId,
        userEmail: auth.currentUser?.email || "anonymous@savion.app",
        fullName: auth.currentUser?.displayName || "Savion User",
        idType,
        idUrl,
        selfieUrl,
        status: finalStatus,
        faceMatchScore: faceScore,
        mlConfidence: faceScore,
      });

      // Auto-update user profile to verified
      if (finalStatus === "verified") {
        const { updateUserProfile } = await import("@/lib/db/users");
        await updateUserProfile(userId, { isVerified: true });
      }

      setProgressPct(100);
      setProgressText("Done!");
      setStep(4);
      onSuccess(finalStatus);
    } catch (err) {
      console.error("Upload failed:", err instanceof Error ? err.message : err);
      setMatchError("Upload failed. Please check your connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setIdFile(null);
    setSelfieFile(null);
    setIdPreview(null);
    setSelfiePreview(null);
    setMatchScore(null);
    setMatchError("");
    setProgressText("");
    setProgressPct(0);
  };

  const stepLabels = ["Select & Upload ID", "Upload Selfie", "Face Analysis", "Complete"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl dark:shadow-zinc-900/60 w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Identity Verification</h2>
              <p className="text-[10px] text-slate-400">Step {Math.min(step, 4)} of 4</p>
            </div>
          </div>
          <button onClick={() => { resetModal(); onClose(); }} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-1.5">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${i + 1 <= step ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-slate-100 dark:bg-zinc-800"}`} />
                <p className={`text-[9px] mt-1 font-semibold ${i + 1 <= step ? "text-blue-600" : "text-slate-300"}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* STEP 1: ID Type + Upload */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Select ID Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {ID_TYPES.map((t) => (
                    <button key={t} onClick={() => setIdType(t)}
                      className={`text-xs p-2.5 rounded-xl border-2 transition-all font-semibold ${idType === t
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:shadow-slate-900/50 shadow-blue-100"
                        : "border-slate-100 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:border-zinc-700"}`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Upload {idType} (Front Side)</p>
                <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:bg-zinc-800/50 hover:border-blue-300 transition-all group overflow-hidden">
                  {idPreview ? (
                    <div className="relative w-full h-full">
                      <img src={idPreview} alt="ID" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300 mb-1 group-hover:text-blue-400 transition-colors" />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Click to upload image</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP · 30KB – 10MB</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleIdSelect} />
                </label>
              </div>

              <button onClick={() => setStep(2)} disabled={!idFile}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg dark:shadow-zinc-900/50 shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Selfie Upload */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-800">Selfie is required for face verification</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">We will compare your selfie with the face on your ID. Ensure good lighting and a clear view of your face.</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Take or Upload a Selfie</p>
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:bg-zinc-800/50 hover:border-blue-300 transition-all group overflow-hidden">
                  {selfiePreview ? (
                    <div className="relative w-full h-full">
                      <img src={selfiePreview} alt="Selfie" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-slate-300 mb-2 group-hover:text-blue-400 transition-colors" />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Click to take or upload selfie</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Clear, front-facing photo</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" capture="user" onChange={handleSelfieSelect} />
                </label>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border-2 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-50 dark:bg-zinc-800/50 transition-all">Back</button>
                <button onClick={runFaceMatch} disabled={!selfieFile || isProcessing}
                  className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg dark:shadow-zinc-900/50 shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
                >
                  <Scan className="w-4 h-4" /> Verify & Submit
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Face Analysis */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex gap-3 items-center justify-center">
                {idPreview && <img src={idPreview} alt="ID" className="w-20 h-20 object-cover rounded-xl border-2 border-blue-200" />}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${matchError ? "bg-red-100" : matchScore && matchScore >= 20 ? "bg-green-100" : "bg-blue-100"}`}>
                    {isProcessing ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : matchError ? <X className="w-5 h-5 text-red-600" /> : <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  </div>
                  {matchScore !== null && !matchError && (
                    <span className={`text-lg font-black mt-1 ${matchScore >= 20 ? "text-green-600" : "text-red-600"}`}>{matchScore}%</span>
                  )}
                </div>
                {selfiePreview && <img src={selfiePreview} alt="Selfie" className="w-20 h-20 object-cover rounded-xl border-2 border-blue-200" />}
              </div>

              {isProcessing && (
                <div>
                  <p className="text-center text-sm font-semibold text-blue-700 mb-2">{progressText}</p>
                  <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="text-right text-[10px] text-slate-400 mt-1">{progressPct}%</p>
                </div>
              )}

              {matchError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-red-700 mb-1">Verification Failed</p>
                  <p className="text-xs text-red-600">{matchError}</p>
                  <button onClick={() => { setStep(2); setMatchError(""); setMatchScore(null); }}
                    className="mt-3 px-6 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div className="text-center py-6 animate-in zoom-in-50 duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg dark:shadow-zinc-900/50 shadow-green-100">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Submitted Successfully!</h3>
              {matchScore !== null && (
                <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-bold text-green-700">Face Match: {matchScore}%</span>
                </div>
              )}
              <p className="text-slate-500 dark:text-slate-400 text-sm px-6 mb-6">
                {matchScore !== null && matchScore >= 20
                  ? "Your identity has been successfully verified! You can now book rooms freely."
                  : "Your document and selfie have been submitted for manual review. You will be notified soon."}
              </p>
              <button onClick={() => { resetModal(); onClose(); }}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors">
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
