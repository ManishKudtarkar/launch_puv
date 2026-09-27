"use client";

import { useEffect } from "react";
import { Toaster, toast } from "sonner";
import { useDemoStore } from "@/store/demo-store";
import { useAuthStore } from "@/store/auth-store";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const message = useDemoStore((s) => s.addToastMessage);
  const setToastMessage = useDemoStore((s) => s.setToastMessage);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const authUser = useAuthStore((s) => s.user);
  const authInitialized = useAuthStore((s) => s.initialized);
  const loginAsApiUser = useDemoStore((s) => s.loginAsApiUser);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (authInitialized && authUser) {
      loginAsApiUser(authUser);
    } else if (authInitialized && !authUser) {
      useDemoStore.getState().logout();
    }
  }, [authInitialized, authUser, loginAsApiUser]);

  useEffect(() => {
    if (message) {
      toast(message);
      setToastMessage(null);
    }
  }, [message, setToastMessage]);

  return (
    <ThemeProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "!bg-[var(--bg-card)] !border !border-[var(--border-card)] !text-[var(--ink-1)] !backdrop-blur-xl",
        }}
      />
    </ThemeProvider>
  );
}
