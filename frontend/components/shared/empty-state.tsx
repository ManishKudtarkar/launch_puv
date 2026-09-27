import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--r-xl)] border border-dashed border-[var(--border-card-hover)] bg-[var(--bg-card)] py-16 text-center backdrop-blur-xl">
      <h3 className="font-semibold text-[var(--ink-1)]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--ink-2)]">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
