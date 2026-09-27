"use client";

interface QRDisplayProps {
  code: string;
  size?: number;
}

export function QRDisplay({ code, size = 160 }: QRDisplayProps) {
  const cells = 11;
  const hash = code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const grid = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (_, col) => {
      const isCorner =
        (row < 3 && col < 3) ||
        (row < 3 && col >= cells - 3) ||
        (row >= cells - 3 && col < 3);
      const isPattern = (row * 7 + col * 13 + hash) % 3 === 0;
      return isCorner || isPattern;
    }),
  );

  const cellSize = size / cells;

  return (
    <div className="inline-block rounded-[var(--r-lg)] border border-[var(--border-card)] bg-[var(--bg-card)] p-3 backdrop-blur-xl">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="white" rx="4" />
        {grid.map((row, ri) =>
          row.map((filled, ci) =>
            filled ? (
              <rect
                key={`${ri}-${ci}`}
                x={ci * cellSize}
                y={ri * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0F172A"
              />
            ) : null,
          ),
        )}
      </svg>
      <p className="mt-2 text-center font-mono text-xs text-[var(--ink-3)]">{code}</p>
    </div>
  );
}
