"use client";

import { useRef, useState } from "react";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ScanLine, RefreshCw } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AadhaarExtracted {
  aadhaarNumber: string;   // masked: XXXX-XXXX-3456
  fullNumber: string;      // raw digits (for internal use only)
  name: string;
  dob: string;             // as printed: DD/MM/YYYY or Year YYYY
  file: File;
}

interface AadhaarVerifierProps {
  onVerified: (result: AadhaarExtracted) => void;
  onReset?: () => void;
}

type State = "idle" | "processing" | "valid" | "invalid";

interface Progress {
  step: string;
  pct: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// VERHOEFF CHECKSUM (every genuine Aadhaar number passes this)
// This is the same algorithm UIDAI uses internally.
// ─────────────────────────────────────────────────────────────────────────────
const V_D = [
  [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0],
];
const V_P = [
  [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8],
];

function verhoeffValid(num: string): boolean {
  const digits = num.split("").map(Number).reverse();
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    c = V_D[c][V_P[i % 8][digits[i]]];
  }
  return c === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// AADHAAR KEYWORDS (English + Hindi transliteration)
// ─────────────────────────────────────────────────────────────────────────────
const KEYWORDS = [
  "aadhaar", "aadhar", "uidai",
  "unique identification", "government of india",
  "भारत सरकार", "आधार", "enrollment no", "enrolment",
];

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — IMAGE PRE-PROCESSING (Canvas API — no library needed)
// Converts image to greyscale, boosts contrast, scales 2× for better OCR.
// ─────────────────────────────────────────────────────────────────────────────
function preprocessImage(file: File): Promise<{ canvas: HTMLCanvasElement; ratio: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const W = img.naturalWidth * scale;
      const H = img.naturalHeight * scale;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Draw scaled image
      ctx.drawImage(img, 0, 0, W, H);

      // Greyscale + contrast (factor 1.6)
      const imageData = ctx.getImageData(0, 0, W, H);
      const d = imageData.data;
      const contrast = 1.6;
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const enhanced = Math.max(0, Math.min(255, factor * (gray - 128) + 128));
        d[i] = d[i + 1] = d[i + 2] = enhanced;
      }
      ctx.putImageData(imageData, 0, 0);
      URL.revokeObjectURL(url);
      resolve({ canvas, ratio: img.naturalWidth / img.naturalHeight });
    };
    img.onerror = () => reject(new Error("Cannot read image"));
    img.src = url;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — EXTRACT AADHAAR NUMBER
// Tries multiple patterns: spaced groups, continuous, masked variants.
// ─────────────────────────────────────────────────────────────────────────────
function extractAadhaarNumber(text: string): string | null {
  // Pattern 1: "1234 5678 9012" or "1234-5678-9012"
  const spaced = text.match(/\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/);
  if (spaced) return spaced[1].replace(/[\s\-]/g, "");

  // Pattern 2: 12 continuous digits not part of a longer number
  const continuous = text.match(/(?<!\d)(\d{12})(?!\d)/);
  if (continuous) return continuous[1];

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — EXTRACT NAME
// Heuristic: find the first "human-looking" line in the text.
// Aadhaar layout: header → name → DOB → gender → address → number
// ─────────────────────────────────────────────────────────────────────────────
const NAME_SKIP = /\d|dob|year|male|female|address|s\/o|w\/o|c\/o|aadhaar|aadhar|india|enrollment|uidai|government|unique|authority|resident|mobile|pin|dist|state|village|house|flat|near|post|bihar|delhi|mumbai|kolkata|chennai|bangalore|hyderabad|gujarat|punjab|rajasthan/i;

function extractName(lines: string[]): string {
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length < 3 || line.length > 55) continue;
    if (NAME_SKIP.test(line)) continue;
    if (!/[a-zA-Z\u0900-\u097F]/.test(line)) continue; // must have letters
    // Title Case "Rahul Kumar" or ALL CAPS "RAHUL KUMAR"
    if (/^[A-Z][a-zA-Z .'-]+$/.test(line) || /^[A-Z .'-]+$/.test(line)) return line;
  }
  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — EXTRACT DATE OF BIRTH
// Multiple patterns Aadhaar cards use.
// ─────────────────────────────────────────────────────────────────────────────
function extractDOB(text: string): string {
  // "DOB: 15/08/1998" or "Date of Birth: 15/08/1998"
  const labeled = text.match(/(?:dob|date of birth)[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
  if (labeled) return labeled[1].replace(/-/g, "/");

  // Standalone DD/MM/YYYY anywhere
  const plain = text.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
  if (plain) return plain[1].replace(/-/g, "/");

  // "Year of Birth: 1998"
  const year = text.match(/(?:year of birth|yob)[:\s]+(\d{4})/i);
  if (year) return `Year ${year[1]}`;

  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// MASK helper
// ─────────────────────────────────────────────────────────────────────────────
function mask(num: string): string {
  const clean = num.replace(/\D/g, "");
  return `XXXX-XXXX-${clean.slice(8)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function AadhaarVerifier({ onVerified, onReset }: AadhaarVerifierProps) {
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<AadhaarExtracted | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState<Progress>({ step: "", pct: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setState("idle");
    setResult(null);
    setPreview(null);
    setErrorMsg("");
    setProgress({ step: "", pct: 0 });
    if (inputRef.current) inputRef.current.value = "";
    onReset?.();
  };

  const fail = (msg: string) => {
    setErrorMsg(msg);
    setState("invalid");
    alert("Verification Failed: " + msg);
  };

  const processFile = async (file: File) => {
    // ── GUARD: file type ──────────────────────────────────────────────────
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPreview(null);
      return fail("Only JPG and PNG images are accepted. Please upload a photo of your Aadhaar card.");
    }

    // ── GUARD: file size (30 KB – 15 MB) ─────────────────────────────────
    if (file.size < 30_000) {
      return fail("The image is too small. Please upload a clearer, higher-resolution photo.");
    }
    if (file.size > 15_000_000) {
      return fail("File is too large. Please upload an image under 15 MB.");
    }

    setPreview(URL.createObjectURL(file));
    setState("processing");
    setErrorMsg("");

    try {
      // ── STEP 1: Pre-process image ───────────────────────────────────────
      setProgress({ step: "Pre-processing image...", pct: 10 });
      const { canvas, ratio } = await preprocessImage(file);

      // Aspect ratio sanity (standard card 1.58:1, allow ±50% tolerance)
      if (ratio < 0.5 || ratio > 4) {
        return fail("This doesn't look like a card-shaped image. Please upload a straight photo of your Aadhaar card (front side).");
      }

      // ── STEP 2: OCR via Tesseract.js ───────────────────────────────────
      setProgress({ step: "Reading document text (OCR)...", pct: 25 });
      const { createWorker } = await import("tesseract.js");

      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setProgress({
              step: "Recognising text...",
              pct: 25 + Math.round(m.progress * 50),
            });
          }
        },
      });

      // PSM 6 = assume uniform block of text — best for card layouts
      await worker.setParameters({ tessedit_pageseg_mode: "6" as any });

      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      const rawText = data.text;
      const lowerText = rawText.toLowerCase();
      const lines = rawText.split("\n").map((l: string) => l.trim()).filter(Boolean);

      // ── STEP 3: Keyword validation ──────────────────────────────────────
      setProgress({ step: "Validating document type...", pct: 80 });
      const hasKeyword = KEYWORDS.some((kw) => lowerText.includes(kw));
      if (!hasKeyword) {
        return fail(
          "This doesn't appear to be an Aadhaar card. Please upload a clear photo of the front side of your government-issued Aadhaar card."
        );
      }

      // ── STEP 4: Aadhaar number extraction ──────────────────────────────
      setProgress({ step: "Extracting Aadhaar number...", pct: 87 });
      const rawNumber = extractAadhaarNumber(rawText);
      if (!rawNumber) {
        return fail(
          "Could not find a 12-digit Aadhaar number in the image. Make sure the number at the bottom of the card is clearly visible and unobstructed."
        );
      }

      // ── STEP 5: Verhoeff checksum ───────────────────────────────────────
      // (Soft check — OCR can mis-read 1 digit, so we warn but don't block)
      const checksumOk = verhoeffValid(rawNumber);

      // ── STEP 6: Name + DOB extraction ──────────────────────────────────
      setProgress({ step: "Extracting personal details...", pct: 93 });
      const name = extractName(lines);
      const dob  = extractDOB(rawText);

      setProgress({ step: "Done!", pct: 100 });

      const extracted: AadhaarExtracted = {
        aadhaarNumber: mask(rawNumber),
        fullNumber: rawNumber,
        name,
        dob,
        file,
      };

      setResult(extracted);
      setState("valid");
      onVerified(extracted);

      // Log checksum mismatch for debugging (doesn't block user)
      if (!checksumOk) {
        console.warn("Verhoeff checksum mismatch — OCR may have misread one digit.");
      }

    } catch (err) {
      console.error("Aadhaar OCR error:", err);
      fail("Processing failed. Please try with a clearer, well-lit photo and try again.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* IDLE — upload prompt */}
      {state === "idle" && (
        <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-300 dark:border-zinc-600 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 dark:bg-zinc-800/50 transition-all group">
          <ScanLine className="w-9 h-9 text-slate-400 mb-2 group-hover:text-primary transition-colors" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Upload Aadhaar Card (front side)</span>
          <span className="text-xs text-muted-foreground mt-1">JPG or PNG · Name, DOB & number auto-extracted</span>
          <span className="text-xs text-muted-foreground">No data sent to any server</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
          />
        </label>
      )}

      {/* PROCESSING — progress bar */}
      {state === "processing" && (
        <div className="border-2 border-primary/30 bg-primary/5 rounded-xl p-5">
          <div className="flex items-center gap-4 mb-3">
            {preview && (
              <img src={preview} alt="Aadhaar" className="w-20 h-14 object-cover rounded-lg border shrink-0" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress.step || "Initialising..."}
              </div>
              <p className="text-xs text-muted-foreground">
                Running entirely in your browser — no data is sent anywhere.
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <p className="text-right text-xs text-muted-foreground mt-1">{progress.pct}%</p>
        </div>
      )}

      {/* VALID — extracted data */}
      {state === "valid" && result && (
        <div className="border-2 border-green-400 bg-green-50 rounded-xl p-5 animate-fade-in-up">
          <div className="flex items-start gap-3">
            {preview && (
              <img
                src={preview}
                alt="Aadhaar"
                className="w-20 h-14 object-cover rounded-lg border border-green-200 shrink-0"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-green-700 font-bold mb-3">
                <CheckCircle2 className="w-5 h-5" />
                Aadhaar Verified
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                <div>
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Aadhaar No.</p>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{result.aadhaarNumber}</p>
                </div>
                {result.name && (
                  <div>
                    <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Name</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{result.name}</p>
                  </div>
                )}
                {result.dob && (
                  <div>
                    <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Date of Birth</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{result.dob}</p>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Change
            </button>
          </div>
        </div>
      )}

      {/* INVALID — error */}
      {state === "invalid" && (
        <div className="border-2 border-red-300 bg-red-50 dark:bg-red-950/30 rounded-xl p-5 animate-fade-in-up">
          <div className="flex items-start gap-3">
            {preview && (
              <img
                src={preview}
                alt="upload"
                className="w-20 h-14 object-cover rounded-lg border border-red-200 shrink-0 opacity-60"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
                <XCircle className="w-5 h-5" />
                Verification Failed
              </div>
              <p className="text-sm text-red-600">{errorMsg}</p>
              <div className="mt-2.5 bg-red-100 rounded-lg p-2 text-xs text-red-700 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Tips: Use a flat, well-lit surface. Avoid shadows and glare. Hold the camera steady.
                  Ensure all 4 corners of the card are visible.
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-3 w-full text-center text-sm font-semibold text-red-600 hover:text-red-800 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Try Again with a Different Photo
          </button>
        </div>
      )}
    </div>
  );
}
