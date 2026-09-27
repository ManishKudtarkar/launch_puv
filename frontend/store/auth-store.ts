"use client";

import { create } from "zustand";
import {
  api,
  ACCESS_TOKEN_KEY,
  USER_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_ID_KEY,
  clearAuthStorage,
  storeAuthTokens,
  getApiErrorMessage,
  type ApiUser,
  type LoginRequest,
  type RegisterRequest,
} from "@/lib/api-client";
import type { BackendRole, UserRole } from "@/types";
import { setAuthCookie, clearAuthCookie } from "@/lib/auth-cookie";

type AuthState = {
  accessToken: string | null;
  user: ApiUser | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  initialize: () => void;
  login: (body: LoginRequest) => Promise<ApiUser>;
  register: (body: RegisterRequest) => Promise<ApiUser>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
};

import { useDemoStore } from "./demo-store";

function storageUser(): ApiUser | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as ApiUser; } catch { return null; }
}

export function backendRoleToUiRole(user: ApiUser | any): UserRole {
  if (!user) return "student";
  const r = String(user.role || user.backendRole || "").toUpperCase();
  if (r === "SUPER_ADMIN") return "super_admin";
  if (r === "EVENT_ADMIN" || r === "ADMIN") return "admin";
  if (r === "PLATFORM_ADMIN") return "platform_admin";
  return "student";
}

export function isEventAdmin(user: ApiUser | null) {
  if (!user) return false;
  const r = String(user.role || (user as any).backendRole || "").toUpperCase();
  return r === "EVENT_ADMIN" || r === "ADMIN" || r === "SUPER_ADMIN";
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  initialized: false,
  loading: false,
  error: null,
  initialize: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const user = token ? storageUser() : null;
    if (!token || !user) {
      clearAuthStorage();
      clearAuthCookie();
      useDemoStore.getState().logout();
      set({ accessToken: null, user: null, initialized: true });
      return;
    }

    const uiRole = backendRoleToUiRole(user);
    setAuthCookie(token, uiRole);
    set({ accessToken: token, user, initialized: true });

    // Validate with backend in background: if token invalid/expired, wipe session
    api.users.me()
      .then((liveUser) => {
        if (liveUser) {
          localStorage.setItem(USER_KEY, JSON.stringify(liveUser));
          const liveRole = backendRoleToUiRole(liveUser);
          setAuthCookie(token, liveRole);
          set({ user: liveUser });
        }
      })
      .catch(() => {
        clearAuthStorage();
        clearAuthCookie();
        useDemoStore.getState().logout();
        set({ accessToken: null, user: null });
        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          if (path.startsWith("/admin") || path.startsWith("/super-admin") || path.startsWith("/student") || path.startsWith("/platform-admin")) {
            window.location.replace(`/login?redirect=${encodeURIComponent(path)}`);
          }
        }
      });
  },
  login: async (body) => {
    set({ loading: true, error: null });
    try {
      const response = await api.auth.login(body);
      storeAuthTokens(response.accessToken, response.refreshToken, response.sessionId);
      const uiRole = backendRoleToUiRole(response.user);
      setAuthCookie(response.accessToken, uiRole);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      set({ accessToken: response.accessToken, user: response.user, loading: false, initialized: true });
      return response.user;
    } catch (error) {
      const message = getApiErrorMessage(error);
      set({ loading: false, error: message });
      throw error;
    }
  },
  register: async (body) => {
    set({ loading: true, error: null });
    try {
      const response = await api.auth.register(body);
      set({ loading: false });
      return response.user;
    } catch (error) {
      const message = getApiErrorMessage(error);
      set({ loading: false, error: message });
      throw error;
    }
  },
  logout: async () => {
    try { await api.auth.logout(); } catch { /* ignore — clear locally regardless */ }
    clearAuthStorage();
    clearAuthCookie();
    set({ accessToken: null, user: null, initialized: true, error: null });
  },
  logoutAll: async () => {
    try { await api.auth.logoutAll(); } catch { /* ignore */ }
    clearAuthStorage();
    clearAuthCookie();
    set({ accessToken: null, user: null, initialized: true, error: null });
  },
}));

export type { BackendRole };
