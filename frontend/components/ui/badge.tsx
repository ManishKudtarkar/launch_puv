import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "muted" | "positive" | "warning" | "danger" | "info";
  className?: string;
}

const variants = {
  default: "bg-[var(--accent-glow)] text-[var(--accent-400)] border border-[var(--accent-500)]",
  outline: "bg-[var(--bg-card)] text-[var(--ink-1)] border border-[var(--border-card-hover)]",
  muted: "bg-[var(--bg-card)] text-[var(--ink-2)] border border-[var(--border-card)]",
  positive: "bg-[var(--positive-bg)] text-[var(--positive)]",
  warning: "bg-[var(--warning-bg)] text-[var(--warning)]",
  danger: "bg-[var(--danger-bg)] text-[var(--danger)]",
  info: "bg-[var(--info-bg)] text-[var(--info)]",
};

export function Badge({ children, variant = "outline", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "pv-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-[var(--r-full)]",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  const isPending = status.includes("pending");
  const isPublished = status === "published" || status === "registered" || status === "active";
  const isCancelled = status === "cancelled" || status === "rejected";
  const isWaitlisted = status === "waitlisted";

  let variant: BadgeProps["variant"] = "outline";
  if (isPublished) variant = "positive";
  else if (isPending || isWaitlisted) variant = "warning";
  else if (isCancelled) variant = "danger";

  return (
    <Badge variant={variant}>
      <span
        className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-[var(--positive)]": variant === "positive",
          "bg-[var(--warning)]": variant === "warning",
          "bg-[var(--danger)]": variant === "danger",
          "bg-[var(--ink-3)]": variant === "outline",
        })}
      />
      {label}
    </Badge>
  );
}
