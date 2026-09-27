"use client";

interface BlobBackgroundProps {
  variant?: "default" | "dashboard" | "table" | "detail";
}

const blobPositions = {
  default: [
    { color: "var(--blob-a)", size: 320, top: "-10%", left: "-5%", opacity: "var(--blob-a-o)" },
    { color: "var(--blob-b)", size: 300, bottom: "-15%", right: "-8%", opacity: "var(--blob-b-o)" },
    { color: "var(--blob-c)", size: 240, top: "40%", left: "50%", opacity: "var(--blob-c-o)" },
  ],
  dashboard: [
    { color: "var(--blob-a)", size: 400, top: "-15%", left: "-10%", opacity: "var(--blob-a-o)" },
    { color: "var(--blob-b)", size: 350, bottom: "-20%", right: "-12%", opacity: "var(--blob-b-o)" },
    { color: "var(--blob-c)", size: 280, top: "30%", right: "20%", opacity: "var(--blob-c-o)" },
  ],
  table: [
    { color: "var(--blob-b)", size: 360, top: "20%", left: "-12%", opacity: "var(--blob-b-o)" },
    { color: "var(--blob-c)", size: 280, top: "-15%", right: "-8%", opacity: "var(--blob-c-o)" },
  ],
  detail: [
    { color: "var(--blob-a)", size: 340, top: "-18%", right: "-8%", opacity: "var(--blob-a-o)" },
    { color: "var(--blob-b)", size: 320, bottom: "-20%", left: "-10%", opacity: "var(--blob-b-o)" },
    { color: "var(--blob-c)", size: 220, top: "40%", left: "45%", opacity: "var(--blob-c-o)" },
  ],
} as const;

export function BlobBackground({ variant = "default" }: BlobBackgroundProps) {
  const blobs = blobPositions[variant];

  return (
    <>
      <div className="blob-field">
        {blobs.map((blob, i) => (
          <div
            key={i}
            className="blob"
            style={{
              width: blob.size,
              height: blob.size,
              background: blob.color,
              opacity: blob.opacity,
              top: "top" in blob ? blob.top : undefined,
              bottom: "bottom" in blob ? blob.bottom : undefined,
              left: "left" in blob ? blob.left : undefined,
              right: "right" in blob ? blob.right : undefined,
              animation: `drift ${60 + i * 15}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      <div className="grain-overlay" />
    </>
  );
}
