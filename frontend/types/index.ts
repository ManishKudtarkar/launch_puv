export type UserRole = "student" | "admin" | "super_admin" | "platform_admin";
export type BackendRole = "PARTICIPANT" | "EVENT_ADMIN" | "SUPER_ADMIN";
export type UserType = "STUDENT" | "FACULTY";
export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
export type EntityStatus = "ACTIVE" | "INACTIVE";
export type MembershipRole = "HEAD" | "CORE_MEMBER";
export type UpdateStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type NotificationType = "INFO" | "SUCCESS" | "WARNING";

export type EventStatus =
  | "draft"
  | "pending_approval"
  | "published"
  | "completed"
  | "cancelled";

export type RegistrationStatus = "registered" | "waitlisted" | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  backendRole?: BackendRole;
  userType?: UserType;
  status?: UserStatus;
  organization?: string;
  department?: string;
  year?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  members: number;
  events: number;
  status: "active" | "inactive";
}

export interface EventTimelineItem {
  day: string;
  time: string;
  title: string;
  description: string;
}

export interface EventSpeaker {
  name: string;
  role: string;
  org: string;
}

export interface EventOrganizer {
  name: string;
  role: string;
  email: string;
}

export interface Event {
  id: string;
  slug?: string;
  title: string;
  description: string;
  organization: string;
  venue: string;
  startDate: string;
  endDate: string;
  capacity: number;
  registered: number;
  status: EventStatus;
  category: string;
  organizer: string;
  requiresApproval: boolean;
  bannerUrl?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  thumbnail?: string;
  aboutEvent?: string;
  teamSize?: string;
  timeline?: EventTimelineItem[];
  speakers?: EventSpeaker[];
  galleryCount?: number;
  hasCertificate?: boolean;
  organizers?: EventOrganizer[];
}

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  studentName: string;
  studentEmail: string;
  status: RegistrationStatus;
  registeredAt: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  ticketCode: string;
  issuedAt: string;
  status: "active" | "used" | "expired";
}

export interface Certificate {
  id: string;
  eventId: string;
  eventTitle: string;
  issuedAt: string;
  downloadUrl: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: "info" | "success" | "warning";
  link?: string;
}

export interface MemberUser {
  id: string;
  fullName: string;
  email: string;
}

export interface Membership {
  id: string;
  userId: string;
  role: MembershipRole;
  communityId?: string;
  clubId?: string;
  user: MemberUser;
  createdAt: string;
  updatedAt: string;
}

export interface EntityUpdate {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  communityId?: string;
  clubId?: string;
  authorId: string;
  author: { id: string; fullName: string };
  status: UpdateStatus;
  reviewRemarks?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  bannerUrl?: string;
  logoUrl?: string;
  status: EntityStatus;
  headId?: string;
  head?: MemberUser;
  followerCount: number;
  clubCount: number;
  eventCount: number;
  approvedUpdateCount?: number;
  isFollowing: boolean;
  memberships?: Membership[];
  clubs?: Club[];
  updates?: EntityUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface Club {
  id: string;
  communityId?: string;
  community?: { id: string; name: string; slug: string };
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  bannerUrl?: string;
  logoUrl?: string;
  status: EntityStatus;
  headId?: string;
  head?: MemberUser;
  followerCount: number;
  eventCount: number;
  approvedUpdateCount?: number;
  isFollowing: boolean;
  memberships?: Membership[];
  updates?: EntityUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface MyAssignment {
  communities: Array<Community & { updates: EntityUpdate[] }>;
  clubs: Array<Club & { updates: EntityUpdate[] }>;
}


export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AttendanceRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  checkedInAt: string;
  method: "qr" | "manual";
}

export interface RolePermission {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}
