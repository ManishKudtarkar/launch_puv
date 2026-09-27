"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, type Event as ApiEvent, type AttendanceItem, type ScanResult } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Users,
  Clock,
  MapPin,
  Calendar,
  X,
  Upload,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Check,
} from "lucide-react";
import jsQR from "jsqr";

function playSuccessBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // AudioContext not allowed or not supported
  }
}

export default function VolunteerScannerPage() {
  const user = useAuthStore((s) => s.user);
  const [assignedEvents, setAssignedEvents] = useState<ApiEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState("");

  // Attendance data
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([]);
  const [metrics, setMetrics] = useState<{
    totalRegistered: number;
    totalCheckedIn: number;
    pendingCheckIn: number;
    checkedInPercentage: number;
    scannedByMe: number;
  }>({
    totalRegistered: 0,
    totalCheckedIn: 0,
    pendingCheckIn: 0,
    checkedInPercentage: 0,
    scannedByMe: 0,
  });
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [submittingScan, setSubmittingScan] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // Filter & search for attendance table
  const [searchQuery, setSearchQuery] = useState("");
  const [tableFilter, setTableFilter] = useState<"all" | "checked_in" | "pending">("all");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastScannedTokenRef = useRef<string>("");
  const lastScanTimestampRef = useRef<number>(0);

  // 1. Fetch assigned volunteer events
  useEffect(() => {
    if (!user) return;
    setLoadingEvents(true);
    setError("");

    // If event admin, also allow scanning their created events
    const fetchEvents = async () => {
      try {
        const volunteerEvents = await api.volunteers.myEvents();
        if (volunteerEvents.length > 0) {
          setAssignedEvents(volunteerEvents);
          setSelectedEventId(volunteerEvents[0].id);
        } else if (user.role === "EVENT_ADMIN") {
          const myCreated = await api.events.mine();
          setAssignedEvents(myCreated);
          if (myCreated.length > 0) {
            setSelectedEventId(myCreated[0].id);
          }
        }
      } catch (e) {
        setError(getApiErrorMessage(e));
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [user]);

  // 2. Fetch live attendance when selected event changes
  const loadAttendance = async (eventId: string) => {
    if (!eventId) return;
    setLoadingAttendance(true);
    try {
      const res = await api.events.attendance.list(eventId);
      setAttendanceList(res.registrations);
      setMetrics(res.metrics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadAttendance(selectedEventId);
    }
  }, [selectedEventId]);

  // 3. Camera scanning lifecycle
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (scannerActive && selectedEventId) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            requestScanFrame();
          }
        })
        .catch((err) => {
          console.error("Camera access failed:", err);
          setScanError("Unable to access device camera. You can use manual code input or file upload.");
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [scannerActive, facingMode, selectedEventId]);

  const requestScanFrame = () => {
    if (!scannerActive) return;

    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          const rawToken = code.data.trim();
          const now = Date.now();
          // Avoid scanning same code repeatedly within 3 seconds
          if (rawToken !== lastScannedTokenRef.current || now - lastScanTimestampRef.current > 3000) {
            lastScannedTokenRef.current = rawToken;
            lastScanTimestampRef.current = now;
            handleProcessScan(rawToken);
          }
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(requestScanFrame);
  };

  // 4. Process scanned ticket
  const handleProcessScan = async (ticketToken: string) => {
    if (!selectedEventId || submittingScan) return;
    setSubmittingScan(true);
    setScanError("");
    setScanResult(null);

    try {
      const result = await api.events.attendance.scan(selectedEventId, ticketToken);
      setScanResult(result);
      playSuccessBeep();
      loadAttendance(selectedEventId);
    } catch (err) {
      setScanError(getApiErrorMessage(err));
    } finally {
      setSubmittingScan(false);
    }
  };

  // 5. Handle manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessScan(manualCode.trim());
  };

  // 6. Handle file upload scan
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleProcessScan(code.data.trim());
        } else {
          setScanError("No valid QR code detected in the selected image.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const selectedEvent = assignedEvents.find((e) => e.id === selectedEventId);

  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.attendeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.attendeeEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.ticketToken || "").toLowerCase().includes(searchQuery.toLowerCase());

      const isChecked = item.checkedInAt !== null;
      const matchFilter =
        tableFilter === "all" ||
        (tableFilter === "checked_in" && isChecked) ||
        (tableFilter === "pending" && !isChecked);

      return matchSearch && matchFilter;
    });
  }, [attendanceList, searchQuery, tableFilter]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-[0.68rem] font-bold tracking-[0.14em] uppercase font-[family-name:var(--font-mono)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Volunteer Portal
            </span>
          </div>
          <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            Event Attendance Scanner
            <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]">
              {" "}.
            </span>
          </h1>
          <p className="mt-1.5 text-[0.86rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Scan QR tickets, verify student registrations and track live attendee check-ins.
          </p>
        </div>

        {/* Event Selector Dropdown */}
        {assignedEvents.length > 0 && (
          <div className="w-full md:w-auto flex items-center gap-3">
            <label className="text-[0.76rem] font-bold text-[var(--col-dim)] uppercase font-[family-name:var(--font-mono)] whitespace-nowrap">
              Active Event:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setScanResult(null);
                setScanError("");
              }}
              className="px-4 py-2.5 rounded-[14px] bg-[var(--surface)] border border-[var(--line-soft)] text-[0.82rem] font-semibold text-[var(--col-primary)] shadow-sm outline-none cursor-pointer font-[family-name:var(--font-display)]"
            >
              {assignedEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadingEvents ? (
        <div className="py-12 text-center text-[0.86rem] text-[var(--col-secondary)]">
          Loading assigned volunteer events...
        </div>
      ) : assignedEvents.length === 0 ? (
        <Squircle
          cornerRadius={24}
          cornerSmoothing={1}
          className="p-10 text-center bg-[var(--surface)] border border-[var(--line-soft)] shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-[1.05rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            No Volunteer Assignments Found
          </h3>
          <p className="text-[0.82rem] text-[var(--col-secondary)] mt-1 max-w-[440px] mx-auto font-[family-name:var(--font-ui)]">
            You are not currently assigned as a volunteer for any active events. Once an Event Admin adds your ID/email as an event volunteer, scanner tools will appear here.
          </p>
          <Link
            href="/student"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-[var(--col-primary)] text-white text-[0.78rem] font-bold shadow-sm hover:opacity-90 transition-all"
          >
            Return to Dashboard
          </Link>
        </Squircle>
      ) : (
        <>
          {/* Active Event Banner & Metrics */}
          {selectedEvent && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Squircle
                cornerRadius={20}
                cornerSmoothing={1}
                className="p-4 bg-[var(--surface)]/90 border border-[var(--line-soft)] shadow-sm md:col-span-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-[0.72rem] text-[var(--accent)] font-bold uppercase font-[family-name:var(--font-mono)]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(selectedEvent.eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                    {selectedEvent.venue && (
                      <>
                        <span>•</span>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{selectedEvent.venue}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-[1.15rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mt-0.5">
                    {selectedEvent.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setScannerActive((prev) => !prev)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[0.8rem] font-bold shadow-md transition-all cursor-pointer ${
                      scannerActive
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-[var(--accent)] hover:opacity-90 text-white"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>{scannerActive ? "Stop Camera" : "Open Camera Scanner"}</span>
                  </button>
                </div>
              </Squircle>

              {/* 4 Stat Cards */}
              <Squircle cornerRadius={18} cornerSmoothing={1} className="p-4 bg-[var(--surface)] border border-[var(--line-soft)] shadow-sm">
                <span className="text-[0.7rem] font-bold uppercase text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Total Registered</span>
                <p className="text-[1.6rem] font-black text-[var(--col-primary)] mt-1 font-[family-name:var(--font-mono)]">
                  {metrics.totalRegistered}
                </p>
              </Squircle>

              <Squircle cornerRadius={18} cornerSmoothing={1} className="p-4 bg-[var(--surface)] border border-[var(--line-soft)] shadow-sm">
                <span className="text-[0.7rem] font-bold uppercase text-emerald-600 font-[family-name:var(--font-mono)]">Checked In</span>
                <p className="text-[1.6rem] font-black text-emerald-600 mt-1 font-[family-name:var(--font-mono)]">
                  {metrics.totalCheckedIn} <span className="text-[0.8rem] font-medium text-[var(--col-secondary)]">({metrics.checkedInPercentage}%)</span>
                </p>
              </Squircle>

              <Squircle cornerRadius={18} cornerSmoothing={1} className="p-4 bg-[var(--surface)] border border-[var(--line-soft)] shadow-sm">
                <span className="text-[0.7rem] font-bold uppercase text-amber-600 font-[family-name:var(--font-mono)]">Pending Check-in</span>
                <p className="text-[1.6rem] font-black text-amber-600 mt-1 font-[family-name:var(--font-mono)]">
                  {metrics.pendingCheckIn}
                </p>
              </Squircle>

              <Squircle cornerRadius={18} cornerSmoothing={1} className="p-4 bg-[var(--surface)] border border-[var(--line-soft)] shadow-sm">
                <span className="text-[0.7rem] font-bold uppercase text-[var(--accent)] font-[family-name:var(--font-mono)]">Scanned By You</span>
                <p className="text-[1.6rem] font-black text-[var(--accent)] mt-1 font-[family-name:var(--font-mono)]">
                  {metrics.scannedByMe}
                </p>
              </Squircle>
            </div>
          )}

          {/* Scanner & Manual Verification Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Camera & Manual Input (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Camera Scanner Box */}
              <Squircle
                cornerRadius={24}
                cornerSmoothing={1}
                className="p-5 bg-[var(--surface)] border border-[var(--line-soft)] shadow-md overflow-hidden relative"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line-soft)] mb-4">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[var(--accent)]" />
                    <h3 className="text-[0.92rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                      Camera QR Scanner
                    </h3>
                  </div>
                  {scannerActive && (
                    <button
                      type="button"
                      onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
                      className="text-[0.72rem] font-semibold text-[var(--col-secondary)] hover:text-[var(--col-primary)] flex items-center gap-1 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Flip Camera
                    </button>
                  )}
                </div>

                {scannerActive ? (
                  <div className="relative aspect-video w-full rounded-[18px] bg-black overflow-hidden flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Scan Reticle Box */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] border-2 border-[var(--accent)] rounded-[20px] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] relative flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white rounded-br" />
                        <div className="w-full h-[2px] bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] animate-pulse" />
                      </div>
                    </div>

                    {submittingScan && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-[0.86rem] font-bold font-[family-name:var(--font-display)]">
                        Verifying ticket pass...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 px-4 rounded-[18px] border-2 border-dashed border-[var(--line-soft)] text-center flex flex-col items-center justify-center">
                    <QrCode className="w-10 h-10 text-[var(--col-dim)] mb-2" />
                    <p className="text-[0.88rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                      Camera scanner is inactive
                    </p>
                    <p className="text-[0.76rem] text-[var(--col-secondary)] max-w-[340px] mt-1 mb-4 font-[family-name:var(--font-ui)]">
                      Activate camera to point at student mobile QR codes for rapid automated check-in.
                    </p>
                    <button
                      type="button"
                      onClick={() => setScannerActive(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--col-primary)] text-white text-[0.78rem] font-bold shadow-md hover:opacity-90 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Start Camera
                    </button>
                  </div>
                )}

                {/* File Upload Scan Option */}
                <div className="mt-4 pt-4 border-t border-[var(--line-soft)] flex items-center justify-between gap-3 text-[0.76rem]">
                  <span className="text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                    Or scan from saved screenshot / image file:
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--line-soft)] bg-[var(--surface)] hover:bg-[hsl(0_0%_0%_/_0.04)] text-[var(--col-primary)] font-semibold cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Upload QR Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </Squircle>

              {/* Manual Code Input Box */}
              <Squircle
                cornerRadius={20}
                cornerSmoothing={1}
                className="p-5 bg-[var(--surface)] border border-[var(--line-soft)] shadow-sm"
              >
                <h4 className="text-[0.84rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-2">
                  Manual Code Verification
                </h4>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter ticket token or registration ID (e.g. PUV-AWS-XXXX)..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-[12px] bg-[var(--bg)] border border-[var(--line-soft)] text-[0.82rem] font-[family-name:var(--font-mono)] outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    disabled={submittingScan || !manualCode.trim()}
                    className="px-5 py-2.5 rounded-[12px] bg-[var(--col-primary)] hover:opacity-90 disabled:opacity-50 text-white text-[0.78rem] font-bold transition-all cursor-pointer font-[family-name:var(--font-display)]"
                  >
                    Verify Pass
                  </button>
                </form>
              </Squircle>
            </div>

            {/* Right Column: Scan Result & Attendee Verification Card (5 cols) */}
            <div className="lg:col-span-5">
              {scanError && (
                <Squircle
                  cornerRadius={22}
                  cornerSmoothing={1}
                  className="p-5 bg-red-500/10 border border-red-500/25 mb-4 text-red-600"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[0.88rem] font-bold font-[family-name:var(--font-display)]">
                        Verification Failed
                      </h4>
                      <p className="text-[0.78rem] mt-1 font-[family-name:var(--font-ui)] leading-relaxed">
                        {scanError}
                      </p>
                    </div>
                  </div>
                </Squircle>
              )}

              {scanResult ? (
                <Squircle
                  cornerRadius={24}
                  cornerSmoothing={1}
                  className="p-6 bg-[var(--surface)] border border-[var(--line-soft)] shadow-xl overflow-hidden relative"
                >
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-[16px] mb-5 flex items-center gap-3 ${
                      scanResult.alreadyCheckedIn
                        ? "bg-amber-500/15 border border-amber-500/30 text-amber-700"
                        : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-700"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        scanResult.alreadyCheckedIn ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                      }`}
                    >
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-[0.92rem] font-black font-[family-name:var(--font-display)] leading-tight">
                        {scanResult.alreadyCheckedIn ? "ALREADY CHECKED IN" : "CHECK-IN VERIFIED"}
                      </h4>
                      <p className="text-[0.72rem] opacity-90 mt-0.5 font-[family-name:var(--font-ui)]">
                        {scanResult.alreadyCheckedIn
                          ? `Previously verified at ${new Date(scanResult.checkedInAt).toLocaleTimeString()}`
                          : `Successfully checked in at ${new Date().toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>

                  {/* Student Attendee Info */}
                  <div className="flex items-center gap-3 pb-4 border-b border-[var(--line-soft)] mb-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--col-primary)] text-white text-[0.84rem] font-black flex items-center justify-center shadow-sm flex-shrink-0">
                      {(scanResult.attendeeName || "ST").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[1.05rem] font-black text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">
                        {scanResult.attendeeName}
                      </h3>
                      <p className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">
                        {scanResult.attendeeEmail}
                      </p>
                    </div>
                  </div>

                  {/* Configured Visible Fields */}
                  <div className="space-y-2 mb-5">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                      Attendee Registration Details
                    </p>
                    <div className="rounded-[14px] bg-[var(--bg)] border border-[var(--line-soft)] divide-y divide-[var(--line-soft)] overflow-hidden">
                      <div className="flex items-center justify-between p-2.5 text-[0.76rem]">
                        <span className="text-[var(--col-secondary)] font-medium">Ticket Pass Code</span>
                        <span className="font-bold text-[var(--col-primary)] font-[family-name:var(--font-mono)]">
                          {scanResult.ticketToken}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 text-[0.76rem]">
                        <span className="text-[var(--col-secondary)] font-medium">Scan Counter</span>
                        <span className="font-bold text-[var(--accent)] font-[family-name:var(--font-mono)]">
                          Scan #{scanResult.scanCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 text-[0.76rem]">
                        <span className="text-[var(--col-secondary)] font-medium">Verified By Volunteer</span>
                        <span className="font-semibold text-[var(--col-primary)]">
                          {scanResult.scannedBy}
                        </span>
                      </div>
                      {Object.entries(scanResult.visibleFields)
                        .filter(([k]) => k !== "FULL_NAME" && k !== "EMAIL")
                        .map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between p-2.5 text-[0.76rem]">
                            <span className="text-[var(--col-secondary)] font-medium capitalize">
                              {key.replace(/_/g, " ").toLowerCase()}
                            </span>
                            <span className="font-semibold text-[var(--col-primary)] max-w-[200px] truncate text-right">
                              {val}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setScanResult(null);
                      setScanError("");
                      setManualCode("");
                    }}
                    className="w-full py-2.5 rounded-[12px] bg-[var(--col-primary)] hover:opacity-90 text-white text-[0.8rem] font-bold font-[family-name:var(--font-display)] transition-all cursor-pointer shadow-sm"
                  >
                    Scan Next Attendee
                  </button>
                </Squircle>
              ) : (
                <Squircle
                  cornerRadius={24}
                  cornerSmoothing={1}
                  className="p-8 bg-[var(--surface)] border border-[var(--line-soft)] shadow-sm text-center flex flex-col items-center justify-center min-h-[320px]"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-[0.96rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                    Awaiting Next Scan
                  </h4>
                  <p className="text-[0.78rem] text-[var(--col-secondary)] mt-1 max-w-[280px] font-[family-name:var(--font-ui)]">
                    Position the attendee QR ticket in the camera frame or enter pass token manually to verify check-in.
                  </p>
                </Squircle>
              )}
            </div>
          </div>

          {/* Live Attendee Check-in List & Real-Time Table */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[1.1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                  Live Attendance Check-In List
                </h3>
                <p className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                  Real-time participant register with timestamps and volunteer attribution.
                </p>
              </div>

              <button
                type="button"
                onClick={() => selectedEventId && loadAttendance(selectedEventId)}
                disabled={loadingAttendance}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--line-soft)] bg-[var(--surface)] text-[0.76rem] font-bold text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.04)] transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAttendance ? "animate-spin" : ""}`} />
                <span>Refresh List</span>
              </button>
            </div>

            {/* Table Filters & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {[
                  { label: "All Registrations", value: "all" as const },
                  { label: "Checked In", value: "checked_in" as const },
                  { label: "Pending", value: "pending" as const },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setTableFilter(tab.value)}
                    className={`px-3.5 py-1.5 rounded-full text-[0.72rem] font-bold cursor-pointer transition-all ${
                      tableFilter === tab.value
                        ? "bg-[var(--col-primary)] text-white"
                        : "bg-[var(--surface)] border border-[var(--line-soft)] text-[var(--col-secondary)] hover:text-[var(--col-primary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-[260px] flex items-center gap-2 px-3 py-1.5 rounded-[12px] bg-[var(--surface)] border border-[var(--line-soft)]">
                <Search className="w-3.5 h-3.5 text-[var(--col-dim)]" />
                <input
                  type="text"
                  placeholder="Search attendee or token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-[0.76rem] text-[var(--col-primary)] outline-none w-full"
                />
              </div>
            </div>

            {/* Attendance Table */}
            <section className="rounded-[22px] border border-[var(--line-soft)] bg-[var(--surface)]/90 shadow-md backdrop-blur-xl overflow-hidden">
              <div className="grid grid-cols-[minmax(220px,2fr)_minmax(140px,1.2fr)_minmax(130px,1fr)_minmax(140px,1.2fr)] gap-4 border-b border-[var(--line-soft)] px-6 py-3.5 text-[0.7rem] font-black uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                <span>Attendee</span>
                <span>Ticket Token</span>
                <span>Check-in Status</span>
                <span>Scanned By</span>
              </div>

              {filteredAttendance.length === 0 ? (
                <div className="py-12 text-center text-[0.82rem] text-[var(--col-secondary)]">
                  No attendees match current filter criteria.
                </div>
              ) : (
                filteredAttendance.map((item) => {
                  const isCheckedIn = item.checkedInAt !== null;
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[minmax(220px,2fr)_minmax(140px,1.2fr)_minmax(130px,1fr)_minmax(140px,1.2fr)] items-center gap-4 px-6 py-4 border-b border-[var(--line-soft)] last:border-b-0 hover:bg-[hsl(0_0%_0%_/_0.015)] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[var(--col-primary)] text-white text-[0.72rem] font-black flex items-center justify-center flex-shrink-0">
                          {item.attendeeName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.82rem] font-black text-[var(--col-primary)] truncate font-[family-name:var(--font-display)]">
                            {item.attendeeName}
                          </p>
                          <p className="text-[0.7rem] text-[var(--col-secondary)] truncate font-[family-name:var(--font-ui)]">
                            {item.attendeeEmail}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-[0.74rem] font-[family-name:var(--font-mono)] text-[var(--col-primary)] bg-[var(--bg)] px-2.5 py-1 rounded-[8px] border border-[var(--line-soft)]">
                          {item.ticketToken || "PUV-PASS"}
                        </span>
                      </div>

                      <div>
                        {isCheckedIn ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-emerald-700 bg-emerald-500/15 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Checked In
                            </span>
                            <p className="text-[0.66rem] text-[var(--col-dim)] mt-0.5 font-[family-name:var(--font-mono)]">
                              {new Date(item.checkedInAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-amber-700 bg-amber-500/15 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>

                      <div>
                        {item.checkedInByName ? (
                          <span className="text-[0.76rem] font-semibold text-[var(--col-primary)]">
                            {item.checkedInByName}
                          </span>
                        ) : (
                          <span className="text-[0.72rem] text-[var(--col-dim)]">—</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
