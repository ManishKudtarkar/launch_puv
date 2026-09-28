"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Squircle } from "@squircle-js/react";
import {
  api,
  getApiErrorMessage,
  type RegistrationField,
  type AgendaItem,
  type Speaker,
  type Sponsor,
  type Volunteer,
} from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileImage,
  Info,
  Plus,
  Trash2,
  Upload,
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Users,
  Eye,
} from "lucide-react";

const STEPS = [
  { label: "Basic Info", caption: "Identity & scope" },
  { label: "Details", caption: "Date & venue" },
  { label: "Agenda", caption: "Schedule" },
  { label: "Speakers", caption: "Guests & team" },
  { label: "Sponsors", caption: "Partners" },
  { label: "Registration Form", caption: "Field builder" },
  { label: "Tickets & Volunteers", caption: "Release & staff" },
  { label: "Preview", caption: "Review event" },
  { label: "Publish", caption: "Submit event" },
];

type EventDraft = {
  title: string;
  description: string;
  bannerUrl: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  communityId?: string;
  clubId?: string;
  agenda: AgendaItem[];
  speakers: Speaker[];
  sponsors: Sponsor[];
  registrationFields: RegistrationField[];
  ticketReleaseMode: string;
  ticketReleaseHours: number;
  ticketReleaseCustomDate: string;
  scannedFieldsConfig: string[];
  volunteers: Volunteer[];
};

const REGISTRATION_FIELD_LIBRARY: RegistrationField[] = [
  { key: "FULL_NAME", label: "Full Name", category: "SYSTEM", inputType: "TEXT", systemMandatory: true, required: true },
  { key: "EMAIL", label: "University Email", category: "SYSTEM", inputType: "EMAIL", systemMandatory: true, required: true },
  { key: "UNIVERSITY_ID", label: "University ID", category: "SYSTEM", inputType: "TEXT", systemMandatory: true, required: true },
  { key: "PHONE_NUMBER", label: "Phone Number", category: "SYSTEM", inputType: "PHONE", systemMandatory: true, required: true },
  { key: "COLLEGE", label: "College", category: "SYSTEM", inputType: "TEXT", systemMandatory: true, required: true },
  { key: "DEPARTMENT", label: "Department", category: "SYSTEM", inputType: "TEXT", systemMandatory: true, required: true },
  { key: "COURSE", label: "Course", category: "ACADEMIC", inputType: "TEXT", systemMandatory: false, required: false },
  { key: "YEAR", label: "Year", category: "ACADEMIC", inputType: "NUMBER", systemMandatory: false, required: false },
  { key: "SEMESTER", label: "Semester", category: "ACADEMIC", inputType: "NUMBER", systemMandatory: false, required: false },
  { key: "CGPA", label: "CGPA", category: "ACADEMIC", inputType: "NUMBER", systemMandatory: false, required: false },
  { key: "GENDER", label: "Gender", category: "PERSONAL", inputType: "TEXT", systemMandatory: false, required: false },
  { key: "DATE_OF_BIRTH", label: "Date of Birth", category: "PERSONAL", inputType: "DATE", systemMandatory: false, required: false },
  { key: "CITY", label: "City", category: "PERSONAL", inputType: "TEXT", systemMandatory: false, required: false },
  { key: "GITHUB", label: "GitHub Profile", category: "TECHNICAL", inputType: "URL", systemMandatory: false, required: false },
  { key: "LINKEDIN", label: "LinkedIn Profile", category: "TECHNICAL", inputType: "URL", systemMandatory: false, required: false },
  { key: "TECHNICAL_SKILLS", label: "Technical Skills", category: "TECHNICAL", inputType: "TEXTAREA", systemMandatory: false, required: false },
  { key: "PROGRAMMING_LANGUAGES", label: "Programming Languages", category: "TECHNICAL", inputType: "TEXTAREA", systemMandatory: false, required: false },
  { key: "TEAM_NAME", label: "Team Name", category: "HACKATHON", inputType: "TEXT", systemMandatory: false, required: false },
  { key: "TEAM_SIZE", label: "Team Size", category: "HACKATHON", inputType: "NUMBER", systemMandatory: false, required: false },
  { key: "PROJECT_TITLE", label: "Project Title", category: "HACKATHON", inputType: "TEXT", systemMandatory: false, required: false },
  { key: "PROJECT_DESCRIPTION", label: "Project Description", category: "HACKATHON", inputType: "TEXTAREA", systemMandatory: false, required: false },
  { key: "TECHNOLOGY_STACK", label: "Technology Stack", category: "HACKATHON", inputType: "TEXTAREA", systemMandatory: false, required: false },
  { key: "EXPERIENCE_LEVEL", label: "Experience Level", category: "WORKSHOP", inputType: "TEXT", systemMandatory: false, required: false },
  { key: "LEARNING_GOAL", label: "Learning Goal", category: "WORKSHOP", inputType: "TEXTAREA", systemMandatory: false, required: false },
];

const INITIAL_DRAFT: EventDraft = {
  title: "",
  description: "",
  bannerUrl: "",
  eventDate: new Date().toISOString().split("T")[0],
  startTime: `${new Date().toISOString().split("T")[0]}T09:00`,
  endTime: `${new Date().toISOString().split("T")[0]}T17:00`,
  venue: "Seminar Hall 2",
  communityId: undefined,
  clubId: undefined,
  agenda: [],
  speakers: [],
  sponsors: [],
  registrationFields: REGISTRATION_FIELD_LIBRARY.slice(0, 6),
  ticketReleaseMode: "IMMEDIATE",
  ticketReleaseHours: 24,
  ticketReleaseCustomDate: "",
  scannedFieldsConfig: ["FULL_NAME", "EMAIL", "UNIVERSITY_ID", "PHONE_NUMBER", "DEPARTMENT"],
  volunteers: [],
};

const glassStyle = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};

const inputStyle = {
  background: "hsl(0 0% 100% / 0.55)",
  border: "1px solid hsl(0 0% 85% / 0.5)",
  borderRadius: "14px",
};

const inputClass =
  "w-full px-4 py-3 text-[0.84rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-30";

const labelClass =
  "block text-[0.68rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-2";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const eventIdParam = searchParams.get("event");
  const initialCommunityId = searchParams.get("communityId") || undefined;
  const initialClubId = searchParams.get("clubId") || undefined;

  const [currentEventId, setCurrentEventId] = useState<string | null>(eventIdParam);
  const [eventStatus, setEventStatus] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<EventDraft>({
    ...INITIAL_DRAFT,
    communityId: initialCommunityId,
    clubId: initialClubId,
  });
  const [cover, setCover] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaveSuccess, setDraftSaveSuccess] = useState("");
  const [draftSaveError, setDraftSaveError] = useState("");
  const [savingRegistrationForm, setSavingRegistrationForm] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [saveErrorMessage, setSaveErrorMessage] = useState("");
  const [savingTicketSettings, setSavingTicketSettings] = useState(false);
  const [ticketSaveSuccess, setTicketSaveSuccess] = useState("");
  const [ticketSaveError, setTicketSaveError] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(!!eventIdParam);

  const [availableCommunities, setAvailableCommunities] = useState<Array<{ id: string; name: string }>>([]);
  const [availableClubs, setAvailableClubs] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // Sync currentEventId with param
  useEffect(() => {
    if (eventIdParam) {
      setCurrentEventId(eventIdParam);
    }
  }, [eventIdParam]);

  // Load available communities and clubs based on user role
  useEffect(() => {
    let active = true;
    setLoadingAssignments(true);

    if (user?.role === "PARTICIPANT") {
      api.updates.myAssignments()
        .then((res) => {
          if (!active) return;
          const comms = (res.communities || []).map((c) => ({ id: c.id, name: c.name }));
          const cls = (res.clubs || []).map((c) => ({ id: c.id, name: c.name }));
          setAvailableCommunities(comms);
          setAvailableClubs(cls);

          // If no organization preselected, and user has exactly 1 assignment, auto-select it
          setDraft((prev) => {
            if (prev.communityId || prev.clubId) return prev;
            if (comms.length === 1 && cls.length === 0) return { ...prev, communityId: comms[0].id };
            if (cls.length === 1 && comms.length === 0) return { ...prev, clubId: cls[0].id };
            return prev;
          });
        })
        .catch(() => { })
        .finally(() => {
          if (active) setLoadingAssignments(false);
        });
    } else {
      // Event Admin or Super Admin: can load all active communities/clubs
      Promise.allSettled([api.communities.list(), api.clubs.list()]).then(([commRes, clubRes]) => {
        if (!active) return;
        if (commRes.status === "fulfilled") {
          setAvailableCommunities(commRes.value.map((c) => ({ id: c.id, name: c.name })));
        }
        if (clubRes.status === "fulfilled") {
          setAvailableClubs(clubRes.value.map((c) => ({ id: c.id, name: c.name })));
        }
        setLoadingAssignments(false);
      });
    }

    return () => {
      active = false;
    };
  }, [user?.role]);

  // Load existing event data if eventId is present
  useEffect(() => {
    if (!currentEventId) return;
    let active = true;
    setLoadingInitial(true);

    Promise.allSettled([
      api.events.preview(currentEventId).catch(() => api.events.get(currentEventId)),
      api.events.agenda.list(currentEventId).catch(() => []),
      api.events.speakers.list(currentEventId).catch(() => []),
      api.events.sponsors.list(currentEventId).catch(() => []),
      api.events.registrationForm.get(currentEventId).catch(() => null),
    ]).then(([previewRes, agendaRes, speakersRes, sponsorsRes, formRes]) => {
      if (!active) return;

      const previewData: any = previewRes.status === "fulfilled" ? previewRes.value : null;
      const eventData = previewData?.event || previewData;

      if (eventData) {
        // Track the existing event status so we can use resubmit vs submit appropriately
        setEventStatus(eventData.status || null);
        setDraft((prev) => ({
          ...prev,
          title: eventData.title || "",
          description: eventData.description || "",
          bannerUrl: eventData.bannerUrl || "",
          eventDate: eventData.eventDate ? eventData.eventDate.split("T")[0] : prev.eventDate,
          startTime: eventData.startTime ? eventData.startTime.slice(0, 16) : prev.startTime,
          endTime: eventData.endTime ? eventData.endTime.slice(0, 16) : prev.endTime,
          venue: eventData.venue || "",
          communityId: eventData.communityId || prev.communityId,
          clubId: eventData.clubId || prev.clubId,
          agenda:
            agendaRes.status === "fulfilled" && Array.isArray(agendaRes.value)
              ? (agendaRes.value as AgendaItem[])
              : prev.agenda,
          speakers:
            speakersRes.status === "fulfilled" && Array.isArray(speakersRes.value)
              ? (speakersRes.value as Speaker[])
              : prev.speakers,
          sponsors:
            sponsorsRes.status === "fulfilled" && Array.isArray(sponsorsRes.value)
              ? (sponsorsRes.value as Sponsor[])
              : prev.sponsors,
        }));
        if (eventData.bannerUrl) setCover(eventData.bannerUrl);
      }

      // Check registration form
      const rawForm = formRes.status === "fulfilled" ? formRes.value : previewData?.registrationForm;
      if (rawForm && typeof rawForm === "object") {
        const formObj = rawForm as { selectedFields?: { key: string; required?: boolean }[] };
        if (Array.isArray(formObj.selectedFields) && formObj.selectedFields.length > 0) {
          const libraryMap = new Map(REGISTRATION_FIELD_LIBRARY.map((f) => [f.key, f]));
          const loadedFields: RegistrationField[] = [];

          for (const item of formObj.selectedFields) {
            const def = libraryMap.get(item.key);
            if (def) {
              loadedFields.push({
                ...def,
                required: def.systemMandatory ? true : (item.required ?? false),
              });
            }
          }

          if (loadedFields.length > 0) {
            setDraft((prev) => ({ ...prev, registrationFields: loadedFields }));
          }
        }
      }
      setLoadingInitial(false);
    });

    return () => {
      active = false;
    };
  }, [currentEventId]);

  const updateDraft = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleCover = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setCover(dataUrl);
        updateDraft("bannerUrl", dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // ─── Save Changes (steps 0-4: Basic Info, Details, Agenda, Speakers, Sponsors) ───
  const saveChanges = async () => {
    setSavingDraft(true);
    setDraftSaveSuccess("");
    setDraftSaveError("");
    try {
      let activeEventId = currentEventId;

      const eventPayload = {
        title: draft.title.trim() || "Untitled Event Draft",
        ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
        // Only send bannerUrl if it's a real URL (not a data URI that's too large for the validator)
        ...(draft.bannerUrl && draft.bannerUrl.startsWith("http") ? { bannerUrl: draft.bannerUrl } : {}),
        eventDate: new Date(`${draft.eventDate}T00:00:00`).toISOString(),
        ...(draft.startTime ? { startTime: new Date(draft.startTime).toISOString() } : {}),
        ...(draft.endTime ? { endTime: new Date(draft.endTime).toISOString() } : {}),
        ...(draft.venue.trim() ? { venue: draft.venue.trim() } : {}),
        ...(draft.communityId ? { communityId: draft.communityId } : {}),
        ...(draft.clubId ? { clubId: draft.clubId } : {}),
      };

      if (activeEventId) {
        await api.events.update(activeEventId, eventPayload);
      } else {
        const created = await api.events.create(eventPayload);
        activeEventId = created.id;
        setCurrentEventId(created.id);
        window.history.replaceState(null, "", `${window.location.pathname}?event=${created.id}`);
      }

      // Save agenda items
      if (activeEventId && draft.agenda.length > 0) {
        for (const item of draft.agenda) {
          const agendaPayload = {
            title: item.title || "Session",
            description: item.description,
            startTime: new Date(item.startTime).toISOString(),
            endTime: item.endTime ? new Date(item.endTime).toISOString() : undefined,
            displayOrder: item.displayOrder,
          };
          if (item.id) {
            await api.events.agenda.update(activeEventId, item.id, agendaPayload).catch(() => { });
          } else {
            const saved = await api.events.agenda.create(activeEventId, agendaPayload);
            // update local id so re-saves don't duplicate
            setDraft((prev) => ({
              ...prev,
              agenda: prev.agenda.map((a, i) =>
                a === item ? { ...a, id: saved.id } : a
              ),
            }));
          }
        }
      }

      // Save speakers
      if (activeEventId && draft.speakers.length > 0) {
        for (const speaker of draft.speakers) {
          const speakerPayload = {
            name: speaker.name || "Speaker",
            designation: speaker.designation || undefined,
            organization: speaker.organization || undefined,
            bio: speaker.bio || undefined,
            photoUrl: speaker.photoUrl || undefined,
            linkedinUrl: speaker.linkedinUrl || undefined,
            displayOrder: speaker.displayOrder ?? 1,
          };
          if (speaker.id) {
            await api.events.speakers.update(activeEventId, speaker.id, speakerPayload).catch(() => { });
          } else {
            const saved = await api.events.speakers.create(activeEventId, speakerPayload);
            setDraft((prev) => ({
              ...prev,
              speakers: prev.speakers.map((s) =>
                s === speaker ? { ...s, id: saved.id } : s
              ),
            }));
          }
        }
      }

      // Save sponsors
      if (activeEventId && draft.sponsors.length > 0) {
        for (const sponsor of draft.sponsors) {
          const sponsorPayload = {
            name: sponsor.name || "Sponsor",
            logoUrl: sponsor.logoUrl || undefined,
            description: sponsor.description || undefined,
            websiteUrl: sponsor.websiteUrl || undefined,
            sponsorshipLevel: sponsor.sponsorshipLevel || undefined,
            displayOrder: sponsor.displayOrder ?? 1,
          };
          if (sponsor.id) {
            await api.events.sponsors.update(activeEventId, sponsor.id, sponsorPayload).catch(() => { });
          } else {
            const saved = await api.events.sponsors.create(activeEventId, sponsorPayload);
            setDraft((prev) => ({
              ...prev,
              sponsors: prev.sponsors.map((s) =>
                s === sponsor ? { ...s, id: saved.id } : s
              ),
            }));
          }
        }
      }

      setDraftSaveSuccess("Changes saved successfully!");
      setTimeout(() => setDraftSaveSuccess(""), 4000);
    } catch (error) {
      setDraftSaveError(getApiErrorMessage(error));
      setTimeout(() => setDraftSaveError(""), 5000);
    } finally {
      setSavingDraft(false);
    }
  };

  const saveRegistrationForm = async () => {
    setSavingRegistrationForm(true);
    setSaveSuccessMessage("");
    setSaveErrorMessage("");

    try {
      let activeEventId = currentEventId;

      // If no eventId exists yet, create the event draft first
      if (!activeEventId) {
        const created = await api.events.create({
          title: draft.title.trim() || "Untitled Event Draft",
          ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
          ...(draft.bannerUrl.trim() ? { bannerUrl: draft.bannerUrl.trim() } : {}),
          eventDate: new Date(`${draft.eventDate}T00:00:00`).toISOString(),
          ...(draft.startTime ? { startTime: new Date(draft.startTime).toISOString() } : {}),
          ...(draft.endTime ? { endTime: new Date(draft.endTime).toISOString() } : {}),
          ...(draft.venue.trim() ? { venue: draft.venue.trim() } : {}),
          ...(draft.communityId ? { communityId: draft.communityId } : {}),
          ...(draft.clubId ? { clubId: draft.clubId } : {}),
        });
        activeEventId = created.id;
        setCurrentEventId(created.id);
        const nextUrl = window.location.pathname + `?event=${created.id}`;
        window.history.replaceState(null, "", nextUrl);
      }

      const selectedFields = draft.registrationFields.map((field) => ({
        key: field.key,
        required: field.systemMandatory ? true : (field.required ?? false),
      }));

      try {
        await api.events.registrationForm.update(activeEventId, { selectedFields });
      } catch {
        await api.events.registrationForm.create(activeEventId, { selectedFields });
      }

      setSaveSuccessMessage("Registration form saved successfully! All fields will appear on the event page.");
      setTimeout(() => setSaveSuccessMessage(""), 5000);
    } catch (error) {
      setSaveErrorMessage(getApiErrorMessage(error));
    } finally {
      setSavingRegistrationForm(false);
    }
  };

  const saveTicketSettings = async () => {
    setSavingTicketSettings(true);
    setTicketSaveSuccess("");
    setTicketSaveError("");

    try {
      let activeEventId = currentEventId;

      if (!activeEventId) {
        const created = await api.events.create({
          title: draft.title.trim() || "Untitled Event Draft",
          ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
          ...(draft.bannerUrl.trim() ? { bannerUrl: draft.bannerUrl.trim() } : {}),
          eventDate: new Date(`${draft.eventDate}T00:00:00`).toISOString(),
          ...(draft.startTime ? { startTime: new Date(draft.startTime).toISOString() } : {}),
          ...(draft.endTime ? { endTime: new Date(draft.endTime).toISOString() } : {}),
          ...(draft.venue.trim() ? { venue: draft.venue.trim() } : {}),
          ...(draft.communityId ? { communityId: draft.communityId } : {}),
          ...(draft.clubId ? { clubId: draft.clubId } : {}),
          ticketReleaseMode: draft.ticketReleaseMode,
          ticketReleaseHours: draft.ticketReleaseHours,
          ticketReleaseCustomDate: draft.ticketReleaseCustomDate || undefined,
          scannedFieldsConfig: draft.scannedFieldsConfig,
        });
        activeEventId = created.id;
        setCurrentEventId(created.id);
        const nextUrl = window.location.pathname + `?event=${created.id}`;
        window.history.replaceState(null, "", nextUrl);
      }

      await api.events.ticketSettings.update(activeEventId, {
        ticketReleaseMode: draft.ticketReleaseMode,
        ticketReleaseHours: draft.ticketReleaseHours,
        ticketReleaseCustomDate: draft.ticketReleaseCustomDate || undefined,
        scannedFieldsConfig: draft.scannedFieldsConfig,
      });

      setTicketSaveSuccess("Ticket release schedule and volunteer scanner settings saved successfully!");
      setTimeout(() => setTicketSaveSuccess(""), 5000);
    } catch (error) {
      setTicketSaveError(getApiErrorMessage(error));
    } finally {
      setSavingTicketSettings(false);
    }
  };

  const publish = async () => {
    setPublishError("");
    setPublishing(true);
    try {
      let activeEventId = currentEventId;

      if (activeEventId) {
        await api.events.update(activeEventId, {
          title: draft.title.trim(),
          ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
          ...(draft.bannerUrl.trim() ? { bannerUrl: draft.bannerUrl.trim() } : {}),
          eventDate: new Date(`${draft.eventDate}T00:00:00`).toISOString(),
          ...(draft.startTime ? { startTime: new Date(draft.startTime).toISOString() } : {}),
          ...(draft.endTime ? { endTime: new Date(draft.endTime).toISOString() } : {}),
          ...(draft.venue.trim() ? { venue: draft.venue.trim() } : {}),
          ...(draft.communityId ? { communityId: draft.communityId } : {}),
          ...(draft.clubId ? { clubId: draft.clubId } : {}),
        });
      } else {
        const created = await api.events.create({
          title: draft.title.trim(),
          ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
          ...(draft.bannerUrl.trim() ? { bannerUrl: draft.bannerUrl.trim() } : {}),
          eventDate: new Date(`${draft.eventDate}T00:00:00`).toISOString(),
          ...(draft.startTime ? { startTime: new Date(draft.startTime).toISOString() } : {}),
          ...(draft.endTime ? { endTime: new Date(draft.endTime).toISOString() } : {}),
          ...(draft.venue.trim() ? { venue: draft.venue.trim() } : {}),
          ...(draft.communityId ? { communityId: draft.communityId } : {}),
          ...(draft.clubId ? { clubId: draft.clubId } : {}),
        });
        activeEventId = created.id;
        setCurrentEventId(created.id);
      }

      // Save Registration Form
      if (activeEventId) {
        const selectedFields = draft.registrationFields.map((field) => ({
          key: field.key,
          required: field.systemMandatory ? true : (field.required ?? false),
        }));
        try {
          await api.events.registrationForm.update(activeEventId, { selectedFields });
        } catch {
          await api.events.registrationForm.create(activeEventId, { selectedFields });
        }

        // Save agenda items that don't have an id yet
        for (const item of draft.agenda) {
          if (!item.id && item.title) {
            try {
              await api.events.agenda.create(activeEventId, {
                title: item.title,
                description: item.description,
                startTime: new Date(item.startTime).toISOString(),
                endTime: item.endTime ? new Date(item.endTime).toISOString() : undefined,
                displayOrder: item.displayOrder,
              });
            } catch { /* non-blocking */ }
          }
        }

        // Save speakers that don't have an id yet
        for (const speaker of draft.speakers) {
          if (!speaker.id && speaker.name) {
            try {
              await api.events.speakers.create(activeEventId, {
                name: speaker.name,
                designation: speaker.designation || undefined,
                organization: speaker.organization || undefined,
                bio: speaker.bio || undefined,
                photoUrl: speaker.photoUrl || undefined,
                linkedinUrl: speaker.linkedinUrl || undefined,
                displayOrder: speaker.displayOrder ?? 1,
              });
            } catch { /* non-blocking */ }
          }
        }

        // Save sponsors that don't have an id yet
        for (const sponsor of draft.sponsors) {
          if (!sponsor.id && sponsor.name) {
            try {
              await api.events.sponsors.create(activeEventId, {
                name: sponsor.name,
                logoUrl: sponsor.logoUrl || undefined,
                description: sponsor.description || undefined,
                websiteUrl: sponsor.websiteUrl || undefined,
                sponsorshipLevel: sponsor.sponsorshipLevel || undefined,
                displayOrder: sponsor.displayOrder ?? 1,
              });
            } catch { /* non-blocking */ }
          }
        }

        // Submit or Resubmit for approval depending on current event status
        try {
          if (eventStatus === "CHANGES_REQUESTED") {
            await api.events.resubmit(activeEventId);
          } else {
            await api.events.submit(activeEventId);
          }
        } catch {
          // Non-blocking: may already be submitted
        }
      }

      setSaved(true);
      // Redirect to admin events so the new status is visible
      setTimeout(() => router.push("/admin/events"), 1500);
    } catch (error) {
      setPublishError(getApiErrorMessage(error));
    } finally {
      setPublishing(false);
    }
  };

  const addSpeaker = () =>
    updateDraft("speakers", [
      ...draft.speakers,
      {
        id: "",
        name: "",
        designation: "",
        organization: "",
        bio: "",
        photoUrl: "",
        linkedinUrl: "",
        displayOrder: draft.speakers.length + 1,
      },
    ]);

  const updateSpeaker = (index: number, key: keyof Speaker, value: string | number) => {
    updateDraft("speakers", draft.speakers.map((speaker, i) => (i === index ? { ...speaker, [key]: value } : speaker)));
  };

  return (
    <div className="pb-32 w-full min-w-0">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 text-[0.78rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors mb-3 font-[family-name:var(--font-ui)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to events
          </Link>
          <h1 className="text-[clamp(1.35rem,2.5vw,1.85rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            {currentEventId ? "Edit Event" : "Create New Event"}
            <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal"> .</span>
          </h1>
          <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Build an event attendees will remember with custom registration fields.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
          <span className="w-2 h-2 rounded-full bg-[var(--positive)]" /> {currentEventId ? "Editing saved event" : "Draft"}
        </div>
      </div>

      {loadingInitial ? (
        <div className="py-16 text-center text-[0.85rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          Loading event details...
        </div>
      ) : (
        <>
          {/* Steps Wizard Bar — desktop: scrollable pill row | mobile: compact indicator */}
          <div className="flex sm:hidden items-center justify-between mb-4 px-1">
            <span className="text-[0.72rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)]">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-[0.72rem] font-medium text-[var(--accent)] font-[family-name:var(--font-display)]">
              {STEPS[step]?.label}
            </span>
          </div>
          <div className="hidden sm:flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {STEPS.map((item, index) => {
              const active = index === step;
              const complete = index < step;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setStep(index)}
                  className="min-w-[110px] sm:min-w-[125px] flex-1 text-left group outline-none focus:outline-none select-none cursor-pointer"
                >
                  <div className={`flex items-center gap-2 mb-2 ${active ? "text-[var(--col-primary)]" : "text-[var(--col-dim)]"}`}>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.62rem] font-semibold font-[family-name:var(--font-mono)] transition-all ${active
                        ? "bg-[var(--col-primary)] text-[var(--bg)] shadow-sm"
                        : complete
                          ? "bg-[var(--accent)] text-white"
                          : "border border-[var(--line)]"
                        }`}
                    >
                      {complete ? <Check className="w-3.5 h-3.5" /> : index + 1}
                    </span>
                    <span className="text-[0.7rem] font-medium whitespace-nowrap font-[family-name:var(--font-ui)]">
                      {item.label}
                    </span>
                  </div>
                  <div
                    className={`h-1 rounded-full transition-colors ${active ? "bg-[var(--accent)]" : complete ? "bg-[var(--accent)]/50" : "bg-[var(--line-soft)]"
                      }`}
                  />
                  <p className="mt-1 text-[0.58rem] text-[var(--col-dim)] whitespace-nowrap font-[family-name:var(--font-mono)]">
                    {item.caption}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Main Full-Width Form Container */}
          <div className="w-full min-w-0">
            <Squircle cornerRadius={24} cornerSmoothing={1} className="p-5 sm:p-7 min-h-[520px] w-full min-w-0" style={glassStyle}>
              {step === 0 && (
                <BasicInfo
                  draft={draft}
                  updateDraft={updateDraft}
                  cover={cover}
                  handleCover={handleCover}
                  setCover={setCover}
                  availableCommunities={availableCommunities}
                  availableClubs={availableClubs}
                  loadingAssignments={loadingAssignments}
                  isStudent={user?.role === "PARTICIPANT"}
                />
              )}
              {step === 1 && <Details draft={draft} updateDraft={updateDraft} />}
              {step === 2 && (
                <Agenda
                  agenda={draft.agenda}
                  addAgenda={() =>
                    updateDraft("agenda", [
                      ...draft.agenda,
                      { id: "", title: "", description: "", startTime: draft.startTime, endTime: draft.endTime, displayOrder: draft.agenda.length + 1 },
                    ])
                  }
                  updateAgenda={(index, key, value) =>
                    updateDraft("agenda", draft.agenda.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
                  }
                  removeAgenda={(index) =>
                    updateDraft(
                      "agenda",
                      draft.agenda.filter((_, i) => i !== index).map((item, i) => ({ ...item, displayOrder: i + 1 }))
                    )
                  }
                />
              )}
              {step === 3 && (
                <Speakers
                  speakers={draft.speakers}
                  addSpeaker={addSpeaker}
                  updateSpeaker={updateSpeaker}
                  removeSpeaker={(index) =>
                    updateDraft(
                      "speakers",
                      draft.speakers.filter((_, i) => i !== index).map((speaker, i) => ({ ...speaker, displayOrder: i + 1 }))
                    )
                  }
                />
              )}
              {step === 4 && (
                <Sponsors
                  sponsors={draft.sponsors}
                  addSponsor={() =>
                    updateDraft("sponsors", [
                      ...draft.sponsors,
                      { id: "", name: "", logoUrl: "", description: "", websiteUrl: "", sponsorshipLevel: "", displayOrder: draft.sponsors.length + 1 },
                    ])
                  }
                  updateSponsor={(index, key, value) =>
                    updateDraft("sponsors", draft.sponsors.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
                  }
                  removeSponsor={(index) =>
                    updateDraft(
                      "sponsors",
                      draft.sponsors.filter((_, i) => i !== index).map((item, i) => ({ ...item, displayOrder: i + 1 }))
                    )
                  }
                />
              )}
              {step === 5 && (
                <RegistrationFormBuilder
                  draft={draft}
                  updateDraft={updateDraft}
                  onSaveRegistrationForm={saveRegistrationForm}
                  savingRegistrationForm={savingRegistrationForm}
                  saveSuccessMessage={saveSuccessMessage}
                  saveErrorMessage={saveErrorMessage}
                />
              )}
              {step === 6 && (
                <TicketsAndVolunteersStep
                  draft={draft}
                  updateDraft={updateDraft}
                  eventId={currentEventId}
                  saveTicketSettings={saveTicketSettings}
                  savingTicketSettings={savingTicketSettings}
                  ticketSaveSuccess={ticketSaveSuccess}
                  ticketSaveError={ticketSaveError}
                />
              )}
              {step === 7 && <Preview draft={draft} cover={cover} />}
              {step === 8 && <PublishReview draft={draft} cover={cover} onPublish={publish} publishing={publishing} eventStatus={eventStatus} />}
            </Squircle>
          </div>
        </>
      )}

      {/* Fixed Bottom Wizard Navigation */}
      <div className="fixed bottom-0 left-0 md:left-[260px] right-0 z-30 border-t border-[var(--line-soft)] bg-[hsl(0_0%_96%_/_0.95)] backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <span className="hidden sm:inline text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
            Step {step + 1} of {STEPS.length} · {STEPS[step]?.label}
            {draftSaveSuccess && step <= 4 && (
              <span className="ml-3 text-emerald-600 font-semibold">
                ✓ Changes saved — you can proceed to the next step
              </span>
            )}
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {/* Save Changes button for steps 0–4 (Basic Info, Details, Agenda, Speakers, Sponsors) */}
            {step <= 4 && (
              <button
                type="button"
                onClick={saveChanges}
                disabled={savingDraft}
                className={`px-4 py-2.5 text-[0.74rem] font-medium rounded-[12px] hover:opacity-90 transition-all font-[family-name:var(--font-ui)] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${draftSaveSuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-[var(--accent)] text-white"
                  }`}
              >
                {savingDraft ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Saving...
                  </>
                ) : draftSaveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Saved ✓
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save Changes
                  </>
                )}
              </button>
            )}
            {step === 5 && (
              <button
                type="button"
                onClick={saveRegistrationForm}
                disabled={savingRegistrationForm}
                className="px-4 py-2.5 text-[0.74rem] font-medium bg-[var(--accent)] text-white rounded-[12px] hover:opacity-90 transition-opacity font-[family-name:var(--font-ui)] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {savingRegistrationForm ? "Saving..." : "Save Registration Form"}
              </button>
            )}
            {step === 6 && (
              <button
                type="button"
                onClick={saveTicketSettings}
                disabled={savingTicketSettings}
                className="px-4 py-2.5 text-[0.74rem] font-medium bg-[var(--accent)] text-white rounded-[12px] hover:opacity-90 transition-opacity font-[family-name:var(--font-ui)] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {savingTicketSettings ? "Saving..." : "Save Ticket Settings"}
              </button>
            )}
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 text-[0.74rem] font-medium text-[var(--col-secondary)] hover:text-[var(--col-primary)] border border-[var(--line)] rounded-[12px] hover:bg-[var(--surface-hover)] transition-colors font-[family-name:var(--font-ui)] cursor-pointer"
              >
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[0.74rem] font-medium bg-[var(--col-primary)] text-[var(--bg)] rounded-[12px] hover:opacity-85 transition-opacity font-[family-name:var(--font-display)] cursor-pointer"
              >
                Next Step <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={publish}
                disabled={publishing || !accessToken}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[0.74rem] font-medium bg-[var(--accent)] text-white rounded-[12px] hover:opacity-85 transition-opacity font-[family-name:var(--font-display)] disabled:opacity-50 cursor-pointer"
              >
                {publishing ? "Publishing..." : "Submit Event"} <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {publishError && (
        <div className="fixed bottom-20 left-5 z-[300] max-w-sm px-4 py-3 rounded-[12px] bg-[var(--danger-bg)] text-[var(--danger)] text-[0.74rem] font-[family-name:var(--font-ui)] shadow-xl border border-[var(--danger)]/20">
          {publishError}
        </div>
      )}
      {draftSaveSuccess && (
        <div className="fixed bottom-20 left-5 z-[300] max-w-sm px-4 py-3 rounded-[12px] bg-[hsl(142_50%_45%_/_0.12)] border border-[hsl(142_50%_45%_/_0.3)] text-[hsl(142_60%_30%)] text-[0.74rem] font-[family-name:var(--font-ui)] shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {draftSaveSuccess}
        </div>
      )}
      {draftSaveError && (
        <div className="fixed bottom-20 left-5 z-[300] max-w-sm px-4 py-3 rounded-[12px] bg-[var(--danger-bg)] text-[var(--danger)] text-[0.74rem] font-[family-name:var(--font-ui)] shadow-xl border border-[var(--danger)]/20">
          {draftSaveError}
        </div>
      )}
      {saved && (
        <div className="fixed bottom-20 right-5 z-[300] px-5 py-3.5 rounded-[14px] bg-[var(--col-primary)] text-[var(--bg)] text-[0.76rem] font-[family-name:var(--font-ui)] shadow-2xl flex items-center gap-3">
          <span>Event saved and submitted successfully!</span>
          <button
            type="button"
            onClick={() => {
              setSaved(false);
              router.push("/admin/events");
            }}
            className="text-[var(--accent-light)] font-bold hover:underline cursor-pointer"
          >
            View my events &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

function BasicInfo({
  draft,
  updateDraft,
  cover,
  handleCover,
  setCover,
  availableCommunities,
  availableClubs,
  loadingAssignments,
  isStudent,
}: {
  draft: EventDraft;
  updateDraft: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void;
  cover: string | null;
  handleCover: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setCover: (c: string | null) => void;
  availableCommunities: Array<{ id: string; name: string }>;
  availableClubs: Array<{ id: string; name: string }>;
  loadingAssignments: boolean;
  isStudent: boolean;
}) {
  const selectedOrgValue = draft.communityId
    ? `community:${draft.communityId}`
    : draft.clubId
      ? `club:${draft.clubId}`
      : "";

  const handleOrgChange = (val: string) => {
    if (!val) {
      updateDraft("communityId", undefined);
      updateDraft("clubId", undefined);
    } else if (val.startsWith("community:")) {
      updateDraft("communityId", val.replace("community:", ""));
      updateDraft("clubId", undefined);
    } else if (val.startsWith("club:")) {
      updateDraft("clubId", val.replace("club:", ""));
      updateDraft("communityId", undefined);
    }
  };

  const hasAnyAssignment = availableCommunities.length > 0 || availableClubs.length > 0;

  return (
    <div>
      <StepIntro number="01" title="The Essentials" description="Give your event an engaging title, organization scope, description, and banner." />
      <div className="space-y-5 mt-7">
        {/* Organizing Entity */}
        <div>
          <label className={labelClass}>
            Organizing Community / Club {isStudent ? "(Required)" : "(Optional)"}
          </label>
          {loadingAssignments ? (
            <div className="py-2.5 px-4 text-[0.78rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">
              Loading your assigned organizations...
            </div>
          ) : isStudent && !hasAnyAssignment ? (
            <div className="p-3.5 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger)]/20 text-[var(--danger)] text-[0.76rem] font-[family-name:var(--font-ui)]">
              You are not assigned as Head or Core Team Member of any Community or Club. Student events must be hosted under an assigned organization.
            </div>
          ) : (
            <select
              value={selectedOrgValue}
              onChange={(e) => handleOrgChange(e.target.value)}
              className={`${inputClass} cursor-pointer`}
              style={inputStyle}
            >
              <option value="">
                {isStudent ? "— Select your Community or Club —" : "— None (General / Independent Event) —"}
              </option>
              {availableCommunities.length > 0 && (
                <optgroup label="Communities">
                  {availableCommunities.map((c) => (
                    <option key={`comm-${c.id}`} value={`community:${c.id}`}>
                      Community: {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {availableClubs.length > 0 && (
                <optgroup label="Clubs">
                  {availableClubs.map((cl) => (
                    <option key={`club-${cl.id}`} value={`club:${cl.id}`}>
                      Club: {cl.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          )}
        </div>

        <Field label="Event title">
          <input
            value={draft.title}
            onChange={(e) => updateDraft("title", e.target.value)}
            placeholder="Enter event title"
            className={inputClass}
            style={inputStyle}
          />
        </Field>
        <Field label="Description (optional)">
          <textarea
            value={draft.description}
            onChange={(e) => updateDraft("description", e.target.value)}
            placeholder="Enter a detailed event description"
            className={`${inputClass} resize-none`}
            style={inputStyle}
            rows={4}
          />
        </Field>
        <Field label="Event Cover Banner (optional)">
          <div className="space-y-3">
            <input
              type="url"
              value={draft.bannerUrl}
              onChange={(e) => {
                updateDraft("bannerUrl", e.target.value);
                setCover(e.target.value || null);
              }}
              placeholder="Enter banner image URL (https://...)"
              className={inputClass}
              style={inputStyle}
            />
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[0.68rem] uppercase tracking-wider text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                Or upload image:
              </span>
              <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] border border-[var(--line)] bg-[hsl(0_0%_100%_/_0.5)] text-[0.74rem] text-[var(--col-primary)] font-medium cursor-pointer hover:border-[var(--accent)] transition-colors">
                <Upload className="w-3.5 h-3.5 text-[var(--accent)]" /> Choose Banner File
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCover} className="sr-only" />
              </label>
              {(cover || draft.bannerUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    setCover(null);
                    updateDraft("bannerUrl", "");
                  }}
                  className="text-[0.7rem] text-[var(--danger)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Remove image
                </button>
              )}
            </div>
            {(cover || draft.bannerUrl) && (
              <div className="relative w-full h-44 rounded-[16px] overflow-hidden border border-[var(--line-soft)] mt-2">
                <img src={cover || draft.bannerUrl} alt="Event banner preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </Field>
      </div>
    </div>
  );
}

function Details({ draft, updateDraft }: { draft: EventDraft; updateDraft: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void }) {
  return (
    <div>
      <StepIntro number="02" title="Date & Venue" description="Specify the schedule and location for your attendees." />
      <div className="space-y-5 mt-7">
        <Field label="Event date">
          <input type="date" value={draft.eventDate} onChange={(e) => updateDraft("eventDate", e.target.value)} className={inputClass} style={inputStyle} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Start time (optional)">
            <input
              type="time"
              value={draft.startTime ? draft.startTime.slice(11, 16) : ""}
              onChange={(e) => updateDraft("startTime", e.target.value ? `${draft.eventDate}T${e.target.value}` : "")}
              className={inputClass}
              style={inputStyle}
            />
          </Field>
          <Field label="End time (optional)">
            <input
              type="time"
              value={draft.endTime ? draft.endTime.slice(11, 16) : ""}
              onChange={(e) => updateDraft("endTime", e.target.value ? `${draft.eventDate}T${e.target.value}` : "")}
              className={inputClass}
              style={inputStyle}
            />
          </Field>
        </div>
        <Field label="Venue (optional)">
          <input value={draft.venue} onChange={(e) => updateDraft("venue", e.target.value)} placeholder="Enter venue or location" className={inputClass} style={inputStyle} />
        </Field>
      </div>
    </div>
  );
}

function Agenda({
  agenda,
  addAgenda,
  updateAgenda,
  removeAgenda,
}: {
  agenda: AgendaItem[];
  addAgenda: () => void;
  updateAgenda: (index: number, key: keyof AgendaItem, value: string | number) => void;
  removeAgenda: (index: number) => void;
}) {
  return (
    <div>
      <StepIntro number="03" title="Build the Agenda" description="Define the sequence of sessions, keynotes, and workshops." />
      <div className="mt-7 space-y-4">
        {agenda.map((item, index) => (
          <div key={index} className="p-4 rounded-[16px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.3)] space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_100px_36px]">
              <input
                value={item.title}
                onChange={(e) => updateAgenda(index, "title", e.target.value)}
                placeholder="Enter session title"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="number"
                min="1"
                value={item.displayOrder}
                onChange={(e) => updateAgenda(index, "displayOrder", Number(e.target.value))}
                placeholder="Display order"
                className={inputClass}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => removeAgenda(index)}
                className="w-9 h-9 rounded-[10px] border border-[var(--line-soft)] text-[var(--danger)] hover:bg-[var(--danger-bg)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="datetime-local"
                value={item.startTime}
                onChange={(e) => updateAgenda(index, "startTime", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="datetime-local"
                value={item.endTime || ""}
                onChange={(e) => updateAgenda(index, "endTime", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <textarea
              value={item.description || ""}
              onChange={(e) => updateAgenda(index, "description", e.target.value)}
              placeholder="Enter session overview or topics covered"
              className={`${inputClass} resize-none`}
              style={inputStyle}
              rows={2}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addAgenda}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-[12px] border border-dashed border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 text-[0.74rem] font-medium font-[family-name:var(--font-ui)] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add agenda item
        </button>
      </div>
    </div>
  );
}

function Speakers({
  speakers,
  addSpeaker,
  updateSpeaker,
  removeSpeaker,
}: {
  speakers: Speaker[];
  addSpeaker: () => void;
  updateSpeaker: (index: number, key: keyof Speaker, value: string | number) => void;
  removeSpeaker: (index: number) => void;
}) {
  return (
    <div>
      <StepIntro number="04" title="Add Speakers & Guests" description="Highlight distinguished speakers, dignitaries, and mentors." />
      <div className="mt-7 space-y-4">
        {speakers.map((speaker, index) => (
          <div key={index} className="p-4 rounded-[16px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.3)] space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={speaker.name}
                onChange={(e) => updateSpeaker(index, "name", e.target.value)}
                placeholder="Enter speaker full name"
                className={inputClass}
                style={inputStyle}
              />
              <input
                value={speaker.designation || ""}
                onChange={(e) => updateSpeaker(index, "designation", e.target.value)}
                placeholder="Enter speaker designation"
                className={inputClass}
                style={inputStyle}
              />
              <input
                value={speaker.organization || ""}
                onChange={(e) => updateSpeaker(index, "organization", e.target.value)}
                placeholder="Enter organization or company"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="number"
                min="1"
                value={speaker.displayOrder || index + 1}
                onChange={(e) => updateSpeaker(index, "displayOrder", Number(e.target.value))}
                placeholder="Enter display order"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="url"
                value={speaker.photoUrl || ""}
                onChange={(e) => updateSpeaker(index, "photoUrl", e.target.value)}
                placeholder="Enter speaker photo URL"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="url"
                value={speaker.linkedinUrl || ""}
                onChange={(e) => updateSpeaker(index, "linkedinUrl", e.target.value)}
                placeholder="Enter LinkedIn profile URL"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <textarea
              value={speaker.bio || ""}
              onChange={(e) => updateSpeaker(index, "bio", e.target.value)}
              placeholder="Enter speaker biography"
              className={`${inputClass} resize-none`}
              style={inputStyle}
              rows={2}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeSpeaker(index)}
                className="text-[0.7rem] text-[var(--danger)] hover:underline inline-flex items-center gap-1 font-[family-name:var(--font-ui)] cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Remove speaker
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addSpeaker}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-[12px] border border-dashed border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 text-[0.74rem] font-medium font-[family-name:var(--font-ui)] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add speaker
        </button>
      </div>
    </div>
  );
}

function Sponsors({
  sponsors,
  addSponsor,
  updateSponsor,
  removeSponsor,
}: {
  sponsors: Sponsor[];
  addSponsor: () => void;
  updateSponsor: (index: number, key: keyof Sponsor, value: string | number) => void;
  removeSponsor: (index: number) => void;
}) {
  return (
    <div>
      <StepIntro number="05" title="Add Sponsors & Partners" description="Acknowledge event sponsors, brands, and academic partners." />
      <div className="mt-7 space-y-4">
        {sponsors.map((sponsor, index) => (
          <div key={index} className="p-4 rounded-[16px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.3)] space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={sponsor.name}
                onChange={(e) => updateSponsor(index, "name", e.target.value)}
                placeholder="Enter sponsor company name"
                className={inputClass}
                style={inputStyle}
              />
              <input
                value={sponsor.sponsorshipLevel || ""}
                onChange={(e) => updateSponsor(index, "sponsorshipLevel", e.target.value)}
                placeholder="Enter sponsorship tier"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="url"
                value={sponsor.logoUrl || ""}
                onChange={(e) => updateSponsor(index, "logoUrl", e.target.value)}
                placeholder="Enter sponsor logo URL"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="url"
                value={sponsor.websiteUrl || ""}
                onChange={(e) => updateSponsor(index, "websiteUrl", e.target.value)}
                placeholder="Enter sponsor website URL"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <textarea
              value={sponsor.description || ""}
              onChange={(e) => updateSponsor(index, "description", e.target.value)}
              placeholder="Enter sponsor or partner description"
              className={`${inputClass} resize-none`}
              style={inputStyle}
              rows={2}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeSponsor(index)}
                className="text-[0.7rem] text-[var(--danger)] hover:underline inline-flex items-center gap-1 font-[family-name:var(--font-ui)] cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Remove partner
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addSponsor}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-[12px] border border-dashed border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 text-[0.74rem] font-medium font-[family-name:var(--font-ui)] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add sponsor / partner
        </button>
      </div>
    </div>
  );
}

const REGISTRATION_CATEGORIES = ["SYSTEM", "ACADEMIC", "PERSONAL", "TECHNICAL", "HACKATHON", "WORKSHOP"];

function RegistrationFormBuilder({
  draft,
  updateDraft,
  onSaveRegistrationForm,
  savingRegistrationForm,
  saveSuccessMessage,
  saveErrorMessage,
}: {
  draft: EventDraft;
  updateDraft: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void;
  onSaveRegistrationForm: () => Promise<void>;
  savingRegistrationForm: boolean;
  saveSuccessMessage: string;
  saveErrorMessage: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ACADEMIC");

  const selectedKeys = new Set(draft.registrationFields.map((field) => field.key));
  const choices = REGISTRATION_FIELD_LIBRARY.filter(
    (field) => field.category === selectedCategory && !field.systemMandatory
  );

  const addField = (field: RegistrationField) => {
    if (selectedKeys.has(field.key)) return;
    updateDraft("registrationFields", [...draft.registrationFields, { ...field, required: false }]);
  };

  const removeField = (key: string) => {
    const field = draft.registrationFields.find((item) => item.key === key);
    if (field?.systemMandatory) return;
    updateDraft("registrationFields", draft.registrationFields.filter((item) => item.key !== key));
  };

  const toggleRequired = (key: string) => {
    updateDraft(
      "registrationFields",
      draft.registrationFields.map((f) => {
        if (f.key !== key || f.systemMandatory) return f;
        return { ...f, required: !f.required };
      })
    );
  };

  return (
    <div className="w-full min-w-0">
      <StepIntro
        number="06"
        title="Custom Registration Form"
        description="Design the registration form attendees will fill out to register for this event on the public page."
      />

      {saveSuccessMessage && (
        <div className="mt-3 p-3.5 rounded-[12px] bg-[hsl(142_50%_45%_/_0.12)] border border-[hsl(142_50%_45%_/_0.3)] text-[hsl(142_60%_30%)] text-[0.76rem] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[hsl(142_60%_40%)]" />
          {saveSuccessMessage}
        </div>
      )}

      {saveErrorMessage && (
        <div className="mt-3 p-3.5 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger)]/30 text-[var(--danger)] text-[0.76rem]">
          {saveErrorMessage}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)] gap-6 items-start w-full min-w-0">
        {/* Left Column: Field Library */}
        <div className="rounded-[18px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.45)] p-5 min-w-0">
          <div className="mb-4">
            <label className={labelClass}>Field Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              {REGISTRATION_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[0.68rem] text-[var(--col-dim)] uppercase tracking-wider font-[family-name:var(--font-mono)] mb-3">
            Available {selectedCategory} Fields
          </p>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {choices.map((field) => {
              const isAdded = selectedKeys.has(field.key);
              return (
                <div
                  key={field.key}
                  className={`rounded-[14px] border p-3 transition-all ${isAdded
                    ? "border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.3)] opacity-60"
                    : "border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.7)] hover:border-[var(--accent)]"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[0.76rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-ui)] truncate">
                        {field.label}
                      </div>
                      <div className="mt-0.5 text-[0.62rem] uppercase tracking-[0.08em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                        {field.inputType}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isAdded}
                      onClick={() => addField(field)}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-[8px] border transition-all cursor-pointer ${isAdded
                        ? "border-[var(--line-soft)] text-[var(--col-dim)] cursor-not-allowed"
                        : "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                        }`}
                      title={isAdded ? "Already in form" : "Add to registration form"}
                    >
                      {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
            {choices.length === 0 && (
              <div className="p-6 text-center text-[0.74rem] text-[var(--col-dim)]">
                {selectedCategory === "SYSTEM"
                  ? "All system mandatory fields are permanently enabled on the right."
                  : "No additional fields in this category."}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Form Preview */}
        <div className="rounded-[18px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.45)] p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                Registration Preview
              </p>
              <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                Fields attendees will see upon clicking &quot;Register Now&quot;
              </p>
            </div>
            <span className="rounded-full border border-[var(--accent)] px-3 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--accent)] font-[family-name:var(--font-mono)]">
              {draft.registrationFields.length} fields total
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {draft.registrationFields.map((field, index) => (
              <div
                key={field.key}
                className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.75)] px-3.5 py-2.5 shadow-sm min-w-0"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center border border-[var(--accent)] text-[0.62rem] text-[var(--accent)] font-[family-name:var(--font-mono)] flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.76rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-ui)] truncate">
                        {field.label}
                      </span>
                      {field.systemMandatory ? (
                        <span className="rounded px-1.5 py-0.5 text-[0.52rem] font-bold bg-[var(--accent)]/15 text-[var(--accent)] font-[family-name:var(--font-mono)]">
                          SYSTEM REQUIRED
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleRequired(field.key)}
                          className={`rounded px-1.5 py-0.5 text-[0.52rem] font-bold transition-colors font-[family-name:var(--font-mono)] cursor-pointer ${field.required
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[hsl(0_0%_90%)] text-[var(--col-dim)] hover:bg-[hsl(0_0%_80%)]"
                            }`}
                        >
                          {field.required ? "REQUIRED" : "OPTIONAL"}
                        </button>
                      )}
                    </div>
                    <div className="text-[0.6rem] text-[var(--col-dim)] uppercase tracking-[0.08em] font-[family-name:var(--font-mono)]">
                      {field.category} · {field.inputType}
                    </div>
                  </div>
                </div>

                {!field.systemMandatory && (
                  <button
                    type="button"
                    onClick={() => removeField(field.key)}
                    className="rounded-[8px] border border-[var(--line-soft)] text-[var(--danger)] hover:bg-[var(--danger-bg)] p-1.5 transition-colors flex-shrink-0 cursor-pointer"
                    title="Remove field"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

function TicketsAndVolunteersStep({
  draft,
  updateDraft,
  eventId,
  saveTicketSettings,
  savingTicketSettings,
  ticketSaveSuccess,
  ticketSaveError,
}: {
  draft: EventDraft;
  updateDraft: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void;
  eventId: string | null;
  saveTicketSettings: () => Promise<void>;
  savingTicketSettings: boolean;
  ticketSaveSuccess: string;
  ticketSaveError: string;
}) {
  const [volunteerInput, setVolunteerInput] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [volunteers, setVolunteers] = useState<Volunteer[]>(draft.volunteers || []);
  const [volunteerError, setVolunteerError] = useState("");
  const [volunteerSuccess, setVolunteerSuccess] = useState("");

  const loadVolunteers = async (id: string) => {
    try {
      const list = await api.events.volunteers.list(id);
      setVolunteers(list);
      updateDraft("volunteers", list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (eventId) {
      loadVolunteers(eventId);
    }
  }, [eventId]);

  const handleAssignVolunteer = async () => {
    if (!volunteerInput.trim()) return;
    if (!eventId) {
      setVolunteerError("Please click 'Save Ticket Settings' first to create the event draft before assigning volunteers.");
      return;
    }
    setAssigning(true);
    setVolunteerError("");
    setVolunteerSuccess("");

    try {
      const added = await api.events.volunteers.assign(eventId, volunteerInput.trim());
      setVolunteers((prev) => [added, ...prev]);
      updateDraft("volunteers", [added, ...volunteers]);
      setVolunteerSuccess(`Assigned ${added.user?.fullName || volunteerInput} as volunteer!`);
      setVolunteerInput("");
      setTimeout(() => setVolunteerSuccess(""), 4000);
    } catch (e) {
      setVolunteerError(getApiErrorMessage(e));
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveVolunteer = async (volId: string) => {
    if (!eventId) return;
    try {
      await api.events.volunteers.remove(eventId, volId);
      setVolunteers((prev) => prev.filter((v) => v.id !== volId));
      updateDraft("volunteers", volunteers.filter((v) => v.id !== volId));
    } catch (e) {
      setVolunteerError(getApiErrorMessage(e));
    }
  };

  const toggleScannedField = (key: string) => {
    const current = draft.scannedFieldsConfig || [];
    if (current.includes(key)) {
      updateDraft("scannedFieldsConfig", current.filter((k) => k !== key));
    } else {
      updateDraft("scannedFieldsConfig", [...current, key]);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <StepIntro
        number="07"
        title="Ticket Release & Volunteer Access"
        description="Configure automated ticket QR generation timing, scanner field visibility, and assign student volunteers to scan attendee passes."
      />

      {ticketSaveSuccess && (
        <div className="p-3.5 rounded-[12px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-[0.76rem] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{ticketSaveSuccess}</span>
        </div>
      )}

      {ticketSaveError && (
        <div className="p-3.5 rounded-[12px] bg-red-500/10 border border-red-500/30 text-red-600 text-[0.76rem]">
          {ticketSaveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Ticket Release Timing & Scanned Fields */}
        <div className="space-y-6">
          {/* Release Timing Card */}
          <div className="rounded-[18px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.45)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              <h4 className="text-[0.84rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                QR Ticket Release Timing
              </h4>
            </div>
            <p className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-4">
              Determine when registered attendees can access and download their QR entry pass.
            </p>

            <div className="space-y-2.5">
              {[
                {
                  mode: "IMMEDIATE",
                  title: "Instant Release (Default)",
                  desc: "Ticket and QR code generated immediately upon registration submission.",
                },
                {
                  mode: "HOURS_BEFORE",
                  title: "Scheduled Hours Before Start",
                  desc: "Locked until a set number of hours (e.g. 24h, 8h) before the event begins.",
                },
                {
                  mode: "CUSTOM_TIME",
                  title: "Specific Date & Time",
                  desc: "Releases automatically at a predetermined calendar release timestamp.",
                },
              ].map((opt) => (
                <label
                  key={opt.mode}
                  className={`flex items-start gap-3 p-3.5 rounded-[14px] border cursor-pointer transition-all ${draft.ticketReleaseMode === opt.mode
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm"
                    : "border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.6)] hover:border-[var(--accent)]/50"
                    }`}
                >
                  <input
                    type="radio"
                    name="ticketReleaseMode"
                    value={opt.mode}
                    checked={draft.ticketReleaseMode === opt.mode}
                    onChange={() => updateDraft("ticketReleaseMode", opt.mode)}
                    className="mt-1 accent-[var(--accent)]"
                  />
                  <div>
                    <span className="text-[0.8rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                      {opt.title}
                    </span>
                    <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {draft.ticketReleaseMode === "HOURS_BEFORE" && (
              <div className="mt-4 p-3.5 rounded-[12px] bg-[var(--bg)] border border-[var(--line-soft)]">
                <label className={labelClass}>Release Hours Before Start</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={draft.ticketReleaseHours || 24}
                    onChange={(e) => updateDraft("ticketReleaseHours", Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-[10px] bg-white border border-[var(--line-soft)] text-[0.84rem] font-bold text-[var(--col-primary)] outline-none font-[family-name:var(--font-mono)]"
                  />
                  <span className="text-[0.76rem] text-[var(--col-secondary)]">
                    hours before ({draft.ticketReleaseHours || 24} hours before event start time)
                  </span>
                </div>
              </div>
            )}

            {draft.ticketReleaseMode === "CUSTOM_TIME" && (
              <div className="mt-4 p-3.5 rounded-[12px] bg-[var(--bg)] border border-[var(--line-soft)]">
                <label className={labelClass}>Custom Release Date & Time</label>
                <input
                  type="datetime-local"
                  value={draft.ticketReleaseCustomDate || ""}
                  onChange={(e) => updateDraft("ticketReleaseCustomDate", e.target.value)}
                  className="w-full px-3 py-2 rounded-[10px] bg-white border border-[var(--line-soft)] text-[0.84rem] font-medium text-[var(--col-primary)] outline-none"
                />
              </div>
            )}
          </div>

          {/* Scanner Visible Fields Privacy Card */}
          <div className="rounded-[18px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.45)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="w-4 h-4 text-[var(--accent)]" />
              <h4 className="text-[0.84rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                Scanner Screen Visible Fields
              </h4>
            </div>
            <p className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-4">
              Select which attendee registration fields appear on the volunteer's scanner screen when a QR pass is scanned:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {draft.registrationFields.map((field) => {
                const isChecked = (draft.scannedFieldsConfig || []).includes(field.key);
                return (
                  <label
                    key={field.key}
                    className={`flex items-center gap-2.5 p-2.5 rounded-[10px] border cursor-pointer text-[0.76rem] font-medium transition-all ${isChecked
                      ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--col-primary)]"
                      : "border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.6)] text-[var(--col-secondary)]"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleScannedField(field.key)}
                      className="accent-[var(--accent)] rounded"
                    />
                    <span className="truncate">{field.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Volunteer Assignment Card */}
        <div className="rounded-[18px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.45)] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[var(--accent)]" />
            <h4 className="text-[0.84rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
              Assigned Student Volunteers ({volunteers.length})
            </h4>
          </div>
          <p className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Grant scanning privileges to specific students using their university email or user ID. They will see the <strong>Event Scanner</strong> in their sidebar.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter student email or ID..."
              value={volunteerInput}
              onChange={(e) => setVolunteerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAssignVolunteer())}
              className="flex-1 px-3.5 py-2.5 rounded-[12px] bg-white border border-[var(--line-soft)] text-[0.8rem] text-[var(--col-primary)] outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={handleAssignVolunteer}
              disabled={assigning || !volunteerInput.trim()}
              className="px-4 py-2.5 rounded-[12px] bg-[var(--col-primary)] text-white text-[0.76rem] font-bold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer font-[family-name:var(--font-display)]"
            >
              {assigning ? "Adding..." : "Add Volunteer"}
            </button>
          </div>

          {volunteerSuccess && (
            <p className="text-[0.74rem] text-emerald-600 font-medium">{volunteerSuccess}</p>
          )}

          {volunteerError && (
            <p className="text-[0.74rem] text-red-500 font-medium">{volunteerError}</p>
          )}

          {/* Volunteers List */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {volunteers.map((vol) => (
              <div
                key={vol.id}
                className="flex items-center justify-between gap-3 p-3 rounded-[12px] bg-white border border-[var(--line-soft)] shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-bold text-[0.7rem] flex items-center justify-center flex-shrink-0">
                    {(vol.user?.fullName || "VO").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.78rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">
                      {vol.user?.fullName || "Student Volunteer"}
                    </p>
                    <p className="text-[0.68rem] text-[var(--col-secondary)] truncate font-[family-name:var(--font-ui)]">
                      {vol.user?.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveVolunteer(vol.id)}
                  className="w-7 h-7 rounded-full text-[var(--col-dim)] hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
                  title="Remove volunteer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {volunteers.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-[var(--line-soft)] rounded-[14px]">
                <p className="text-[0.78rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">
                  No volunteers assigned yet. Type student email above to grant scanner access.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Preview({ draft, cover }: { draft: EventDraft; cover: string | null }) {
  const bannerSrc = cover || draft.bannerUrl;

  return (
    <div className="space-y-6">
      <StepIntro number="07" title="Preview Your Event" description="Complete review of how attendees and reviewers will see this event." />

      {/* Banner & Header */}
      <div className="overflow-hidden rounded-[20px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.55)]">
        {bannerSrc ? (
          <div className="w-full h-48 sm:h-64 overflow-hidden relative">
            <img src={bannerSrc} alt="Event cover preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center bg-[hsl(25_65%_45%_/_0.08)]">
            <FileImage className="w-10 h-10 text-[var(--accent)] opacity-60 mb-2" />
            <span className="text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">NO BANNER IMAGE PROVIDED</span>
          </div>
        )}

        <div className="p-6">
          <h2 className="text-[1.4rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            {draft.title || "Untitled event"}
          </h2>
          <p className="mt-2 text-[0.84rem] leading-relaxed text-[var(--col-secondary)] font-[family-name:var(--font-ui)] whitespace-pre-line">
            {draft.description || "No description provided."}
          </p>

          <div className="mt-5 flex flex-wrap gap-4 text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] pt-4 border-t border-[var(--line-soft)]">
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--col-primary)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" /> {draft.eventDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
              {draft.startTime.split("T")[1] || "09:00"} — {draft.endTime.split("T")[1] || "17:00"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" /> {draft.venue || "Venue not specified"}
            </span>
          </div>
        </div>
      </div>

      {/* Agenda Timeline Preview */}
      {draft.agenda.length > 0 && (
        <div className="rounded-[20px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.55)] p-6">
          <h3 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
            Event Agenda ({draft.agenda.length} sessions)
          </h3>
          <div className="space-y-3">
            {draft.agenda.map((item, i) => (
              <div key={i} className="flex gap-4 p-3.5 rounded-[12px] bg-[hsl(0_0%_100%_/_0.6)] border border-[var(--line-soft)]">
                <div className="flex flex-col items-center w-6 flex-shrink-0">
                  <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[0.6rem] font-bold flex items-center justify-center font-[family-name:var(--font-mono)]">
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[0.82rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                      {item.title || "Untitled Session"}
                    </p>
                    <span className="text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                      {item.startTime ? item.startTime.replace("T", " ") : "TBD"}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[0.74rem] text-[var(--col-secondary)] mt-1 font-[family-name:var(--font-ui)]">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speakers Preview */}
      {draft.speakers.length > 0 && (
        <div className="rounded-[20px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.55)] p-6">
          <h3 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
            Featured Speakers ({draft.speakers.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {draft.speakers.map((s, i) => (
              <div key={i} className="p-4 rounded-[14px] bg-[hsl(0_0%_100%_/_0.6)] border border-[var(--line-soft)]">
                {s.photoUrl ? (
                  <img src={s.photoUrl} alt={s.name} className="w-12 h-12 rounded-full object-cover mb-2.5" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--col-primary)] text-white flex items-center justify-center text-[0.75rem] font-bold mb-2.5">
                    {s.name ? s.name.slice(0, 2).toUpperCase() : "SP"}
                  </div>
                )}
                <p className="text-[0.82rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{s.name}</p>
                {s.designation && <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{s.designation}</p>}
                {s.organization && <p className="text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">{s.organization}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sponsors Preview */}
      {draft.sponsors.length > 0 && (
        <div className="rounded-[20px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.55)] p-6">
          <h3 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
            Partners & Sponsors ({draft.sponsors.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {draft.sponsors.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-[12px] bg-[hsl(0_0%_100%_/_0.6)] border border-[var(--line-soft)]">
                {s.logoUrl && <img src={s.logoUrl} alt={s.name} className="w-7 h-7 object-contain rounded" />}
                <div>
                  <p className="text-[0.76rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{s.name}</p>
                  {s.sponsorshipLevel && <p className="text-[0.62rem] text-[var(--accent)] font-[family-name:var(--font-mono)]">{s.sponsorshipLevel}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration Form Fields Preview */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.55)] p-6">
        <h3 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
          Configured Registration Form ({draft.registrationFields.length} fields)
        </h3>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {draft.registrationFields.map((field, i) => (
            <div key={field.key} className="flex items-center justify-between p-3 rounded-[10px] bg-[hsl(0_0%_100%_/_0.6)] border border-[var(--line-soft)]">
              <div className="flex items-center gap-2">
                <span className="text-[0.66rem] font-bold text-[var(--accent)] font-[family-name:var(--font-mono)]">#{i + 1}</span>
                <span className="text-[0.76rem] font-medium text-[var(--col-primary)]">{field.label}</span>
              </div>
              <span className={`text-[0.56rem] font-bold px-2 py-0.5 rounded font-[family-name:var(--font-mono)] ${field.systemMandatory || field.required ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[hsl(0_0%_90%)] text-[var(--col-dim)]"
                }`}>
                {field.systemMandatory ? "SYSTEM" : field.required ? "REQUIRED" : "OPTIONAL"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PublishReview({
  draft,
  cover,
  onPublish,
  publishing,
  eventStatus,
}: {
  draft: EventDraft;
  cover: string | null;
  onPublish: () => void;
  publishing: boolean;
  eventStatus: string | null;
}) {
  const isResubmit = eventStatus === "CHANGES_REQUESTED";
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      {/* ── Inline Webpage Preview Modal ────────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-[500] flex flex-col bg-[var(--bg)]">
          {/* Preview top bar */}
          <div
            className="flex items-center justify-between px-5 py-3 border-b border-[var(--line-soft)] flex-shrink-0"
            style={{
              background: "hsl(0 0% 96% / 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span className="text-[0.74rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                Webpage Preview
              </span>
              <span className="text-[0.62rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] hidden sm:inline">
                This is how attendees will see the event
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[var(--line)] text-[0.74rem] font-medium text-[var(--col-secondary)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_96%)] transition-all cursor-pointer font-[family-name:var(--font-ui)]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Review
            </button>
          </div>

          {/* Scrollable preview content */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-8">
              {/* Banner */}
              {(cover || draft.bannerUrl) ? (
                <div className="relative rounded-[24px] overflow-hidden mb-8 border border-[var(--line-soft)] shadow-md aspect-[21/9] max-h-[340px] w-full bg-slate-900">
                  <img src={cover || draft.bannerUrl} alt={draft.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <Squircle cornerRadius={24} cornerSmoothing={1} className="w-full min-h-[180px] mb-8 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #182238 0%, #0d131f 100%)" }}>
                  <span className="text-[0.8rem] uppercase tracking-[0.18em] text-white/40 font-[family-name:var(--font-mono)]">No Banner</span>
                </Squircle>
              )}

              {/* Title + meta */}
              <h1 className="text-[clamp(1.7rem,3.5vw,2.5rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-3">
                {draft.title || "Untitled Event"}
              </h1>

              {/* Info chips */}
              <div className="flex flex-wrap gap-4 mb-6 text-[0.8rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />{draft.eventDate}</span>
                {draft.startTime && <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[var(--accent)]" />{draft.startTime.split("T")[1] || "09:00"}{draft.endTime ? ` — ${draft.endTime.split("T")[1]}` : ""}</span>}
                {draft.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />{draft.venue}</span>}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
                <div className="space-y-6">
                  {/* About */}
                  <Squircle cornerRadius={22} cornerSmoothing={1} className="p-7 bg-white/75 shadow-sm border border-slate-100">
                    <h2 className="text-[1.1rem] font-bold text-[#CC5F1C] font-[family-name:var(--font-display)] mb-3">About the Event</h2>
                    <p className="text-[0.86rem] text-slate-600 leading-[1.8] font-[family-name:var(--font-ui)] whitespace-pre-line">
                      {draft.description || "No description provided."}
                    </p>
                  </Squircle>

                  {/* Agenda */}
                  {draft.agenda.length > 0 && (
                    <Squircle cornerRadius={22} cornerSmoothing={1} className="p-7 bg-white/75 shadow-sm border border-slate-100">
                      <h2 className="text-[1.1rem] font-bold text-[#CC5F1C] font-[family-name:var(--font-display)] mb-4">Schedule</h2>
                      <div className="space-y-4">
                        {draft.agenda.map((item, i) => (
                          <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                            <div className="w-10 text-center flex-shrink-0">
                              <span className="text-[0.58rem] font-bold uppercase text-[#CC5F1C] font-[family-name:var(--font-mono)]">DAY</span>
                              <span className="block text-[1.1rem] font-bold text-slate-800 font-[family-name:var(--font-display)]">{i + 1}</span>
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5 border-l border-slate-100 pl-4">
                              <p className="text-[0.88rem] font-bold text-slate-900 font-[family-name:var(--font-display)]">{item.title}</p>
                              {item.description && <p className="text-[0.76rem] text-slate-500 mt-1 font-[family-name:var(--font-ui)]">{item.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Squircle>
                  )}

                  {/* Speakers */}
                  {draft.speakers.length > 0 && (
                    <Squircle cornerRadius={22} cornerSmoothing={1} className="p-7 bg-white/75 shadow-sm border border-slate-100">
                      <h2 className="text-[1.1rem] font-bold text-[#CC5F1C] font-[family-name:var(--font-display)] mb-4">Speakers & Guests</h2>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {draft.speakers.map((s, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-[14px] bg-white border border-slate-100">
                            {s.photoUrl
                              ? <img src={s.photoUrl} alt={s.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                              : <div className="w-10 h-10 rounded-full bg-slate-700 text-white text-[0.68rem] font-bold flex items-center justify-center flex-shrink-0">{(s.name || "SP").slice(0,2).toUpperCase()}</div>
                            }
                            <div className="min-w-0">
                              <p className="text-[0.82rem] font-semibold text-slate-900 font-[family-name:var(--font-display)] truncate">{s.name}</p>
                              {s.designation && <p className="text-[0.68rem] text-slate-500 truncate font-[family-name:var(--font-ui)]">{s.designation}{s.organization ? ` · ${s.organization}` : ""}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Squircle>
                  )}

                  {/* Sponsors */}
                  {draft.sponsors.length > 0 && (
                    <Squircle cornerRadius={22} cornerSmoothing={1} className="p-7 bg-white/75 shadow-sm border border-slate-100">
                      <h2 className="text-[1.1rem] font-bold text-[#CC5F1C] font-[family-name:var(--font-display)] mb-4">Sponsors & Partners</h2>
                      <div className="flex flex-wrap gap-3">
                        {draft.sponsors.map((s, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 rounded-[12px] bg-white border border-slate-100 shadow-sm">
                            {s.logoUrl && <img src={s.logoUrl} alt={s.name} className="w-6 h-6 object-contain rounded" />}
                            <div>
                              <p className="text-[0.74rem] font-semibold text-slate-900 font-[family-name:var(--font-display)]">{s.name}</p>
                              {s.sponsorshipLevel && <p className="text-[0.58rem] text-[var(--accent)] font-[family-name:var(--font-mono)]">{s.sponsorshipLevel}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Squircle>
                  )}
                </div>

                {/* Registration sidebar */}
                <div>
                  <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6 shadow-xl text-white"
                    style={{ background: "linear-gradient(145deg, #CC5F1C 0%, #A84E16 100%)" }}>
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/75 font-[family-name:var(--font-mono)] mb-4">Register for this event</p>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-white/70 flex-shrink-0" /><span className="text-[0.86rem] font-bold text-white">{draft.eventDate}</span></div>
                      {draft.venue && <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-white/70 flex-shrink-0" /><span className="text-[0.86rem] font-bold text-white truncate">{draft.venue}</span></div>}
                    </div>
                    <div className="w-full py-3 rounded-[12px] bg-white text-[#CC5F1C] text-[0.82rem] font-bold text-center font-[family-name:var(--font-display)]">
                      Register Now (Preview)
                    </div>
                    <p className="text-[0.62rem] text-white/50 text-center mt-3 font-[family-name:var(--font-ui)]">Form has {draft.registrationFields.length} fields</p>
                  </Squircle>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <StepIntro number="08" title="Review & Submit for Approval" description="Verify all event details and registration configuration before publishing." />
          {/* Preview Webpage button — top-left of review card */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] border border-[var(--line)] bg-[hsl(0_0%_100%_/_0.6)] text-[0.74rem] font-medium text-[var(--col-secondary)] hover:text-[var(--col-primary)] hover:border-[var(--accent)] transition-all flex-shrink-0 cursor-pointer font-[family-name:var(--font-ui)]"
          >
            <Eye className="w-3.5 h-3.5 text-[var(--accent)]" />
            Preview Webpage
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-[16px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.5)]">
            <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1">Event Title</p>
            <p className="text-[0.88rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{draft.title || "Untitled"}</p>
          </div>
          <div className="p-4 rounded-[16px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.5)]">
            <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1">Date & Location</p>
            <p className="text-[0.82rem] font-medium text-[var(--col-primary)]">{draft.eventDate} · {draft.venue || "No venue"}</p>
          </div>
        </div>

        <div className="p-4 rounded-[16px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.5)] space-y-3">
          <h4 className="text-[0.74rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
            Configuration Overview
          </h4>
          <div className="grid gap-2 sm:grid-cols-4 text-[0.76rem]">
            <div className="p-3 rounded-[10px] bg-[hsl(0_0%_100%_/_0.6)]">
              <span className="text-[var(--col-dim)] block text-[0.62rem]">AGENDA</span>
              <span className="font-bold text-[var(--col-primary)]">{draft.agenda.length} items</span>
            </div>
            <div className="p-3 rounded-[10px] bg-[hsl(0_0%_100%_/_0.6)]">
              <span className="text-[var(--col-dim)] block text-[0.62rem]">SPEAKERS</span>
              <span className="font-bold text-[var(--col-primary)]">{draft.speakers.length} speakers</span>
            </div>
            <div className="p-3 rounded-[10px] bg-[hsl(0_0%_100%_/_0.6)]">
              <span className="text-[var(--col-dim)] block text-[0.62rem]">SPONSORS</span>
              <span className="font-bold text-[var(--col-primary)]">{draft.sponsors.length} sponsors</span>
            </div>
            <div className="p-3 rounded-[10px] bg-[hsl(0_0%_100%_/_0.6)]">
              <span className="text-[var(--col-dim)] block text-[0.62rem]">FORM FIELDS</span>
              <span className="font-bold text-[var(--accent)]">{draft.registrationFields.length} active fields</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-[16px] border border-[var(--line-soft)] bg-[hsl(0_0%_100%_/_0.5)]">
          <h4 className="text-[0.74rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-3">
            Fields that will be shown to registering students
          </h4>
          <div className="flex flex-wrap gap-2">
            {draft.registrationFields.map((f) => (
              <span key={f.key} className="px-2.5 py-1 rounded-full text-[0.68rem] bg-[hsl(0_0%_100%_/_0.8)] border border-[var(--line-soft)] text-[var(--col-primary)] font-medium">
                {f.label} {f.systemMandatory ? "(System)" : f.required ? "(Req)" : "(Opt)"}
              </span>
            ))}
          </div>
        </div>

        {isResubmit && (
          <div className="p-4 rounded-[14px] border border-[hsl(270_50%_55%_/_0.3)] bg-[hsl(270_60%_65%_/_0.07)]">
            <p className="text-[0.76rem] font-semibold text-[hsl(270_50%_40%)] font-[family-name:var(--font-display)] mb-1">Resubmitting After Changes Requested</p>
            <p className="text-[0.72rem] text-[hsl(270_45%_45%)] font-[family-name:var(--font-ui)] leading-relaxed">
              You are resubmitting this event after addressing Super Admin feedback. Clicking the button below will send it back for review.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onPublish}
          disabled={publishing}
          className="w-full py-3.5 rounded-[14px] bg-[var(--accent)] text-white text-[0.84rem] font-semibold font-[family-name:var(--font-display)] hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {publishing
            ? (isResubmit ? "Resubmitting..." : "Submitting Event...")
            : (isResubmit ? "Resubmit for Approval" : "Submit Event For Approval")}
          <Check className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}

function StepIntro({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-[11px] flex items-center justify-center bg-[hsl(25_65%_45%_/_0.1)] text-[var(--accent)] flex-shrink-0">
        <Info className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[var(--accent)] font-[family-name:var(--font-mono)]">Step {number}</p>
        <h2 className="mt-1 text-[1.25rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{title}</h2>
        <p className="mt-1 text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{description}</p>
      </div>
    </div>
  );
}
