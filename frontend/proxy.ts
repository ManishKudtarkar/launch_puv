import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("puverse_token")?.value;
  const role = request.cookies.get("puverse_role")?.value;

  const isProtectedDashboard =
    pathname.startsWith("/student") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/platform-admin") ||
    pathname.startsWith("/change-password");

  // 1. If not logged in and attempting to access any protected dashboard, redirect immediately to /login
  if (isProtectedDashboard) {
    if (!token || !role) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(loginUrl);
      if (!token) res.cookies.delete("puverse_token");
      if (!role) res.cookies.delete("puverse_role");
      return res;
    }

    // 2. Role-based authorization for protected dashboard routes
    if (pathname.startsWith("/super-admin")) {
      if (role !== "super_admin" && role !== "platform_admin") {
        const home = role === "admin" ? "/admin" : "/student";
        return NextResponse.redirect(new URL(home, request.url));
      }
    }

    if (pathname.startsWith("/admin")) {
      if (role !== "admin" && role !== "super_admin" && role !== "platform_admin") {
        return NextResponse.redirect(new URL("/student", request.url));
      }
    }

    if (pathname.startsWith("/platform-admin")) {
      if (role !== "platform_admin" && role !== "super_admin") {
        const home = role === "admin" ? "/admin" : "/student";
        return NextResponse.redirect(new URL(home, request.url));
      }
    }
  }

  // 3. If authenticated user tries to visit login or register, send them to their dashboard
  if ((pathname === "/login" || pathname === "/register") && token && role) {
    const home =
      role === "super_admin"
        ? "/super-admin"
        : role === "admin"
        ? "/admin"
        : role === "platform_admin"
        ? "/platform-admin"
        : "/student";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/admin/:path*",
    "/student/:path*",
    "/platform-admin/:path*",
    "/change-password/:path*",
    "/login",
    "/register",
  ],
};
