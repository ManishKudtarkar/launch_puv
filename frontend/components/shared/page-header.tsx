interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-2 border-b border-[var(--hairline)] pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--ink-1)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--ink-2)]">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}
