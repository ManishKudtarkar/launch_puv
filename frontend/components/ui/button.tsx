"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent-500)] text-white border border-[var(--accent-600)] hover:bg-[var(--accent-400)] hover:shadow-[0_0_20px_var(--accent-glow)]",
  secondary:
    "bg-[var(--bg-card)] text-[var(--ink-1)] border border-[var(--border-card-hover)] backdrop-blur-xl hover:bg-[var(--bg-card-hover)]",
  outline:
    "bg-transparent text-[var(--ink-1)] border border-[var(--border-card-hover)] hover:bg-[var(--bg-card)] backdrop-blur-sm",
  ghost:
    "bg-transparent text-[var(--ink-2)] border border-transparent hover:text-[var(--ink-1)] hover:bg-[var(--bg-card)]",
  danger:
    "bg-[var(--danger-bg)] text-[var(--danger)] border border-[rgba(248,113,113,0.3)] hover:bg-[rgba(248,113,113,0.2)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-10 px-[18px] text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "pv-btn inline-flex items-center justify-center gap-2 font-medium rounded-[var(--r-md)] transition-all duration-200 whitespace-nowrap",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "font-[var(--font-ui)] tracking-[-0.01em]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
