"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, backendRoleToUiRole } from "@/store/auth-store";
import { ROLE_HOME } from "@/constants/navigation";
import type { UserRole } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) return;

    // 1. If not logged in, redirect to login page immediately
    if (!accessToken || !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Check role authorization if specified
    if (allowedRoles && allowedRoles.length > 0) {
      const uiRole = backendRoleToUiRole(user);
      if (!allowedRoles.includes(uiRole)) {
        router.replace(ROLE_HOME[uiRole] || "/student");
      }
    }
  }, [initialized, user, accessToken, allowedRoles, pathname, router]);

  // While checking auth, show secure verification screen so protected content never flashes
  if (!initialized || !accessToken || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="h-10 w-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
            Verifying Authentication...
          </p>
        </div>
      </div>
    );
  }

  // If role is unauthorized, display redirecting message while router.replace executes
  if (allowedRoles && allowedRoles.length > 0) {
    const uiRole = backendRoleToUiRole(user);
    if (!allowedRoles.includes(uiRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <div className="h-10 w-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
              Redirecting to authorized dashboard...
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
