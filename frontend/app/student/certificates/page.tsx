"use client";

import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { useDemoStore } from "@/store/demo-store";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import { Award, Download, Eye, X } from "lucide-react";
import type { Certificate } from "@/types";

export default function StudentCertificatesPage() {
  const certificates = useDemoStore((s) => s.certificates);
  const user = useDemoStore((s) => s.user);
  const [preview, setPreview] = useState<Certificate | null>(null);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-4 font-[family-name:var(--font-mono)]">
          <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
          Certificates
        </p>
        <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          My Certificates
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]">
            {" "}.
          </span>
        </h1>
        <p className="mt-2 text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] font-[family-name:var(--font-ui)]">
          Certificates earned from completed events.
        </p>
      </div>

      {certificates.length === 0 ? (
        <Squircle
          cornerRadius={28}
          cornerSmoothing={1}
          className="py-16 flex flex-col items-center justify-center"
          style={{
            background: "hsl(0 0% 96% / 0.42)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
          }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "hsl(25 65% 45% / 0.1)" }}>
            <Award className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <p className="text-[0.92rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">
            No certificates yet
          </p>
          <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-5">
            Attend events to earn certificates automatically.
          </p>
          <Link href="/student/events" className="group">
            <Squircle
              cornerRadius={14}
              cornerSmoothing={1}
              className="inline-flex items-center gap-2 text-[0.78rem] font-medium pl-4 pr-[5px] py-[5px] font-[family-name:var(--font-display)]"
              style={{ background: "var(--col-primary)", color: "var(--bg)" }}
            >
              Browse Events
              <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] stroke-white fill-none stroke-2 -rotate-45 group-hover:rotate-0 transition-transform duration-300" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </Squircle>
          </Link>
        </Squircle>
      ) : (
        <div className="space-y-6">
          {certificates.map((cert) => (
            <Squircle
              key={cert.id}
              cornerRadius={28}
              cornerSmoothing={1}
              className="overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "hsl(0 0% 96% / 0.42)",
                backdropFilter: "blur(24px) saturate(1.4)",
                WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                boxShadow: "0 2px 24px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6), inset 0 -1px 0 hsl(0 0% 80% / 0.1)",
              }}
            >
              {/* Certificate preview — looks like an actual certificate */}
              <div className="p-6">
                <Squircle
                  cornerRadius={20}
                  cornerSmoothing={1}
                  className="relative p-8 text-center overflow-hidden"
                  style={{
                    background: "hsl(0 0% 100% / 0.6)",
                    border: "1.5px solid hsl(0 0% 85% / 0.5)",
                    boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.8), 0 2px 8px hsl(0 0% 0% / 0.04)",
                  }}
                >
                  {/* Corner accents */}
                  <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 rounded-tl-md" style={{ borderColor: "var(--accent)" }} />
                  <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 rounded-tr-md" style={{ borderColor: "var(--accent)" }} />
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 rounded-bl-md" style={{ borderColor: "var(--accent)" }} />
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 rounded-br-md" style={{ borderColor: "var(--accent)" }} />

                  {/* Seal */}
                  <div className="absolute top-4 right-4 w-14 h-14 rounded-full flex items-center justify-center opacity-15" style={{ border: "3px solid var(--accent)" }}>
                    <Award className="w-6 h-6 text-[var(--accent)]" />
                  </div>

                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
                    Certificate of Participation
                  </p>

                  <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                    This certifies that
                  </p>
                  <p className="text-[1.3rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mt-1 mb-2">
                    {user?.name || "Student"}
                  </p>
                  <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                    has successfully participated in
                  </p>
                  <p className="text-[1.1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mt-1 mb-4">
                    {cert.eventTitle}
                  </p>

                  {/* Divider */}
                  <div className="mx-auto w-16 h-px mb-4" style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }} />

                  <p className="text-[0.65rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                    {formatDate(cert.issuedAt)}
                  </p>

                  {/* Footer */}
                  <div className="flex items-end justify-between mt-6 px-4">
                    <div className="text-left">
                      <div className="w-16 h-px mb-1" style={{ background: "hsl(0 0% 80% / 0.5)" }} />
                      <p className="text-[0.55rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Organizer</p>
                    </div>
                    <div className="text-[1rem] leading-none">
                      <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">PU</span>
                      <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
                    </div>
                  </div>
                </Squircle>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => setPreview(cert)} className="group/btn flex-1">
                    <Squircle
                      cornerRadius={14}
                      cornerSmoothing={1}
                      className="w-full inline-flex items-center justify-center gap-2 text-[0.76rem] font-medium py-2.5 transition-all duration-200 font-[family-name:var(--font-ui)]"
                      style={{
                        background: "hsl(0 0% 100% / 0.55)",
                        border: "1px solid hsl(0 0% 85% / 0.4)",
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 text-[var(--accent)]" />
                      Preview
                    </Squircle>
                  </button>
                  <button onClick={() => alert("Certificate download started (demo)")} className="group/btn flex-1">
                    <Squircle
                      cornerRadius={14}
                      cornerSmoothing={1}
                      className="w-full inline-flex items-center justify-center gap-2 text-[0.76rem] font-medium py-2.5 transition-all duration-200 font-[family-name:var(--font-ui)]"
                      style={{ background: "var(--col-primary)", color: "var(--bg)" }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </Squircle>
                  </button>
                </div>
              </div>
            </Squircle>
          ))}
        </div>
      )}

      {/* Preview modal — larger certificate view */}
      {preview && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ background: "hsl(0 0% 0% / 0.4)", backdropFilter: "blur(12px)" }}
            onClick={() => setPreview(null)}
          />
          <Squircle
            cornerRadius={32}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-[540px] mx-4 overflow-hidden"
            style={{
              background: "hsl(0 0% 96% / 0.92)",
              backdropFilter: "blur(40px) saturate(1.6)",
              WebkitBackdropFilter: "blur(40px) saturate(1.6)",
              boxShadow: "0 24px 80px hsl(0 0% 0% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
            }}
          >
            {/* Close */}
            <button
              onClick={() => setPreview(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] transition-colors"
              style={{ background: "hsl(0 0% 100% / 0.5)" }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Certificate body */}
            <div className="p-8">
              <div
                className="relative p-10 text-center"
                style={{
                  border: "2px solid hsl(25 65% 45% / 0.25)",
                  borderRadius: "16px",
                  background: "hsl(0 0% 100% / 0.7)",
                }}
              >
                {/* Corner accents */}
                <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 rounded-tl-md" style={{ borderColor: "var(--accent)" }} />
                <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 rounded-tr-md" style={{ borderColor: "var(--accent)" }} />
                <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 rounded-bl-md" style={{ borderColor: "var(--accent)" }} />
                <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 rounded-br-md" style={{ borderColor: "var(--accent)" }} />

                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "hsl(25 65% 45% / 0.1)", border: "2px solid hsl(25 65% 45% / 0.2)" }}>
                  <Award className="w-5 h-5 text-[var(--accent)]" />
                </div>

                <p className="text-[0.62rem] uppercase tracking-[0.35em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-6">
                  Certificate of Participation
                </p>

                <p className="text-[0.88rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                  This certifies that
                </p>
                <p className="text-[1.6rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mt-1 mb-3">
                  {user?.name || "Student"}
                </p>
                <p className="text-[0.88rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                  has successfully participated in
                </p>
                <p className="text-[1.3rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mt-1 mb-5">
                  {preview.eventTitle}
                </p>

                <div className="mx-auto w-20 h-px mb-5" style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }} />

                <p className="text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                  Issued on {formatDate(preview.issuedAt)}
                </p>

                <div className="flex items-end justify-between mt-8 px-6">
                  <div className="text-left">
                    <div className="w-20 h-px mb-1.5" style={{ background: "hsl(0 0% 75% / 0.5)" }} />
                    <p className="text-[0.6rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Organizer Signature</p>
                  </div>
                  <div className="text-[1.2rem] leading-none">
                    <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">PU</span>
                    <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
                  </div>
                </div>
              </div>

              {/* Download button */}
              <button onClick={() => alert("Download started (demo)")} className="w-full mt-5">
                <Squircle
                  cornerRadius={16}
                  cornerSmoothing={1}
                  className="w-full inline-flex items-center justify-center gap-2 text-[0.82rem] font-medium py-3 font-[family-name:var(--font-ui)]"
                  style={{ background: "var(--col-primary)", color: "var(--bg)" }}
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Squircle>
              </button>
            </div>
          </Squircle>
        </div>
      )}
    </div>
  );
}
