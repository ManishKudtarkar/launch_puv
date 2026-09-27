"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-3)] font-[var(--font-mono)]"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "pv-input w-full h-11 px-3.5 rounded-[var(--r-md)] text-sm",
          "bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--ink-1)]",
          "backdrop-blur-xl transition-all duration-200",
          "placeholder:text-[var(--ink-4)]",
          "outline-none focus:border-[var(--accent-500)] focus:shadow-[0_0_0_3px_var(--accent-glow)]",
          error && "border-[var(--danger)]",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  ),
);
Input.displayName = "Input";
