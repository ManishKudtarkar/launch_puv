"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, options, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-3)] font-[var(--font-mono)]"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          "pv-select w-full h-11 px-3.5 rounded-[var(--r-md)] text-sm",
          "bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--ink-1)]",
          "backdrop-blur-xl transition-all duration-200",
          "outline-none focus:border-[var(--accent-500)] focus:shadow-[0_0_0_3px_var(--accent-glow)]",
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--bg-base)] text-[var(--ink-1)]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
);
Select.displayName = "Select";
