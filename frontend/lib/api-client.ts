import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { BackendRole, UserStatus, UserType } from "@/types";
import { setAuthCookie, clearAuthCookie } from "./auth-cookie";

export type ApiUser = {
  id: string;
  fullName: string;
  email: string;
  role: BackendRole;
  userType: UserType;
  status: UserStatus;
  mustChangePassword?: boolean;
};

export type AuthResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user: ApiUser;
};
export type RefreshResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
};
export type RegisterRequest = { fullName: string; email: string; password: string; userType: UserType };
export type CreateUserRequest = { fullName: string; email: string; password: string; role: BackendRole; userType: UserType };
export type LoginRequest = { email: string; password: string };
export type EventStatus = "DRAFT" | "PENDING_APPROVAL" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED" | "PUBLISHED" | "COMPLETED";
export type Event = { id: string; title: string; slug?: string; description?: string; bannerUrl?: string; eventDate: string; startTime?: string; endTime?: string; venue?: string; status?: EventStatus; category?: string; organizer?: string; capacity?: number; registered?: number; communityId?: string; clubId?: string; community?: { id: string; name: string; slug: string }; club?: { id: string; name: string; slug: string };[key: string]: unknown };
export type CreateEventRequest = {
  title: string;
  description?: string;
  bannerUrl?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  communityId?: string;
  clubId?: string;
  ticketReleaseMode?: string;
  ticketReleaseHours?: number;
  ticketReleaseCustomDate?: string;
  scannedFieldsConfig?: string[];
};
export type UpdateEventRequest = Partial<CreateEventRequest>;
export type AgendaItem = { id: string; title: string; description?: string; startTime: string; endTime?: string; displayOrder: number };
export type AgendaRequest = Omit<AgendaItem, "id">;
export type Speaker = { id: string; name: string; designation?: string; organization?: string; bio?: string; photoUrl?: string; linkedinUrl?: string; displayOrder?: number };
export type SpeakerRequest = Omit<Speaker, "id">;
export type Sponsor = { id: string; name: string; logoUrl?: string; description?: string; websiteUrl?: string; sponsorshipLevel?: string; displayOrder?: number };
export type SponsorRequest = Omit<Sponsor, "id">;
export type ReorderRequest = { items: { id: string; displayOrder: number }[] };
export type RegistrationField = { key: string; label: string; category: string; inputType: string; systemMandatory: boolean; options?: string[]; required?: boolean };
export type RegistrationFormRequest = { selectedFields: { key: string; required: boolean }[] };
export type Registration = { id: string; eventId: string; ticketToken?: string; checkedInAt?: string; checkedInById?: string; checkedInByName?: string; scanCount?: number; scanHistory?: Array<{ volunteerId: string; volunteerName: string; scannedAt: string; scanNumber?: number }>; registrationData: Record<string, string>;[key: string]: unknown };
export type Volunteer = {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
  user?: { id: string; fullName: string; email: string; userType?: string; role?: string };
  assignedBy?: { id: string; fullName: string; email: string };
};
export type ScanResult = {
  success: boolean;
  status: "CHECKED_IN" | "ALREADY_CHECKED_IN" | "EXPIRED" | "LOCKED";
  alreadyCheckedIn: boolean;
  registrationId: string;
  ticketToken: string;
  attendeeName: string;
  attendeeEmail: string;
  checkedInAt: string;
  scanCount: number;
  scannedBy: string;
  firstScannedBy?: string;
  visibleFields: Record<string, string>;
  scanHistory?: Array<{ volunteerId: string; volunteerName: string; scannedAt: string; scanNumber?: number }>;
};
export type AttendanceItem = {
  id: string;
  ticketToken?: string;
  attendeeName: string;
  attendeeEmail: string;
  registrationData: Record<string, string>;
  checkedInAt: string | null;
  checkedInById: string | null;
  checkedInByName: string | null;
  scanCount: number;
  scanHistory: Array<{ volunteerId: string; volunteerName: string; scannedAt: string; scanNumber?: number }>;
  registeredAt: string;
};
export type AttendanceResponse = {
  event: Event;
  metrics: {
    totalRegistered: number;
    totalCheckedIn: number;
    pendingCheckIn: number;
    checkedInPercentage: number;
    scannedByMe: number;
  };
  registrations: AttendanceItem[];
};
export type AdminEvent = Event & {
  createdBy?: { id: string; fullName: string; email: string };
  _count?: { registrations: number };
};
export type MyRegistration = {
  id: string;
  eventId: string;
  status: "ACTIVE" | "CANCELLED";
  ticketToken: string | null;
  checkedInAt: string | null;
  registeredAt: string;
  event: {
    id: string;
    title: string;
    slug: string;
    eventDate: string;
    startTime: string | null;
    endTime: string | null;
    venue: string | null;
    status: EventStatus;
    bannerUrl: string | null;
  };
};
export type ApiError = { statusCode?: number; message?: string | string[]; timestamp?: string; path?: string };

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
export const ACCESS_TOKEN_KEY = "puverse.accessToken";
export const REFRESH_TOKEN_KEY = "puverse.refreshToken";
export const SESSION_ID_KEY = "puverse.sessionId";
export const USER_KEY = "puverse.user";

export function getAccessToken() {
  return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshSession() {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!refreshToken || !sessionId) return null;
  return { refreshToken, sessionId };
}

export function storeAuthTokens(accessToken: string, refreshToken: string, sessionId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(SESSION_ID_KEY, sessionId);
    setAuthCookie(accessToken);
  }
}

export function clearAuthStorage() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(USER_KEY);
    clearAuthCookie();
  }
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    const message = data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
    if (!error.response) return "Unable to reach the PUVerse backend.";
    return `Request failed with status ${error.response.status}.`;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

const client = axios.create({ baseURL: API_URL, headers: { "Content-Type": "application/json" } });

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

// ── Request-level caches (TTL = 30 s in dev, 0 in test) ─────────────────────
// eventListCache: deduplicate parallel calls that fire on the same page mount.
// A 30-second TTL means HMR reloads still get fresh data without hammering
// the backend on every keystroke.
const EVENT_LIST_TTL_MS = 30_000;
const eventListCache = {
  promise: null as Promise<Event[]> | null,
  expiresAt: 0,
};
const eventDetailCache = new Map<string, { promise: Promise<Event>; expiresAt: number }>();

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      const session = getRefreshSession();
      if (session) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            refreshQueue.push((token) => {
              if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(client.request(originalRequest));
            });
          });
        }
        originalRequest._retry = true;
        isRefreshing = true;
        try {
          const res = await axios.post<RefreshResponse>(`${API_URL}/auth/refresh`, session);
          const { accessToken, refreshToken, sessionId } = res.data;
          storeAuthTokens(accessToken, refreshToken, sessionId);
          refreshQueue.forEach((cb) => cb(accessToken));
          refreshQueue = [];
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return client.request(originalRequest);
        } catch {
          refreshQueue = [];
          clearAuthStorage();
          if (typeof window !== "undefined" && window.location.pathname !== "/login") window.location.assign("/login");
        } finally {
          isRefreshing = false;
        }
      } else {
        clearAuthStorage();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

async function request<T>(config: AxiosRequestConfig) {
  const response = await client.request<T>(config);
  return response.data;
}

export const api = {
  auth: {
    register: (body: RegisterRequest) => request<{ message: string; user: ApiUser }>({ method: "POST", url: "/auth/register", data: body }),
    login: (body: LoginRequest) => request<AuthResponse>({ method: "POST", url: "/auth/login", data: body }),
    logout: () => request<{ message: string }>({ method: "POST", url: "/auth/logout" }),
    logoutAll: () => request<{ message: string }>({ method: "POST", url: "/auth/logout-all" }),
    me: () => request<{ userId: string; email: string; role: BackendRole; userType: UserType; sessionId: string }>({ method: "GET", url: "/auth/me" }),
    changePassword: (body: { currentPassword: string; newPassword: string }) => request<{ message: string }>({ method: "POST", url: "/auth/password", data: body }),
    forgotPassword: (email: string) => request<{ message: string }>({ method: "POST", url: "/auth/forgot-password", data: { email } }),
    resetPassword: (body: { token: string; email?: string; newPassword: string }) => request<{ success: boolean; message: string }>({ method: "POST", url: "/auth/reset-password", data: body }),
  },
  users: {
    me: () => request<ApiUser>({ method: "GET", url: "/users/me" }),
    list: () => request<ApiUser[]>({ method: "GET", url: "/users" }),
    create: (body: CreateUserRequest) => request<{ message: string; user: ApiUser }>({ method: "POST", url: "/users", data: body }),
    get: (id: string) => request<ApiUser>({ method: "GET", url: `/users/${id}` }),
    updateRole: (id: string, role: BackendRole) => request<ApiUser>({ method: "PATCH", url: `/users/${id}/role`, data: { role } }),
    delete: (id: string) => request<{ message: string; userId: string }>({ method: "DELETE", url: `/users/${id}` }),
  },
  events: {
    create: (body: CreateEventRequest) => request<Event>({ method: "POST", url: "/events", data: body }),
    list: () => {
      const now = Date.now();
      if (!eventListCache.promise || now > eventListCache.expiresAt) {
        eventListCache.promise = request<Event[]>({ method: "GET", url: "/events" });
        eventListCache.expiresAt = now + EVENT_LIST_TTL_MS;
      }
      return eventListCache.promise;
    },
    mine: () => request<Event[]>({ method: "GET", url: "/events/my" }),
    get: (id: string) => {
      const now = Date.now();
      const cached = eventDetailCache.get(id);
      if (cached && now < cached.expiresAt) return cached.promise;
      const promise = request<Event>({ method: "GET", url: `/events/${id}` });
      eventDetailCache.set(id, { promise, expiresAt: now + EVENT_LIST_TTL_MS });
      return promise;
    },
    preview: (id: string) => request<{ event: Event; agenda: AgendaItem[]; speakers: Speaker[]; sponsors: Sponsor[]; registrationForm: unknown }>({ method: "GET", url: `/events/${id}/preview` }),
    update: (id: string, body: UpdateEventRequest) => {
      eventListCache.promise = null;
      eventListCache.expiresAt = 0;
      eventDetailCache.delete(id);
      return request<Event>({ method: "PATCH", url: `/events/${id}`, data: body });
    },
    remove: (id: string) => request<{ message: string }>({ method: "DELETE", url: `/events/${id}` }),
    submit: (id: string) => request<Event>({ method: "POST", url: `/events/${id}/submit` }),
    resubmit: (id: string) => request<Event>({ method: "POST", url: `/events/${id}/resubmit` }),
    publish: (id: string) => request<Event>({ method: "POST", url: `/events/${id}/publish` }),
    agenda: {
      create: (eventId: string, body: AgendaRequest) => request<AgendaItem>({ method: "POST", url: `/events/${eventId}/agenda`, data: body }),
      list: (eventId: string) => request<AgendaItem[]>({ method: "GET", url: `/events/${eventId}/agenda` }),
      update: (eventId: string, agendaId: string, body: Partial<AgendaRequest>) => request<AgendaItem>({ method: "PATCH", url: `/events/${eventId}/agenda/${agendaId}`, data: body }),
      reorder: (eventId: string, body: ReorderRequest) => request<AgendaItem[]>({ method: "PATCH", url: `/events/${eventId}/agenda/reorder`, data: body }),
      remove: (eventId: string, agendaId: string) => request<void>({ method: "DELETE", url: `/events/${eventId}/agenda/${agendaId}` }),
    },
    speakers: {
      create: (eventId: string, body: SpeakerRequest) => request<Speaker>({ method: "POST", url: `/events/${eventId}/speakers`, data: body }),
      list: (eventId: string) => request<Speaker[]>({ method: "GET", url: `/events/${eventId}/speakers` }),
      get: (eventId: string, speakerId: string) => request<Speaker>({ method: "GET", url: `/events/${eventId}/speakers/${speakerId}` }),
      update: (eventId: string, speakerId: string, body: Partial<SpeakerRequest>) => request<Speaker>({ method: "PATCH", url: `/events/${eventId}/speakers/${speakerId}`, data: body }),
      reorder: (eventId: string, body: ReorderRequest) => request<Speaker[]>({ method: "PATCH", url: `/events/${eventId}/speakers/reorder`, data: body }),
      remove: (eventId: string, speakerId: string) => request<void>({ method: "DELETE", url: `/events/${eventId}/speakers/${speakerId}` }),
    },
    sponsors: {
      create: (eventId: string, body: SponsorRequest) => request<Sponsor>({ method: "POST", url: `/events/${eventId}/sponsors`, data: body }),
      list: (eventId: string) => request<Sponsor[]>({ method: "GET", url: `/events/${eventId}/sponsors` }),
      get: (eventId: string, sponsorId: string) => request<Sponsor>({ method: "GET", url: `/events/${eventId}/sponsors/${sponsorId}` }),
      update: (eventId: string, sponsorId: string, body: Partial<SponsorRequest>) => request<Sponsor>({ method: "PATCH", url: `/events/${eventId}/sponsors/${sponsorId}`, data: body }),
      reorder: (eventId: string, body: ReorderRequest) => request<Sponsor[]>({ method: "PATCH", url: `/events/${eventId}/sponsors/reorder`, data: body }),
      remove: (eventId: string, sponsorId: string) => request<void>({ method: "DELETE", url: `/events/${eventId}/sponsors/${sponsorId}` }),
    },
    registrationForm: {
      fields: () => request<RegistrationField[]>({ method: "GET", url: "/registration-fields" }),
      create: (eventId: string, body: RegistrationFormRequest) => request<unknown>({ method: "POST", url: `/events/${eventId}/registration-form`, data: body }),
      get: (eventId: string) => request<unknown>({ method: "GET", url: `/events/${eventId}/registration-form` }),
      getPublic: (eventId: string) => request<unknown>({ method: "GET", url: `/events/${eventId}/registration-form/public` }),
      update: (eventId: string, body: RegistrationFormRequest) => request<unknown>({ method: "PATCH", url: `/events/${eventId}/registration-form`, data: body }),
    },
    registrations: {
      register: (eventId: string, registrationData: Record<string, string>) => request<Registration>({ method: "POST", url: `/events/${eventId}/registrations`, data: { registrationData } }),
      me: (eventId: string) => request<Registration>({ method: "GET", url: `/events/${eventId}/registrations/me` }),
      qr: (eventId: string) => `${API_URL}/events/${eventId}/registrations/me/qr`,
      count: (eventId: string) => request<{ eventId: string; totalRegistrations: number }>({ method: "GET", url: `/events/${eventId}/registrations/count` }),
      list: (eventId: string) => request<Registration[]>({ method: "GET", url: `/events/${eventId}/registrations` }),
      get: (eventId: string, registrationId: string) => request<Registration>({ method: "GET", url: `/events/${eventId}/registrations/${registrationId}` }),
      cancel: (eventId: string, registrationId: string) => request<void>({ method: "DELETE", url: `/events/${eventId}/registrations/${registrationId}` }),
    },
    volunteers: {
      assign: (eventId: string, identifier: string) => request<Volunteer>({ method: "POST", url: `/events/${eventId}/volunteers`, data: { identifier } }),
      list: (eventId: string) => request<Volunteer[]>({ method: "GET", url: `/events/${eventId}/volunteers` }),
      remove: (eventId: string, volunteerId: string) => request<{ message: string }>({ method: "DELETE", url: `/events/${eventId}/volunteers/${volunteerId}` }),
    },
    attendance: {
      scan: (eventId: string, ticketToken: string) => request<ScanResult>({ method: "POST", url: `/events/${eventId}/attendance/scan`, data: { ticketToken } }),
      list: (eventId: string) => request<AttendanceResponse>({ method: "GET", url: `/events/${eventId}/attendance/list` }),
    },
    ticketSettings: {
      update: (eventId: string, data: { ticketReleaseMode?: string; ticketReleaseHours?: number; ticketReleaseCustomDate?: string; scannedFieldsConfig?: string[] }) =>
        request<Event>({ method: "PATCH", url: `/events/${eventId}/ticket-settings`, data }),
    },
  },
  registrations: {
    mine: (limit?: number) =>
      request<MyRegistration[]>({ method: "GET", url: "/registrations/me", params: limit ? { limit } : undefined }),
  },
  volunteers: {
    myEvents: () => request<Event[]>({ method: "GET", url: "/volunteers/my-events" }),
  },
  admin: {
    events: {
      all: () => request<AdminEvent[]>({ method: "GET", url: "/admin/events/all" }),
      pending: () => request<Event[]>({ method: "GET", url: "/admin/events/pending" }),
      get: (id: string) => request<Event>({ method: "GET", url: `/admin/events/${id}` }),
      approve: (id: string, remarks?: string) => request<Event>({ method: "PATCH", url: `/admin/events/${id}/approve`, data: { remarks } }),
      requestChanges: (id: string, remarks?: string) => request<Event>({ method: "PATCH", url: `/admin/events/${id}/request-changes`, data: { remarks } }),
      reject: (id: string, remarks?: string) => request<Event>({ method: "PATCH", url: `/admin/events/${id}/reject`, data: { remarks } }),
    },
  },
  communities: {
    list: () => request<import("@/types").Community[]>({ method: "GET", url: "/communities" }),
    get: (slugOrId: string) => request<import("@/types").Community>({ method: "GET", url: `/communities/${slugOrId}` }),
    create: (body: { name: string; slug?: string; shortDescription?: string; fullDescription?: string; bannerUrl?: string; logoUrl?: string; headId?: string }) =>
      request<import("@/types").Community>({ method: "POST", url: "/communities", data: body }),
    update: (id: string, body: Partial<{ name: string; slug: string; shortDescription: string; fullDescription: string; bannerUrl: string; logoUrl: string; headId: string }>) =>
      request<import("@/types").Community>({ method: "PATCH", url: `/communities/${id}`, data: body }),
    toggleStatus: (id: string, status: "ACTIVE" | "INACTIVE") =>
      request<import("@/types").Community>({ method: "PATCH", url: `/communities/${id}/status`, data: { status } }),
    assignMember: (id: string, body: { userId: string; role: "HEAD" | "CORE_MEMBER" }) =>
      request<import("@/types").Membership>({ method: "POST", url: `/communities/${id}/members`, data: body }),
    removeMember: (id: string, userId: string) =>
      request<{ message: string }>({ method: "DELETE", url: `/communities/${id}/members/${userId}` }),
    follow: (id: string) => request<{ isFollowing: boolean; followerCount: number }>({ method: "POST", url: `/communities/${id}/follow` }),
    unfollow: (id: string) => request<{ isFollowing: boolean; followerCount: number }>({ method: "DELETE", url: `/communities/${id}/follow` }),
  },
  clubs: {
    list: (communityId?: string) =>
      request<import("@/types").Club[]>({ method: "GET", url: "/clubs", params: communityId ? { communityId } : undefined }),
    get: (slugOrId: string) => request<import("@/types").Club>({ method: "GET", url: `/clubs/${slugOrId}` }),
    create: (body: { name: string; slug?: string; communityId?: string; shortDescription?: string; fullDescription?: string; bannerUrl?: string; logoUrl?: string; headId?: string }) =>
      request<import("@/types").Club>({ method: "POST", url: "/clubs", data: body }),
    update: (id: string, body: Partial<{ name: string; slug: string; communityId: string; shortDescription: string; fullDescription: string; bannerUrl: string; logoUrl: string; headId: string }>) =>
      request<import("@/types").Club>({ method: "PATCH", url: `/clubs/${id}`, data: body }),
    toggleStatus: (id: string, status: "ACTIVE" | "INACTIVE") =>
      request<import("@/types").Club>({ method: "PATCH", url: `/clubs/${id}/status`, data: { status } }),
    assignMember: (id: string, body: { userId: string; role: "HEAD" | "CORE_MEMBER" }) =>
      request<import("@/types").Membership>({ method: "POST", url: `/clubs/${id}/members`, data: body }),
    removeMember: (id: string, userId: string) =>
      request<{ message: string }>({ method: "DELETE", url: `/clubs/${id}/members/${userId}` }),
    follow: (id: string) => request<{ isFollowing: boolean; followerCount: number }>({ method: "POST", url: `/clubs/${id}/follow` }),
    unfollow: (id: string) => request<{ isFollowing: boolean; followerCount: number }>({ method: "DELETE", url: `/clubs/${id}/follow` }),
  },
  updates: {
    myAssignments: () => request<import("@/types").MyAssignment>({ method: "GET", url: "/updates/my-assignments" }),
    pending: () => request<import("@/types").EntityUpdate[]>({ method: "GET", url: "/updates/pending" }),
    create: (body: { title: string; content: string; imageUrl?: string; communityId?: string; clubId?: string }) =>
      request<import("@/types").EntityUpdate>({ method: "POST", url: "/updates", data: body }),
    update: (id: string, body: Partial<{ title: string; content: string; imageUrl: string }>) =>
      request<import("@/types").EntityUpdate>({ method: "PATCH", url: `/updates/${id}`, data: body }),
    submit: (id: string) => request<import("@/types").EntityUpdate>({ method: "POST", url: `/updates/${id}/submit` }),
    approve: (id: string, remarks?: string) => request<import("@/types").EntityUpdate>({ method: "PATCH", url: `/updates/${id}/approve`, data: { remarks } }),
    reject: (id: string, remarks?: string) => request<import("@/types").EntityUpdate>({ method: "PATCH", url: `/updates/${id}/reject`, data: { remarks } }),
    delete: (id: string) => request<{ message: string }>({ method: "DELETE", url: `/updates/${id}` }),
  },
  notifications: {
    list: () => request<import("@/types").NotificationItem[]>({ method: "GET", url: "/notifications" }),
    markRead: (id: string) => request<{ message: string }>({ method: "PATCH", url: `/notifications/${id}/read` }),
    markAllRead: () => request<{ message: string }>({ method: "PATCH", url: "/notifications/read-all" }),
  },
  health: () => request<{ status: string }>({ method: "GET", url: "/health" }),
};

