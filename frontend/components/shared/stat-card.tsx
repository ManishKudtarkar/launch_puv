import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
}

export function StatCard({ label, value, subtext }: StatCardProps) {
  return (
    <Card hover={false}>
      <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-3)] font-[family-name:var(--font-mono)]">
        {label}
      </p>
      <p className="mt-1.5 text-[36px] font-light leading-none tracking-[-0.01em] font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink-1)]">
        {value}
      </p>
      {subtext && (
        <p className="mt-1.5 text-xs text-[var(--ink-3)]">{subtext}</p>
      )}
    </Card>
  );
}
