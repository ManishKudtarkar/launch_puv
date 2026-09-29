import type { NavItem, UserRole } from "@/types";

export const ROLE_HOME: Record<UserRole, string> = {
  student: "/student",
  admin: "/admin",
  super_admin: "/super-admin",
  platform_admin: "/platform-admin",
};

export const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/student" },
  { label: "Explore Events", href: "/explore-events" },
  { label: "My Registrations", href: "/student/registrations" },
  { label: "My Tickets", href: "/student/tickets" },
  { label: "Profile", href: "/student/profile" },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "My Events", href: "/admin/events" },
  { label: "Create Event", href: "/admin/events/create" },
  { label: "Analytics", href: "/admin/analytics" },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/super-admin" },
  { label: "Users", href: "/super-admin/users" },
  { label: "Organizations", href: "/super-admin/organizations" },
  { label: "Event Approvals", href: "/super-admin/events" },
  { label: "Analytics", href: "/super-admin/analytics" },
];

export const PLATFORM_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/platform-admin" },
  { label: "Roles & Permissions", href: "/platform-admin/roles" },
  { label: "Users", href: "/platform-admin/users" },
  { label: "Organizations", href: "/platform-admin/organizations" },
  { label: "All Events", href: "/platform-admin/events" },
  { label: "Analytics", href: "/platform-admin/analytics" },
  { label: "System Settings", href: "/platform-admin/settings" },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  admin: "Admin",
  super_admin: "Super Admin",
  platform_admin: "Platform Admin",
};
