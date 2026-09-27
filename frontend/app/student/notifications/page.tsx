"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage } from "@/lib/api-client";
import type { NotificationItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { Bell, CheckCircle, AlertTriangle, Info, Check, Loader2 } from "lucide-react";

const TYPE_STYLES = {
  SUCCESS: { icon: CheckCircle, bg: "hsl(142 50% 45% / 0.1)", color: "hsl(142 50% 35%)", border: "hsl(142 50% 45% / 0.2)" },
  WARNING: { icon: AlertTriangle, bg: "hsl(40 70% 50% / 0.1)", color: "hsl(40 70% 40%)", border: "hsl(40 70% 50% / 0.2)" },
  INFO:    { icon: Info, bg: "hsl(25 65% 45% / 0.1)", color: "var(--accent)", border: "hsl(25 65% 45% / 0.2)" },
  // lowercase aliases for safety
  success: { icon: CheckCircle, bg: "hsl(142 50% 45% / 0.1)", color: "hsl(142 50% 35%)", border: "hsl(142 50% 45% / 0.2)" },
  warning: { icon: AlertTriangle, bg: "hsl(40 70% 50% / 0.1)", color: "hsl(40 70% 40%)", border: "hsl(40 70% 50% / 0.2)" },
  info:    { icon: Info, bg: "hsl(25 65% 45% / 0.1)", color: "var(--accent)", border: "hsl(25 65% 45% / 0.2)" },
} as const;

export default function StudentNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.notifications.list();
      // Normalize type casing
      setNotifications(data.map((n) => ({
        ...n,
        type: (n.type?.toLowerCase() ?? "info") as NotificationItem["type"],
      })));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: string, link?: string) => {
    if (marking) return;
    setMarking(id);
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch { /* silent */ }
    setMarking(null);
    if (link) router.push(link);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-4 font-[family-name:var(--font-mono)]">
          <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
          Notifications
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
              Notifications
              <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]">
                {" "}.
              </span>
            </h1>
            <p className="mt-2 text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] font-[family-name:var(--font-ui)]">
              Stay updated on communities, clubs, events, and more.
            </p>
          </div>

          {unread.length > 0 && (
            <button onClick={handleMarkAllRead} className="flex-shrink-0">
              <Squircle
                cornerRadius={14}
                cornerSmoothing={1}
                className="inline-flex items-center gap-1.5 text-[0.74rem] font-medium px-4 py-2 transition-all duration-200 font-[family-name:var(--font-ui)]"
                style={{
                  background: "hsl(0 0% 100% / 0.55)",
                  border: "1px solid hsl(0 0% 85% / 0.4)",
                }}
              >
                <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                Mark All Read
              </Squircle>
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12 text-[0.84rem] text-red-500">{error}</div>
      )}

      {/* Unread section */}
      {!loading && !error && unread.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[0.68rem] tracking-[0.15em] uppercase text-[var(--col-dim)] font-[family-name:var(--font-mono)] font-medium">
              New
            </span>
            <span
              className="w-5 h-5 flex items-center justify-center text-[0.5rem] font-bold text-white rounded-full font-[family-name:var(--font-mono)]"
              style={{ background: "var(--accent)" }}
            >
              {unread.length}
            </span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, hsl(25 65% 45% / 0.3), transparent)" }} />
          </div>

          <div className="space-y-3">
            {unread.map((n) => {
              const key = (n.type?.toUpperCase() as keyof typeof TYPE_STYLES) ?? "INFO";
              const style = TYPE_STYLES[key] ?? TYPE_STYLES.INFO;
              const Icon = style.icon;
              return (
                <Squircle
                  key={n.id}
                  cornerRadius={22}
                  cornerSmoothing={1}
                  className="p-4 flex items-start gap-3.5 transition-all duration-300 cursor-pointer hover:-translate-y-[2px]"
                  style={{
                    background: "hsl(0 0% 96% / 0.5)",
                    backdropFilter: "blur(24px) saturate(1.4)",
                    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                    boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
                    borderLeft: `3px solid ${style.border}`,
                    opacity: marking === n.id ? 0.6 : 1,
                  }}
                  onClick={() => handleMarkRead(n.id, n.link)}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: style.bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color: style.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                        {n.title}
                      </h3>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                    </div>
                    <p className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.5]">
                      {n.message}
                    </p>
                    <p className="text-[0.62rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-1.5">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                </Squircle>
              );
            })}
          </div>
        </div>
      )}

      {/* Read section */}
      {!loading && !error && read.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[0.68rem] tracking-[0.15em] uppercase text-[var(--col-dim)] font-[family-name:var(--font-mono)] font-medium">
              Earlier
            </span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, hsl(0 0% 80% / 0.3), transparent)" }} />
          </div>

          <div className="space-y-2">
            {read.map((n) => {
              const key = (n.type?.toUpperCase() as keyof typeof TYPE_STYLES) ?? "INFO";
              const style = TYPE_STYLES[key] ?? TYPE_STYLES.INFO;
              const Icon = style.icon;
              return (
                <Squircle
                  key={n.id}
                  cornerRadius={18}
                  cornerSmoothing={1}
                  className="p-4 flex items-start gap-3.5 opacity-55 transition-all duration-300 cursor-pointer hover:opacity-80"
                  style={{
                    background: "hsl(0 0% 96% / 0.3)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                  onClick={() => n.link && router.push(n.link)}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: style.bg }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: style.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[0.8rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-0.5">
                      {n.title}
                    </h3>
                    <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.5]">
                      {n.message}
                    </p>
                    <p className="text-[0.6rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-1">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                </Squircle>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Squircle
          cornerRadius={28}
          cornerSmoothing={1}
          className="py-16 flex flex-col items-center justify-center"
          style={{
            background: "hsl(0 0% 96% / 0.42)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
          }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "hsl(25 65% 45% / 0.1)" }}>
            <Bell className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <p className="text-[0.92rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">
            All caught up
          </p>
          <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            No notifications yet. Follow a community or club to get started.
          </p>
        </Squircle>
      )}
    </div>
  );
}
