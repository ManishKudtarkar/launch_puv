"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-3)] font-[var(--font-mono)]"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "pv-textarea w-full px-3.5 py-3 rounded-[var(--r-md)] text-sm min-h-[100px]",
          "bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--ink-1)]",
          "backdrop-blur-xl transition-all duration-200",
          "placeholder:text-[var(--ink-4)]",
          "outline-none focus:border-[var(--accent-500)] focus:shadow-[0_0_0_3px_var(--accent-glow)]",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Textarea.displayName = "Textarea";
