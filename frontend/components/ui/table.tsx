import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface TableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export function Table({ headers, children, className }: TableProps) {
  return (
    <div
      className={cn(
        "pv-table-wrap overflow-x-auto rounded-[var(--r-xl)] border border-[var(--border-card)]",
        className,
      )}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--hairline)] bg-[var(--bg-card-hover)] backdrop-blur-xl">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--ink-3)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-[var(--hairline)] last:border-0 transition-colors duration-150",
        onClick && "cursor-pointer hover:bg-[var(--bg-card-hover)]",
      )}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("px-4 py-3.5 text-[var(--ink-2)]", className)}>
      {children}
    </td>
  );
}
