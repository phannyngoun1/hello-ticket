/**
 * Real-time ticket reader using device webcam. Decodes QR codes and calls scan API.
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@truths/ui";
import { CameraOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { scanTicket, type ScanTicketResponse } from "../ai/scan-ticket";
import JsQR from "jsqr";

export interface WebcamTicketReaderProps {
  eventId: string;
  onScanSuccess?: (result: ScanTicketResponse) => void;
  onScanError?: (message: string) => void;
  onClose?: () => void;
  className?: string;
  /** Start camera as soon as the component mounts */
  autoStart?: boolean;
}

export function WebcamTicketReader({
  eventId,
  onScanSuccess,
  onScanError,
  onClose,
  className,
  autoStart = false,
}: WebcamTicketReaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "success" | "error">("idle");
  const [lastResult, setLastResult] = useState<ScanTicketResponse | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);
  const scanPauseRef = useRef(false);
  const rafRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("scanning");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not access camera";
      setError(msg);
      setStatus("error");
      onScanError?.(msg);
    }
  }, [onScanError]);

  useEffect(() => {
    if (autoStart && status === "idle") startCamera();
  }, [autoStart, status, startCamera]);

  const handleScan = useCallback(
    async (code: string) => {
      if (scanPauseRef.current) return;
      scanPauseRef.current = true;
      setStatus("idle");
      try {
        const result = await scanTicket(eventId, code);
        setLastResult(result);
        setLastErrorMessage(null);
        setStatus("success");
        onScanSuccess?.(result);
        setTimeout(() => {
          scanPauseRef.current = false;
          setStatus("scanning");
        }, 2000);
      } catch (e: unknown) {
        const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Scan failed";
        setLastErrorMessage(msg);
        setStatus("error");
        onScanError?.(msg);
        setTimeout(() => {
          scanPauseRef.current = false;
          setStatus("scanning");
        }, 2000);
      }
    },
    [eventId, onScanSuccess, onScanError]
  );

  useEffect(() => {
    if (status !== "scanning" || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function tick() {
      if (scanPauseRef.current || !streamRef.current || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = JsQR(imageData.data, imageData.width, imageData.height);
      if (result?.data) {
        handleScan(result.data);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, handleScan]);

  return (
    <div className={className}>
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-lg mx-auto">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: status === "scanning" || status === "starting" ? "block" : "none" }}
        />
        <canvas ref={canvasRef} className="hidden" />
        {status === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        )}
        {status === "success" && lastResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
            <p className="font-medium">Ticket scanned</p>
            <p className="text-sm text-gray-300">
              {[lastResult.section_name, lastResult.row_name, lastResult.seat_number].filter(Boolean).join(" · ") || lastResult.ticket_number}
            </p>
          </div>
        )}
        {status === "error" && lastErrorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
            <XCircle className="h-12 w-12 text-red-500 mb-2" />
            <p className="text-sm text-center">{lastErrorMessage}</p>
          </div>
        )}
        {error && status === "error" && !lastErrorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
            <CameraOff className="h-12 w-12 text-red-500 mb-2" />
            <p className="text-sm text-center">{error}</p>
          </div>
        )}
        {status === "scanning" && (
          <div className="absolute inset-0 pointer-events-none border-4 border-primary/50 rounded-lg" style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.2)" }} />
        )}
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {status === "idle" && (
          <Button type="button" onClick={startCamera} className="gap-2">
            <CameraOff className="h-4 w-4" />
            Start camera
          </Button>
        )}
        {(status === "starting" || status === "scanning") && (
          <Button type="button" variant="outline" onClick={stopCamera}>
            Stop camera
          </Button>
        )}
        {(status === "success" || status === "error") && (
          <Button type="button" variant="outline" onClick={() => { setStatus("scanning"); setLastResult(null); setLastErrorMessage(null); }}>
            Scan another
          </Button>
        )}
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
