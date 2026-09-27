import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className, onClick, hover = true }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "pv-card",
        onClick && "cursor-pointer",
        !hover && "hover:!transform-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 border-b border-[var(--hairline)] pb-2", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("font-semibold text-base text-[var(--ink-1)]", className)}>
      {children}
    </h3>
  );
}
