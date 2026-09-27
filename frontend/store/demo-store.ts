"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CERTIFICATES,
  EVENTS,
  NOTIFICATIONS,
  REGISTRATIONS,
  TICKETS,
  DEMO_USERS,
} from "@/constants/mock-data";
import type {
  Certificate,
  Event,
  NotificationItem,
  Registration,
  Ticket,
  User,
  UserRole,
} from "@/types";
import { clearAuthStorage, type ApiUser } from "@/lib/api-client";

interface DemoState {
  user: User | null;
  isAuthenticated: boolean;
  events: Event[];
  registrations: Registration[];
  tickets: Ticket[];
  certificates: Certificate[];
  notifications: NotificationItem[];
  login: (role: UserRole) => void;
  loginAsApiUser: (user: ApiUser) => void;
  logout: () => void;
  registerForEvent: (eventId: string) => void;
  cancelRegistration: (registrationId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  approveEvent: (eventId: string) => void;
  rejectEvent: (eventId: string) => void;
  createEvent: (event: Omit<Event, "id" | "registered" | "status">) => void;
  addToastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      events: EVENTS,
      registrations: REGISTRATIONS,
      tickets: TICKETS,
      certificates: CERTIFICATES,
      notifications: NOTIFICATIONS,
      addToastMessage: null,

      login: (role) => {
        set({
          user: DEMO_USERS[role],
          isAuthenticated: true,
        });
      },

      loginAsApiUser: (apiUser) => {
        const role: UserRole = apiUser.role === "SUPER_ADMIN" ? "super_admin" : apiUser.role === "EVENT_ADMIN" ? "admin" : "student";
        set({
          user: {
            id: apiUser.id,
            name: apiUser.fullName,
            email: apiUser.email,
            role,
            backendRole: apiUser.role,
            userType: apiUser.userType,
            status: apiUser.status,
          },
          isAuthenticated: true,
        });
      },

      logout: () => {
        clearAuthStorage();
        set({ user: null, isAuthenticated: false });
      },

      registerForEvent: (eventId) => {
        const event = get().events.find((e) => e.id === eventId);
        if (!event) return;

        const alreadyRegistered = get().registrations.some(
          (r) => r.eventId === eventId && r.status !== "cancelled",
        );
        if (alreadyRegistered) {
          set({ addToastMessage: "Already registered for this event" });
          return;
        }

        const isFull = event.registered >= event.capacity;
        const newReg: Registration = {
          id: `reg-${Date.now()}`,
          eventId,
          eventTitle: event.title,
          studentName: get().user?.name ?? "Student",
          studentEmail: get().user?.email ?? "student@pu.ac.in",
          status: isFull ? "waitlisted" : "registered",
          registeredAt: new Date().toISOString(),
        };

        const updates: Partial<DemoState> = {
          registrations: [...get().registrations, newReg],
          events: get().events.map((e) =>
            e.id === eventId ? { ...e, registered: e.registered + 1 } : e,
          ),
          addToastMessage: isFull
            ? "Added to waitlist — event is full"
            : "Registration successful! Ticket issued.",
        };

        if (!isFull) {
          const newTicket: Ticket = {
            id: `tkt-${Date.now()}`,
            eventId,
            eventTitle: event.title,
            ticketCode: `PUV-${eventId.toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            issuedAt: new Date().toISOString(),
            status: "active",
          };
          updates.tickets = [...get().tickets, newTicket];
        }

        set(updates);
      },

      cancelRegistration: (registrationId) => {
        set({
          registrations: get().registrations.map((r) =>
            r.id === registrationId ? { ...r, status: "cancelled" as const } : r,
          ),
          addToastMessage: "Registration cancelled",
        });
      },

      markNotificationRead: (id) => {
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        });
      },

      markAllNotificationsRead: () => {
        set({
          notifications: get().notifications.map((n) => ({ ...n, read: true })),
        });
      },

      approveEvent: (eventId) => {
        set({
          events: get().events.map((e) =>
            e.id === eventId ? { ...e, status: "published" as const } : e,
          ),
          addToastMessage: "Event approved and published",
        });
      },

      rejectEvent: (eventId) => {
        set({
          events: get().events.map((e) =>
            e.id === eventId ? { ...e, status: "cancelled" as const } : e,
          ),
          addToastMessage: "Event rejected",
        });
      },

      createEvent: (eventData) => {
        const newEvent: Event = {
          ...eventData,
          id: `evt-${Date.now()}`,
          registered: 0,
          status: "pending_approval",
        };
        set({
          events: [newEvent, ...get().events],
          addToastMessage: "Event created — pending super admin approval",
        });
      },

      setToastMessage: (msg) => set({ addToastMessage: msg }),
    }),
    {
      name: "puverse-demo",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        registrations: state.registrations,
        tickets: state.tickets,
        notifications: state.notifications,
      }),
    },
  ),
);
