import { ROLE_HOME } from "@/constants/navigation";
import { backendRoleToUiRole } from "@/store/auth-store";
import type { ApiUser } from "@/lib/api-client";
import type { UserRole } from "@/types";

/**
 * The dashboard that belongs to the logged-in user — the same place login
 * sends them (ROLE_HOME). Use this for every "Dashboard" link so a Super Admin
 * never lands on the student portal, etc. Logged-out users go to /login.
 */
export function getDashboardHref(user: ApiUser | null | undefined): string {
  if (!user) return "/login";
  return ROLE_HOME[backendRoleToUiRole(user)] ?? "/student";
}

export const ROLE_DASHBOARD_LABEL: Record<UserRole, string> = {
  student: "Student Dashboard",
  admin: "Event Admin Dashboard",
  super_admin: "Super Admin Dashboard",
  platform_admin: "Platform Admin Dashboard",
};
