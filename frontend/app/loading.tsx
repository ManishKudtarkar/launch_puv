"use client";

export default function AppLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--col-primary)]">
      <div className="flex flex-col items-center gap-4">
        <span className="h-11 w-11 rounded-full border-2 border-[var(--col-primary)] border-t-transparent animate-spin" />
        <span className="text-[0.82rem] font-medium tracking-[0.16em] uppercase text-[var(--col-secondary)]">
          Loading PUVerse
        </span>
      </div>
    </div>
  );
}
