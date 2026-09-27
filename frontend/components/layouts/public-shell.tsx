"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BlobBackground } from "@/components/shared/blob-background";
import { useTheme } from "@/providers/theme-provider";
import { Sun, Moon } from "lucide-react";

interface PublicShellProps {
  children: React.ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen flex-col">
      <BlobBackground />

      <header className="relative z-[2] border-b border-[var(--hairline)] bg-[var(--bg-card)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-[var(--ink-1)] font-[family-name:var(--font-display)]"
          >
            PUVerse
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-[var(--r-md)] text-[var(--ink-3)] hover:text-[var(--ink-1)] hover:bg-[var(--bg-card)] transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Register</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-[2] flex-1">{children}</main>

      <footer className="relative z-[2] border-t border-[var(--hairline)] py-6 text-center text-sm text-[var(--ink-3)]">
        PUVerse — University Management Platform Demo
      </footer>
    </div>
  );
}
