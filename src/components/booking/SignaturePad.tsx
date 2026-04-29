"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
}

export function SignaturePad({ onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasSignature(true);
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    onSave(canvas.toDataURL("image/png"));
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onSave(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("draw")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            mode === "draw"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          ✍️ Draw Signature
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            mode === "upload"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          📤 Upload Image
        </button>
      </div>

      {mode === "draw" ? (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white cursor-crosshair touch-none">
            <canvas
              ref={canvasRef}
              width={600}
              height={180}
              className="w-full"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          <p className="text-xs text-muted-foreground">Sign in the box above using your mouse or touchscreen</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveSignature}
              disabled={!hasSignature}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              ✓ Use This Signature
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="flex flex-col items-center justify-center h-[120px] border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-all">
            <span className="text-2xl mb-1">📷</span>
            <span className="text-sm text-muted-foreground">Click to upload signature image (JPG/PNG)</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      )}
    </div>
  );
}
