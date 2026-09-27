"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, type Registration } from "@/lib/api-client";
import {
  ArrowLeft,
  Users,
  Eye,
  X,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Award,
  Globe,
  ExternalLink,
  FileText,
  Code,
  Sparkles,
  Briefcase,
  IdCard,
  Download,
  FileSpreadsheet,
  Check,
  SlidersHorizontal,
} from "lucide-react";

const glassStyle = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};

const FIELD_LABELS: Record<string, { label: string; category: "system" | "academic" | "personal" | "technical" | "hackathon" | "workshop" }> = {
  FULL_NAME: { label: "Full Name", category: "system" },
  EMAIL: { label: "University Email", category: "system" },
  UNIVERSITY_ID: { label: "University ID / Enrollment No.", category: "system" },
  PHONE_NUMBER: { label: "Phone Number", category: "system" },
  COLLEGE: { label: "College / Faculty", category: "system" },
  DEPARTMENT: { label: "Department", category: "system" },

  COURSE: { label: "Course / Program", category: "academic" },
  YEAR: { label: "Year of Study", category: "academic" },
  SEMESTER: { label: "Semester", category: "academic" },
  CGPA: { label: "CGPA", category: "academic" },

  GENDER: { label: "Gender", category: "personal" },
  DATE_OF_BIRTH: { label: "Date of Birth", category: "personal" },
  CITY: { label: "City", category: "personal" },

  GITHUB: { label: "GitHub Profile", category: "technical" },
  LINKEDIN: { label: "LinkedIn Profile", category: "technical" },
  TECHNICAL_SKILLS: { label: "Technical Skills", category: "technical" },
  PROGRAMMING_LANGUAGES: { label: "Programming Languages", category: "technical" },

  TEAM_NAME: { label: "Team Name", category: "hackathon" },
  TEAM_SIZE: { label: "Team Size", category: "hackathon" },
  PROJECT_TITLE: { label: "Project Title", category: "hackathon" },
  PROJECT_DESCRIPTION: { label: "Project Description", category: "hackathon" },
  TECHNOLOGY_STACK: { label: "Technology Stack", category: "hackathon" },

  EXPERIENCE_LEVEL: { label: "Experience Level", category: "workshop" },
  LEARNING_GOAL: { label: "Learning Goal", category: "workshop" },
};

interface ExportColumnDef {
  key: string;
  label: string;
  category: string;
}

const STANDARD_EXPORT_COLUMNS: ExportColumnDef[] = [
  { key: "S_NO", label: "Sr. No.", category: "System" },
  { key: "FULL_NAME", label: "Full Name", category: "System" },
  { key: "EMAIL", label: "University Email", category: "System" },
  { key: "UNIVERSITY_ID", label: "Enrollment / University ID", category: "System" },
  { key: "PHONE_NUMBER", label: "Phone Number", category: "System" },
  { key: "COLLEGE", label: "College", category: "Academic" },
  { key: "DEPARTMENT", label: "Department", category: "Academic" },
  { key: "COURSE", label: "Course", category: "Academic" },
  { key: "YEAR", label: "Year", category: "Academic" },
  { key: "SEMESTER", label: "Semester", category: "Academic" },
  { key: "CGPA", label: "CGPA", category: "Academic" },
  { key: "GENDER", label: "Gender", category: "Personal" },
  { key: "DATE_OF_BIRTH", label: "Date of Birth", category: "Personal" },
  { key: "CITY", label: "City", category: "Personal" },
  { key: "GITHUB", label: "GitHub Profile", category: "Technical" },
  { key: "LINKEDIN", label: "LinkedIn Profile", category: "Technical" },
  { key: "TECHNICAL_SKILLS", label: "Technical Skills", category: "Technical" },
  { key: "PROGRAMMING_LANGUAGES", label: "Programming Languages", category: "Technical" },
  { key: "TEAM_NAME", label: "Team Name", category: "Hackathon" },
  { key: "TEAM_SIZE", label: "Team Size", category: "Hackathon" },
  { key: "PROJECT_TITLE", label: "Project Title", category: "Hackathon" },
  { key: "PROJECT_DESCRIPTION", label: "Project Description", category: "Hackathon" },
  { key: "TECHNOLOGY_STACK", label: "Technology Stack", category: "Hackathon" },
  { key: "EXPERIENCE_LEVEL", label: "Experience Level", category: "Workshop" },
  { key: "LEARNING_GOAL", label: "Learning Goal", category: "Workshop" },
  { key: "REGISTERED_AT", label: "Registered Date", category: "Metadata" },
  { key: "STATUS", label: "Status", category: "Metadata" },
  { key: "REGISTRATION_ID", label: "Registration ID", category: "Metadata" },
];

function formatKeyToLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key].label;
  return key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderValue(val: unknown) {
  if (val === undefined || val === null || val === "") {
    return <span className="text-[var(--col-dim)] italic">—</span>;
  }
  const strVal = String(val);

  if (strVal.startsWith("http://") || strVal.startsWith("https://")) {
    return (
      <a
        href={strVal}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium break-all"
      >
        <span>{strVal}</span>
        <ExternalLink className="w-3 h-3 flex-shrink-0" />
      </a>
    );
  }

  return <span className="text-[var(--col-primary)] font-medium break-words">{strVal}</span>;
}

export default function EventRegistrationsPage() {
  const params = useParams();
  const id = params.id as string;
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);

  // Sheet Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>(STANDARD_EXPORT_COLUMNS.map((c) => c.key));

  useEffect(() => {
    api.events.registrations
      .list(id)
      .then(setRegistrations)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (selectedReg || showExportModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedReg, showExportModal]);

  // Dynamically extract custom keys from registrations
  const allCustomKeys: string[] = Array.from(
    new Set(
      registrations.flatMap((reg) => {
        const data = (reg.registrationData as Record<string, string>) || {};
        const knownSet = new Set(STANDARD_EXPORT_COLUMNS.map((c) => c.key));
        return Object.keys(data).filter((k) => !knownSet.has(k));
      })
    )
  );

  const allAvailableColumns: ExportColumnDef[] = [
    ...STANDARD_EXPORT_COLUMNS,
    ...allCustomKeys.map((k) => ({
      key: k,
      label: formatKeyToLabel(k),
      category: "Custom Fields",
    })),
  ];

  const toggleColumnSelection = (key: string) => {
    setSelectedExportColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedExportColumns(allAvailableColumns.map((c) => c.key));
  };

  const handleDeselectAllColumns = () => {
    setSelectedExportColumns(["S_NO", "FULL_NAME", "EMAIL"]);
  };

  const handleDownloadSheet = () => {
    if (registrations.length === 0) return;

    const columnsToExport = allAvailableColumns.filter((col) => selectedExportColumns.includes(col.key));
    if (columnsToExport.length === 0) return;

    const headers = columnsToExport.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(",");

    const rows = registrations.map((reg, index) => {
      const data = (reg.registrationData as Record<string, string>) || {};
      const regUser = (reg as unknown as { user?: { fullName: string; email: string } }).user;

      return columnsToExport
        .map((col) => {
          let val = "";
          if (col.key === "S_NO") {
            val = String(index + 1);
          } else if (col.key === "FULL_NAME") {
            val = data.FULL_NAME || regUser?.fullName || "";
          } else if (col.key === "EMAIL") {
            val = data.EMAIL || regUser?.email || "";
          } else if (col.key === "REGISTERED_AT") {
            const dateStr = (reg as unknown as Record<string, string>).registeredAt || (reg as unknown as Record<string, string>).createdAt;
            val = dateStr ? new Date(dateStr).toLocaleString("en-US") : "";
          } else if (col.key === "STATUS") {
            val = String(reg.status || "ACTIVE");
          } else if (col.key === "REGISTRATION_ID") {
            val = String(reg.id || "");
          } else {
            val = data[col.key] !== undefined && data[col.key] !== null ? String(data[col.key]) : "";
          }

          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",");
    });

    // UTF-8 BOM for Microsoft Excel compatibility
    const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `Student_Registrations_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const selectedData = selectedReg ? ((selectedReg.registrationData as Record<string, string>) || {}) : {};
  const selectedUser = selectedReg ? (selectedReg as unknown as { user?: { id: string; fullName: string; email: string; userType: string; role: string } }).user : undefined;

  // Group fields into categories for single student view
  const knownKeys = new Set(Object.keys(FIELD_LABELS));
  const customKeys = Object.keys(selectedData).filter((k) => !knownKeys.has(k));

  const hasPersonal = ["GENDER", "DATE_OF_BIRTH", "CITY", "PHONE_NUMBER"].some((k) => selectedData[k]);
  const hasAcademic = ["COLLEGE", "DEPARTMENT", "COURSE", "YEAR", "SEMESTER", "CGPA"].some((k) => selectedData[k]);
  const hasTechnical = ["GITHUB", "LINKEDIN", "TECHNICAL_SKILLS", "PROGRAMMING_LANGUAGES"].some((k) => selectedData[k]);
  const hasHackathon = ["TEAM_NAME", "TEAM_SIZE", "PROJECT_TITLE", "PROJECT_DESCRIPTION", "TECHNOLOGY_STACK"].some((k) => selectedData[k]);
  const hasWorkshop = ["EXPERIENCE_LEVEL", "LEARNING_GOAL"].some((k) => selectedData[k]);

  // Group export columns by category for selection modal
  const exportCategories = Array.from(new Set(allAvailableColumns.map((c) => c.category)));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/admin/events/${id}`}
          className="inline-flex items-center gap-2 text-[0.78rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors duration-200 font-[family-name:var(--font-ui)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to event
        </Link>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            Registrations<span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
          </h1>
          <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            {registrations.length} registration{registrations.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* TOP RIGHT DOWNLOAD STUDENTS SHEET BUTTON */}
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          disabled={registrations.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[0.82rem] font-semibold text-white bg-[var(--accent)] hover:opacity-90 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer self-start sm:self-auto"
          title="Download full list of registered students as CSV / Excel sheet"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Download Students List</span>
        </button>
      </div>

      {error && <p className="mb-5 text-[0.82rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">{error}</p>}
      {loading && <p className="mb-5 text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading registrations...</p>}

      {registrations.length === 0 && !loading ? (
        <Squircle cornerRadius={22} cornerSmoothing={1} className="p-14 text-center" style={glassStyle}>
          <Users className="w-10 h-10 text-[var(--col-dim)] mx-auto mb-3 opacity-40" strokeWidth={1} />
          <p className="text-[0.88rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">No registrations yet.</p>
        </Squircle>
      ) : (
        <Squircle cornerRadius={24} cornerSmoothing={1} className="overflow-hidden" style={glassStyle}>
          <div
            className="grid items-center gap-4 px-6 py-3.5"
            style={{ gridTemplateColumns: "1.1fr 1.3fr 110px 110px", borderBottom: "1px solid hsl(0 0% 85% / 0.3)" }}
          >
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Name</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Email</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Registered</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] text-right">Details</span>
          </div>
          {registrations.map((reg, i) => {
            const data = (reg.registrationData as Record<string, string>) || {};
            const regUser = (reg as unknown as { user?: { fullName: string; email: string } }).user;
            const fullName = data.FULL_NAME || regUser?.fullName || "—";
            const email = data.EMAIL || regUser?.email || "—";
            const registeredDate = (reg as unknown as Record<string, string>).registeredAt || (reg as unknown as Record<string, string>).createdAt;

            return (
              <div
                key={reg.id}
                className="grid items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-[hsl(0_0%_100%_/_0.3)]"
                style={{
                  gridTemplateColumns: "1.1fr 1.3fr 110px 110px",
                  ...(i < registrations.length - 1 ? { borderBottom: "1px solid hsl(0 0% 88% / 0.25)" } : {}),
                }}
              >
                <p className="text-[0.82rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{fullName}</p>
                <p className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">{email}</p>
                <p className="text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                  {registeredDate ? new Date(registeredDate).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—"}
                </p>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedReg(reg)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[0.74rem] font-medium text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)] hover:text-white transition-all duration-200 border border-[var(--accent)]/20 shadow-sm cursor-pointer"
                    title="View Detailed Student Info"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Info</span>
                  </button>
                </div>
              </div>
            );
          })}
        </Squircle>
      )}

      {/* EXPORT COLUMN SELECTION & SHEET DOWNLOAD MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[rgba(6,9,16,0.55)] backdrop-blur-md animate-fade-in">
          <div className="fixed inset-0" onClick={() => setShowExportModal(false)} />
          <div
            className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[28px] border border-[hsl(0_0%_85%_/_0.5)] bg-[hsl(0_0%_98%_/_0.96)] backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.18)] overflow-hidden animate-scale-in font-[family-name:var(--font-ui)]"
            role="dialog"
            aria-modal="true"
          >
            {/* EXPORT MODAL HEADER */}
            <div className="flex items-start justify-between p-6 sm:p-7 border-b border-[hsl(0_0%_88%_/_0.4)] bg-[hsl(0_0%_100%_/_0.5)]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[1.15rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                    Download Students List
                  </h2>
                  <p className="text-[0.78rem] text-[var(--col-secondary)] mt-0.5">
                    Select the columns you want to include in the exported CSV sheet.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-full text-[var(--col-dim)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_90%_/_0.6)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* EXPORT MODAL BODY */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
              {/* TOP ACTION BAR */}
              <div className="flex items-center justify-between pb-3 border-b border-[hsl(0_0%_88%_/_0.4)]">
                <span className="text-[0.78rem] font-semibold text-[var(--col-primary)]">
                  Selected Columns ({selectedExportColumns.length} / {allAvailableColumns.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllColumns}
                    className="text-[0.72rem] font-medium text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-[var(--col-dim)]">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllColumns}
                    className="text-[0.72rem] font-medium text-[var(--col-secondary)] hover:underline cursor-pointer"
                  >
                    Reset Default
                  </button>
                </div>
              </div>

              {/* CATEGORIZED COLUMN CHECKBOXES */}
              <div className="space-y-5">
                {exportCategories.map((category) => {
                  const categoryCols = allAvailableColumns.filter((c) => c.category === category);
                  return (
                    <div key={category} className="rounded-2xl p-4 bg-white/60 border border-[hsl(0_0%_88%_/_0.4)] shadow-xs">
                      <h3 className="text-[0.74rem] font-bold uppercase tracking-wider text-[var(--col-dim)] mb-3">
                        {category} Columns
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {categoryCols.map((col) => {
                          const isSelected = selectedExportColumns.includes(col.key);
                          return (
                            <label
                              key={col.key}
                              onClick={() => toggleColumnSelection(col.key)}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--col-primary)]"
                                  : "bg-white/40 border-[hsl(0_0%_88%_/_0.5)] text-[var(--col-secondary)] hover:bg-white/80"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                                    : "border-[hsl(0_0%_70%)] bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="text-[0.8rem] font-medium truncate">{col.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EXPORT MODAL FOOTER */}
            <div className="p-4 sm:p-5 border-t border-[hsl(0_0%_88%_/_0.4)] bg-[hsl(0_0%_100%_/_0.6)] flex items-center justify-between">
              <span className="text-[0.74rem] text-[var(--col-secondary)] font-medium hidden sm:inline">
                {registrations.length} student record{registrations.length !== 1 ? "s" : ""} will be exported
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-full text-[0.82rem] font-medium text-[var(--col-primary)] bg-[hsl(0_0%_90%)] hover:bg-[hsl(0_0%_85%)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSheet}
                  disabled={selectedExportColumns.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[0.82rem] font-semibold text-white bg-[var(--accent)] hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sheet (.CSV)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE STUDENT DETAILS MODAL */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[rgba(6,9,16,0.55)] backdrop-blur-md animate-fade-in">
          <div className="fixed inset-0" onClick={() => setSelectedReg(null)} />
          <div
            className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[28px] border border-[hsl(0_0%_85%_/_0.5)] bg-[hsl(0_0%_98%_/_0.96)] backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.18)] overflow-hidden animate-scale-in font-[family-name:var(--font-ui)]"
            role="dialog"
            aria-modal="true"
          >
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between p-6 sm:p-7 border-b border-[hsl(0_0%_88%_/_0.4)] bg-[hsl(0_0%_100%_/_0.5)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] font-bold text-lg font-[family-name:var(--font-display)] flex-shrink-0">
                  {(selectedData.FULL_NAME || selectedUser?.fullName || "S").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[1.15rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                      {selectedData.FULL_NAME || selectedUser?.fullName || "Student Details"}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-semibold tracking-wider uppercase bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
                      {String(selectedReg.status || "ACTIVE")}
                    </span>
                  </div>
                  <p className="text-[0.78rem] text-[var(--col-secondary)] mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[var(--col-dim)]" />
                    <span>{selectedData.EMAIL || selectedUser?.email || "No Email"}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                className="p-2 rounded-full text-[var(--col-dim)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_90%_/_0.6)] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
              {/* OVERVIEW KEY BADGES */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedData.UNIVERSITY_ID && (
                  <div className="p-3.5 rounded-2xl bg-white/70 border border-[hsl(0_0%_88%_/_0.5)] shadow-xs">
                    <span className="text-[0.65rem] uppercase tracking-wider text-[var(--col-dim)] font-medium flex items-center gap-1 mb-1">
                      <IdCard className="w-3 h-3 text-[var(--accent)]" /> University ID
                    </span>
                    <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] truncate">{selectedData.UNIVERSITY_ID}</p>
                  </div>
                )}
                {selectedData.PHONE_NUMBER && (
                  <div className="p-3.5 rounded-2xl bg-white/70 border border-[hsl(0_0%_88%_/_0.5)] shadow-xs">
                    <span className="text-[0.65rem] uppercase tracking-wider text-[var(--col-dim)] font-medium flex items-center gap-1 mb-1">
                      <Phone className="w-3 h-3 text-[var(--accent)]" /> Phone
                    </span>
                    <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] truncate">{selectedData.PHONE_NUMBER}</p>
                  </div>
                )}
                {selectedData.COLLEGE && (
                  <div className="p-3.5 rounded-2xl bg-white/70 border border-[hsl(0_0%_88%_/_0.5)] shadow-xs">
                    <span className="text-[0.65rem] uppercase tracking-wider text-[var(--col-dim)] font-medium flex items-center gap-1 mb-1">
                      <Building2 className="w-3 h-3 text-[var(--accent)]" /> College
                    </span>
                    <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] truncate">{selectedData.COLLEGE}</p>
                  </div>
                )}
                {selectedData.DEPARTMENT && (
                  <div className="p-3.5 rounded-2xl bg-white/70 border border-[hsl(0_0%_88%_/_0.5)] shadow-xs">
                    <span className="text-[0.65rem] uppercase tracking-wider text-[var(--col-dim)] font-medium flex items-center gap-1 mb-1">
                      <GraduationCap className="w-3 h-3 text-[var(--accent)]" /> Department
                    </span>
                    <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] truncate">{selectedData.DEPARTMENT}</p>
                  </div>
                )}
                {selectedData.COURSE && (
                  <div className="p-3.5 rounded-2xl bg-white/70 border border-[hsl(0_0%_88%_/_0.5)] shadow-xs">
                    <span className="text-[0.65rem] uppercase tracking-wider text-[var(--col-dim)] font-medium flex items-center gap-1 mb-1">
                      <BookOpen className="w-3 h-3 text-[var(--accent)]" /> Course
                    </span>
                    <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] truncate">{selectedData.COURSE}</p>
                  </div>
                )}
                <div className="p-3.5 rounded-2xl bg-white/70 border border-[hsl(0_0%_88%_/_0.5)] shadow-xs">
                  <span className="text-[0.65rem] uppercase tracking-wider text-[var(--col-dim)] font-medium flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3 text-[var(--accent)]" /> Registered Date
                  </span>
                  <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] truncate">
                    {new Date(
                      (selectedReg as unknown as Record<string, string>).registeredAt ||
                      (selectedReg as unknown as Record<string, string>).createdAt ||
                      Date.now()
                    ).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* ACADEMIC DETAILS SECTION */}
              {hasAcademic && (
                <div className="rounded-2xl p-5 bg-white/60 border border-[hsl(0_0%_88%_/_0.4)] shadow-xs">
                  <h3 className="text-[0.78rem] font-bold uppercase tracking-wider text-[var(--col-dim)] flex items-center gap-2 mb-3.5">
                    <GraduationCap className="w-4 h-4 text-[var(--accent)]" />
                    Academic Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[0.82rem]">
                    {selectedData.COLLEGE && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">College</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.COLLEGE}</p>
                      </div>
                    )}
                    {selectedData.DEPARTMENT && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Department</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.DEPARTMENT}</p>
                      </div>
                    )}
                    {selectedData.COURSE && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Course</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.COURSE}</p>
                      </div>
                    )}
                    {selectedData.YEAR && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Year</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.YEAR}</p>
                      </div>
                    )}
                    {selectedData.SEMESTER && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Semester</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.SEMESTER}</p>
                      </div>
                    )}
                    {selectedData.CGPA && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">CGPA</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.CGPA}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PERSONAL DETAILS SECTION */}
              {hasPersonal && (
                <div className="rounded-2xl p-5 bg-white/60 border border-[hsl(0_0%_88%_/_0.4)] shadow-xs">
                  <h3 className="text-[0.78rem] font-bold uppercase tracking-wider text-[var(--col-dim)] flex items-center gap-2 mb-3.5">
                    <User className="w-4 h-4 text-[var(--accent)]" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[0.82rem]">
                    {selectedData.GENDER && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Gender</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.GENDER}</p>
                      </div>
                    )}
                    {selectedData.DATE_OF_BIRTH && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Date of Birth</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.DATE_OF_BIRTH}</p>
                      </div>
                    )}
                    {selectedData.CITY && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">City</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.CITY}</p>
                      </div>
                    )}
                    {selectedData.PHONE_NUMBER && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Phone Number</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.PHONE_NUMBER}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TECHNICAL & PROFILES SECTION */}
              {hasTechnical && (
                <div className="rounded-2xl p-5 bg-white/60 border border-[hsl(0_0%_88%_/_0.4)] shadow-xs">
                  <h3 className="text-[0.78rem] font-bold uppercase tracking-wider text-[var(--col-dim)] flex items-center gap-2 mb-3.5">
                    <Code className="w-4 h-4 text-[var(--accent)]" />
                    Technical & Online Profiles
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[0.82rem]">
                    {selectedData.GITHUB && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium mb-0.5">GitHub</p>
                        {renderValue(selectedData.GITHUB)}
                      </div>
                    )}
                    {selectedData.LINKEDIN && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium mb-0.5">LinkedIn</p>
                        {renderValue(selectedData.LINKEDIN)}
                      </div>
                    )}
                    {selectedData.TECHNICAL_SKILLS && (
                      <div className="sm:col-span-2">
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Technical Skills</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5 whitespace-pre-wrap">{selectedData.TECHNICAL_SKILLS}</p>
                      </div>
                    )}
                    {selectedData.PROGRAMMING_LANGUAGES && (
                      <div className="sm:col-span-2">
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Programming Languages</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5 whitespace-pre-wrap">{selectedData.PROGRAMMING_LANGUAGES}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* HACKATHON SECTION */}
              {hasHackathon && (
                <div className="rounded-2xl p-5 bg-white/60 border border-[hsl(0_0%_88%_/_0.4)] shadow-xs">
                  <h3 className="text-[0.78rem] font-bold uppercase tracking-wider text-[var(--col-dim)] flex items-center gap-2 mb-3.5">
                    <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    Hackathon Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[0.82rem]">
                    {selectedData.TEAM_NAME && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Team Name</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.TEAM_NAME}</p>
                      </div>
                    )}
                    {selectedData.TEAM_SIZE && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Team Size</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.TEAM_SIZE}</p>
                      </div>
                    )}
                    {selectedData.PROJECT_TITLE && (
                      <div className="sm:col-span-2">
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Project Title</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.PROJECT_TITLE}</p>
                      </div>
                    )}
                    {selectedData.PROJECT_DESCRIPTION && (
                      <div className="sm:col-span-2">
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Project Description</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5 whitespace-pre-wrap">{selectedData.PROJECT_DESCRIPTION}</p>
                      </div>
                    )}
                    {selectedData.TECHNOLOGY_STACK && (
                      <div className="sm:col-span-2">
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Technology Stack</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5 whitespace-pre-wrap">{selectedData.TECHNOLOGY_STACK}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* WORKSHOP SECTION */}
              {hasWorkshop && (
                <div className="rounded-2xl p-5 bg-white/60 border border-[hsl(0_0%_88%_/_0.4)] shadow-xs">
                  <h3 className="text-[0.78rem] font-bold uppercase tracking-wider text-[var(--col-dim)] flex items-center gap-2 mb-3.5">
                    <Briefcase className="w-4 h-4 text-[var(--accent)]" />
                    Workshop Info
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[0.82rem]">
                    {selectedData.EXPERIENCE_LEVEL && (
                      <div>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Experience Level</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5">{selectedData.EXPERIENCE_LEVEL}</p>
                      </div>
                    )}
                    {selectedData.LEARNING_GOAL && (
                      <div className="sm:col-span-2">
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">Learning Goal</p>
                        <p className="text-[0.84rem] font-medium text-[var(--col-primary)] mt-0.5 whitespace-pre-wrap">{selectedData.LEARNING_GOAL}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ADDITIONAL / CUSTOM SUBMITTED FIELDS */}
              {customKeys.length > 0 && (
                <div className="rounded-2xl p-5 bg-white/60 border border-[hsl(0_0%_88%_/_0.4)] shadow-xs">
                  <h3 className="text-[0.78rem] font-bold uppercase tracking-wider text-[var(--col-dim)] flex items-center gap-2 mb-3.5">
                    <FileText className="w-4 h-4 text-[var(--accent)]" />
                    Additional Submitted Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[0.82rem]">
                    {customKeys.map((key) => (
                      <div key={key} className={String(selectedData[key]).length > 40 ? "sm:col-span-2" : ""}>
                        <p className="text-[0.7rem] text-[var(--col-dim)] font-medium">{formatKeyToLabel(key)}</p>
                        <div className="mt-0.5">{renderValue(selectedData[key])}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SYSTEM METADATA FOOTER CARD */}
              <div className="rounded-2xl p-4 bg-[hsl(0_0%_94%_/_0.5)] border border-[hsl(0_0%_88%_/_0.3)] text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] space-y-1">
                <p>Registration ID: <span className="text-[var(--col-secondary)]">{selectedReg.id}</span></p>
                {selectedReg.formVersion ? <p>Form Version: <span className="text-[var(--col-secondary)]">v{String(selectedReg.formVersion)}</span></p> : null}
                {selectedUser?.id ? <p>User ID: <span className="text-[var(--col-secondary)]">{selectedUser.id}</span></p> : null}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 sm:p-5 border-t border-[hsl(0_0%_88%_/_0.4)] bg-[hsl(0_0%_100%_/_0.6)] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                className="px-5 py-2 rounded-full text-[0.82rem] font-medium text-[var(--col-primary)] bg-[hsl(0_0%_90%)] hover:bg-[hsl(0_0%_85%)] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
