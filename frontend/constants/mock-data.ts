import type {
  AttendanceRecord,
  Certificate,
  Event,
  NotificationItem,
  Organization,
  Registration,
  RolePermission,
  StaffMember,
  Ticket,
  User,
} from "@/types";

export const DEMO_USERS: Record<string, User> = {
  student: {
    id: "u1",
    name: "Aarav Sharma",
    email: "aarav@pu.ac.in",
    role: "student",
    backendRole: "PARTICIPANT",
    userType: "STUDENT",
    status: "ACTIVE",
    organization: "Computer Science Club",
    department: "CSE",
    year: "3rd Year",
  },
  admin: {
    id: "u2",
    name: "Priya Mehta",
    email: "priya@pu.ac.in",
    role: "admin",
    backendRole: "EVENT_ADMIN",
    userType: "FACULTY",
    status: "ACTIVE",
    organization: "Tech Fest Committee",
  },
  super_admin: {
    id: "u3",
    name: "Dr. Rajesh Kumar",
    email: "admin@pu.ac.in",
    role: "super_admin",
    backendRole: "SUPER_ADMIN",
    userType: "FACULTY",
    status: "ACTIVE",
    organization: "PU Administration",
  },
  platform_admin: {
    id: "u4",
    name: "System Administrator",
    email: "superadmin@pu.ac.in",
    role: "platform_admin",
    backendRole: "SUPER_ADMIN",
    userType: "FACULTY",
    status: "ACTIVE",
    organization: "PUVerse Platform",
  },
};

export const EVENTS: Event[] = [
  {
    id: "evt-1",
    title: "Annual Tech Symposium 2026",
    description:
      "A flagship technology conference featuring keynote speakers, workshops, and networking sessions for students and faculty.",
    organization: "Tech Fest Committee",
    venue: "Main Auditorium, Block A",
    startDate: "2026-08-15T09:00:00",
    endDate: "2026-08-15T18:00:00",
    capacity: 500,
    registered: 342,
    status: "published",
    category: "Conference",
    organizer: "Priya Mehta",
    requiresApproval: false,
    aboutEvent:
      "The Annual Tech Symposium is PU's most anticipated tech event bringing together industry leaders, researchers, and students under one roof. This year's theme — \"Building Tomorrow\" — explores the intersection of emerging technology and sustainable innovation. Expect deep-dive sessions on cloud-native architectures, generative AI, and quantum computing fundamentals.",
    timeline: [
      { day: "Day 1", time: "09:00 AM", title: "Opening Ceremony & Keynote", description: "Welcome address by the Dean followed by a keynote on the future of AI in education." },
      { day: "Day 1", time: "11:00 AM", title: "Workshop: Cloud-Native Development", description: "Hands-on session building micro-services with Kubernetes and Docker." },
      { day: "Day 1", time: "02:00 PM", title: "Panel Discussion", description: "Industry leaders discuss career paths in emerging tech fields." },
      { day: "Day 1", time: "04:30 PM", title: "Networking & Closing", description: "Open networking session with refreshments and certificate distribution." },
    ],
    speakers: [
      { name: "Dr. Ananya Krishnan", role: "Chief Guest", org: "Google DeepMind" },
      { name: "Rajiv Bansal", role: "Speaker", org: "Microsoft Research" },
      { name: "Sneha Iyer", role: "Speaker", org: "Razorpay Engineering" },
    ],
    galleryCount: 24,
    hasCertificate: true,
    organizers: [
      { name: "Priya Mehta", role: "President, Tech Fest Committee", email: "priya@pu.ac.in" },
      { name: "Vikram Joshi", role: "Event Coordinator", email: "vikram@pu.ac.in" },
      { name: "Ananya Das", role: "Logistics Head", email: "ananya@pu.ac.in" },
    ],
  },
  {
    id: "evt-2",
    title: "Web Development Bootcamp",
    description:
      "Hands-on bootcamp covering React, Next.js, and full-stack development with real-world projects.",
    organization: "Computer Science Club",
    venue: "Lab 204, IT Block",
    startDate: "2026-08-20T10:00:00",
    endDate: "2026-08-22T17:00:00",
    capacity: 60,
    registered: 58,
    status: "published",
    category: "Workshop",
    organizer: "Priya Mehta",
    requiresApproval: true,
  },
  {
    id: "evt-3",
    title: "Inter-College Hackathon",
    description:
      "48-hour hackathon with themes in AI, sustainability, and fintech. Teams of 2-4 members.",
    organization: "Innovation Cell",
    venue: "Innovation Hub",
    startDate: "2026-09-05T08:00:00",
    endDate: "2026-09-07T20:00:00",
    capacity: 200,
    registered: 156,
    status: "published",
    category: "Competition",
    organizer: "Priya Mehta",
    requiresApproval: false,
    teamSize: "2–4 members",
    aboutEvent:
      "The Inter-College Hackathon is a 48-hour coding marathon where student teams build innovative solutions around real-world problem statements. Mentors from partner companies guide teams through ideation, prototyping, and presentation. Top three teams receive cash prizes and internship offers.",
    timeline: [
      { day: "Day 1", time: "08:00 AM", title: "Check-in & Team Registration", description: "Verify teams, collect IDs, assign workstations." },
      { day: "Day 1", time: "10:00 AM", title: "Problem Statements Released", description: "Three tracks revealed: AI, Sustainability, Fintech." },
      { day: "Day 2", time: "10:00 AM", title: "Mentor Check-in Round", description: "Each team gets 15 minutes with an assigned mentor." },
      { day: "Day 3", time: "02:00 PM", title: "Final Pitches & Judging", description: "5-minute demo per team followed by Q&A with judges." },
      { day: "Day 3", time: "06:00 PM", title: "Awards Ceremony", description: "Winners announced, prizes distributed, group photo." },
    ],
    galleryCount: 18,
    hasCertificate: true,
    organizers: [
      { name: "Arjun Nair", role: "Lead Organizer, Innovation Cell", email: "arjun@pu.ac.in" },
      { name: "Meera Kapoor", role: "Sponsorship Head", email: "meera@pu.ac.in" },
    ],
  },
  {
    id: "evt-4",
    title: "Career Fair 2026",
    description:
      "Meet recruiters from top companies. Bring your resume and dress formally.",
    organization: "Placement Cell",
    venue: "Sports Complex",
    startDate: "2026-09-12T09:00:00",
    endDate: "2026-09-12T17:00:00",
    capacity: 1000,
    registered: 780,
    status: "published",
    category: "Career",
    organizer: "Dr. Rajesh Kumar",
    requiresApproval: false,
  },
  {
    id: "evt-5",
    title: "Photography Workshop",
    description: "Learn composition, lighting, and editing from professional photographers.",
    organization: "Cultural Committee",
    venue: "Art Gallery, Block C",
    startDate: "2026-08-25T14:00:00",
    endDate: "2026-08-25T17:00:00",
    capacity: 30,
    registered: 12,
    status: "pending_approval",
    category: "Workshop",
    organizer: "Priya Mehta",
    requiresApproval: false,
  },
  {
    id: "evt-6",
    title: "AI & Machine Learning Summit",
    description: "Industry experts discuss latest trends in AI, ML, and data science.",
    organization: "AI Research Lab",
    venue: "Seminar Hall 1",
    startDate: "2026-07-10T09:00:00",
    endDate: "2026-07-10T16:00:00",
    capacity: 150,
    registered: 150,
    status: "completed",
    category: "Conference",
    organizer: "Priya Mehta",
    requiresApproval: false,
  },
];

export const REGISTRATIONS: Registration[] = [
  {
    id: "reg-1",
    eventId: "evt-1",
    eventTitle: "Annual Tech Symposium 2026",
    studentName: "Aarav Sharma",
    studentEmail: "aarav@pu.ac.in",
    status: "registered",
    registeredAt: "2026-07-01T10:30:00",
  },
  {
    id: "reg-2",
    eventId: "evt-3",
    eventTitle: "Inter-College Hackathon",
    studentName: "Aarav Sharma",
    studentEmail: "aarav@pu.ac.in",
    status: "registered",
    registeredAt: "2026-07-05T14:20:00",
  },
  {
    id: "reg-3",
    eventId: "evt-2",
    eventTitle: "Web Development Bootcamp",
    studentName: "Aarav Sharma",
    studentEmail: "aarav@pu.ac.in",
    status: "waitlisted",
    registeredAt: "2026-07-10T09:15:00",
  },
];

export const TICKETS: Ticket[] = [
  {
    id: "tkt-1",
    eventId: "evt-1",
    eventTitle: "Annual Tech Symposium 2026",
    ticketCode: "PUV-EVT1-AARAV-7X2K",
    issuedAt: "2026-07-01T10:31:00",
    status: "active",
  },
  {
    id: "tkt-2",
    eventId: "evt-3",
    eventTitle: "Inter-College Hackathon",
    ticketCode: "PUV-EVT3-AARAV-9M4P",
    issuedAt: "2026-07-05T14:21:00",
    status: "active",
  },
];

export const CERTIFICATES: Certificate[] = [
  {
    id: "cert-1",
    eventId: "evt-6",
    eventTitle: "AI & Machine Learning Summit",
    issuedAt: "2026-07-11T10:00:00",
    downloadUrl: "#",
  },
];

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Registration Confirmed",
    message: "You are registered for Annual Tech Symposium 2026.",
    read: false,
    createdAt: "2026-07-01T10:31:00",
    type: "success",
  },
  {
    id: "n2",
    title: "Waitlisted",
    message: "Web Development Bootcamp is full. You are on the waitlist.",
    read: false,
    createdAt: "2026-07-10T09:16:00",
    type: "warning",
  },
  {
    id: "n3",
    title: "Certificate Available",
    message: "Your certificate for AI & ML Summit is ready to download.",
    read: true,
    createdAt: "2026-07-11T10:05:00",
    type: "info",
  },
  {
    id: "n4",
    title: "Event Reminder",
    message: "Inter-College Hackathon starts in 7 days.",
    read: true,
    createdAt: "2026-08-29T08:00:00",
    type: "info",
  },
];

export const ORGANIZATIONS: Organization[] = [
  {
    id: "org-1",
    name: "Tech Fest Committee",
    type: "Committee",
    members: 45,
    events: 12,
    status: "active",
  },
  {
    id: "org-2",
    name: "Computer Science Club",
    type: "Club",
    members: 120,
    events: 8,
    status: "active",
  },
  {
    id: "org-3",
    name: "Innovation Cell",
    type: "Cell",
    members: 30,
    events: 5,
    status: "active",
  },
  {
    id: "org-4",
    name: "Cultural Committee",
    type: "Committee",
    members: 60,
    events: 15,
    status: "active",
  },
  {
    id: "org-5",
    name: "Photography Society",
    type: "Club",
    members: 25,
    events: 3,
    status: "inactive",
  },
];

export const ALL_USERS: User[] = [
  DEMO_USERS.student,
  DEMO_USERS.admin,
  DEMO_USERS.super_admin,
  DEMO_USERS.platform_admin,
  {
    id: "u5",
    name: "Neha Patel",
    email: "neha@pu.ac.in",
    role: "student",
    department: "ECE",
    year: "2nd Year",
  },
  {
    id: "u6",
    name: "Rahul Singh",
    email: "rahul@pu.ac.in",
    role: "student",
    department: "ME",
    year: "4th Year",
  },
  {
    id: "u7",
    name: "Sneha Reddy",
    email: "sneha@pu.ac.in",
    role: "admin",
    organization: "Cultural Committee",
  },
];

export const STAFF_MEMBERS: StaffMember[] = [
  { id: "s1", name: "Vikram Joshi", email: "vikram@pu.ac.in", role: "Scanner" },
  { id: "s2", name: "Ananya Das", email: "ananya@pu.ac.in", role: "Coordinator" },
  { id: "s3", name: "Karan Malhotra", email: "karan@pu.ac.in", role: "Help Desk" },
];

export const ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att-1",
    studentName: "Aarav Sharma",
    studentEmail: "aarav@pu.ac.in",
    checkedInAt: "2026-07-10T09:05:00",
    method: "qr",
  },
  {
    id: "att-2",
    studentName: "Neha Patel",
    studentEmail: "neha@pu.ac.in",
    checkedInAt: "2026-07-10T09:12:00",
    method: "qr",
  },
  {
    id: "att-3",
    studentName: "Rahul Singh",
    studentEmail: "rahul@pu.ac.in",
    checkedInAt: "2026-07-10T09:30:00",
    method: "manual",
  },
];

export const ROLE_PERMISSIONS: RolePermission[] = [
  {
    id: "r1",
    name: "Student",
    description: "Browse events, register, view tickets and certificates",
    permissions: ["events.read", "registrations.create", "tickets.read", "certificates.read"],
  },
  {
    id: "r2",
    name: "Admin",
    description: "Create and manage events, track attendance",
    permissions: [
      "events.create",
      "events.update",
      "registrations.read",
      "attendance.manage",
      "staff.assign",
    ],
  },
  {
    id: "r3",
    name: "Super Admin",
    description: "Approve events, manage users and organizations",
    permissions: [
      "events.approve",
      "users.manage",
      "organizations.manage",
      "analytics.read",
    ],
  },
  {
    id: "r4",
    name: "Platform Admin",
    description: "Full platform control including roles and system settings",
    permissions: ["*"],
  },
];

export const ANALYTICS = {
  totalUsers: 4520,
  totalEvents: 156,
  totalRegistrations: 12480,
  attendanceRate: 87,
  activeOrganizations: 28,
  pendingApprovals: 3,
  monthlyRegistrations: [420, 580, 720, 890, 650, 780, 920],
  topEvents: [
    { name: "Career Fair 2026", registrations: 780 },
    { name: "Annual Tech Symposium", registrations: 342 },
    { name: "Inter-College Hackathon", registrations: 156 },
  ],
};

export function getEventById(id: string) {
  return EVENTS.find((e) => e.id === id);
}

export function getRegistrationsForEvent(eventId: string) {
  return REGISTRATIONS.filter((r) => r.eventId === eventId);
}
