# Summary of Today's Work & Code Changes

**Date:** October 5, 2026
**Project:** PUVerse — University Event Management Platform

---

## 1. Overview

Core areas updated in today's session across backend (NestJS / Prisma) and frontend (Next.js App Router):

- Multi-day event support added end-to-end — new Prisma models (`EventDay`, `EventDayAttendance`), atomic transaction logic in `events.service.ts`, and a redesigned Start/End date UI in the admin event-creation wizard.
- Per-day attendance scanning — QR scanner now records an `EventDayAttendance` row per day; volunteer scanner gains a live day-session dropdown with smart auto-selection of today's date.
- Admin Analytics dashboard rebuilt — legacy attendance-list polling replaced by a dedicated `/analytics` and `/export` REST API; native Excel (`.xlsx`) download uses Blob + `createObjectURL` to avoid proxy/CORS issues.
- Cross-platform SSL certificate fix — dynamic `RDS_CA_CERT_PATH` fallback in `PrismaService` and `seed.ts` so local macOS/Windows dev no longer crashes with a missing RDS certificate file.
- Dynamic date-range display on public pages — `/explore-events` and `/events/[slug]` render `Oct 18 – Oct 20, 2026` style ranges for multi-day events instead of a single static date.
- Dynamic agenda binding on event detail page — schedule section rebuilt to group agenda items by `EventDay` with per-day headers; single-day events keep the flat view; empty agenda shows a clean placeholder.
- UG Number validation regex updated — `RegisterDto` now enforces `/^\d{2}UG\d{6}$/` (e.g. `26UG123456`), replacing the old loose `/^UG\d{7,}$/i` pattern.
- New `AdminAnalyticsController` + `AdminAnalyticsService` wired into `AdminModule` — provides per-day, cumulative, and all-days aggregate analytics with XLSX export.

---

## 2. Detailed File-by-File & Feature-by-Feature Changes

### A. Database / Prisma

#### `backend/prisma/schema.prisma`

- **Category:** Feature
- Added `startDate`, `endDate`, `totalDays` (Int, default 1), and `isMultiDay` (Boolean, default false) to the `Event` model.
- Added `maxCapacity` (Int?, nullable) to `Event` for future registration-cap enforcement.
- New `EventDay` model — stores `dayNumber`, `date`, `title`, `isAttendanceActive` per calendar day; cascade-deleted with its parent `Event`.
- New `EventDayAttendance` model — one record per `(eventDayId, registrationId)` with a `@@unique` compound key preventing duplicate daily scans.
- `EventAgenda` model: added optional `eventDayId` FK so agenda items can be bound to a specific day.

#### `backend/prisma/seed.ts`

- **Category:** Bug Fix / Configuration
- Replaced hard-coded `ssl: { ca: readFileSync('/app/rds-ca-bundle.pem') }` with a dynamic `sslConfig` constant using `fs.existsSync()`.
- When the cert file is absent (local dev), `sslConfig` is `undefined` and the spread operator omits the `ssl` key entirely — no `ENOENT` crash.

#### `backend/prisma.config.ts`

- **Category:** Configuration
- Added seed command: `npx ts-node --transpile-only prisma/seed.ts` so `prisma db seed` resolves correctly in CI and local environments.

---

### B. Backend / NestJS

#### `backend/src/database/prisma/prisma.service.ts`

- **Category:** Bug Fix / Configuration
- New `getSslConfig()` helper reads `RDS_CA_CERT_PATH` env var (falls back to `/app/rds-ca-bundle.pem`) and returns the ssl object only if the file exists, otherwise returns `false`.
- All three previous hard-coded `ssl` blocks (global singleton, `PrismaService` constructor, fallback client) replaced with `getSslConfig()`.
- Production (AWS) continues full mTLS; local dev runs without SSL automatically.

#### `backend/src/main.ts`

- **Category:** Refactor
- `FRONTEND_URL` included inline in the initial `allowedOrigins` array rather than conditionally pushed.
- All HTTP methods including `OPTIONS` listed explicitly for pre-flight CORS handling.

#### `backend/src/modules/events/events.service.ts`

- **Category:** Feature
- Added `startOfDay`, `addDays`, `differenceInCalendarDays` pure date helpers (zero extra dependencies).
- New `buildEventDays()` private method — computes `EventDay` create-payloads from `startDate`/`endDate` + optional `DayLabel` overrides.
- `createEvent()` wrapped in `prisma.$transaction`: creates `Event` + `eventDay.createMany()` atomically; returns event with `days` included.
- `updateEvent()` also transactional: when dates change, existing `EventDay` rows are deleted and regenerated.

#### `backend/src/modules/events/dto/create-event.dto.ts`

- **Category:** Feature
- Added required `startDate` and `endDate` (`@IsDateString()`) fields.
- Added optional `dayLabels: EventDayLabelDto[]` with `@ValidateNested({ each: true })` + `@Type(() => EventDayLabelDto)`.

#### `backend/src/modules/events/dto/event-day-label.dto.ts` — NEW FILE

- **Category:** Feature
- `EventDayLabelDto` — `dayNumber` (Int, min 1), optional `title` (string, max 200), optional `date` (ISO date string override).

#### `backend/src/modules/events/attendance/attendance.service.ts`

- **Category:** Feature
- `scanQr()` — when `dto.eventDayId` is present: validates day belongs to event, checks `EventDayAttendance` unique constraint, creates attendance record.
- New `getEventDays()` method — returns ordered `EventDay` list after verifying scanner authorization.

#### `backend/src/modules/events/attendance/attendance.controller.ts`

- **Category:** Feature
- Added `GET :id/days` route calling `getEventDays()` — used by the volunteer scanner day-session dropdown.

#### `backend/src/modules/events/attendance/dto/scan-qr.dto.ts`

- **Category:** Feature
- Added optional `eventDayId` (`@IsOptional @IsString @IsUUID`) to `ScanQrDto`.

#### `backend/src/modules/events/events.service.spec.ts`

- **Category:** Refactor / Test Fix
- `prismaMock` extended with `eventDay.createMany` / `deleteMany` stubs and a `$transaction` mock that delegates to per-test inline tx mocks.
- All three test cases updated: `startDate`/`endDate` added to DTOs; `$transaction.mockImplementationOnce` configured per scenario.

#### `backend/src/modules/admin/admin.module.ts`

- **Category:** Feature
- `AdminAnalyticsController` and `AdminAnalyticsService` registered in `AdminModule`.

#### `backend/src/modules/admin/controllers/admin-analytics.controller.ts` — NEW FILE

- **Category:** Feature
- Exposes `GET :eventId/analytics` (query: `dayId?`, `status?`) and `GET :eventId/export` under `@Controller('events')`.
- Both routes guarded by `JwtAuthGuard` + `RolesGuard` (`EVENT_ADMIN`, `SUPER_ADMIN`).
- Export route streams XLSX buffer as `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` attachment.

#### `backend/src/modules/admin/services/admin-analytics.service.ts` — NEW FILE

- **Category:** Feature
- `getAnalytics()` — three modes: cumulative (no `dayId`), per-day (UUID), all-days aggregate (`dayId='all'`).
- `exportExcel()` — builds styled XLSX workbook via `xlsx-builder` utility.
- `ensureEventAdmin()` — only the event creator or `SUPER_ADMIN` can access analytics.

#### `backend/src/modules/admin/dto/analytics-query.dto.ts` — NEW FILE

- **Category:** Feature
- `AnalyticsQueryDto` — optional `dayId` (string) and `status` enum (`ALL | PRESENT | ABSENT`, default `ALL`).

#### `backend/.env.example`

- **Category:** Configuration
- `DATABASE_URL` updated to `AWS_RDS_ENDPOINT` / `DATABASE_NAME` placeholders matching real RDS patterns.
- JWT keys reorganised: `JWT_ACCESS_EXPIRES_IN` renamed to `JWT_EXPIRES_IN` (8h), `JWT_REFRESH_SECRET` added.

#### `backend/package.json`

- **Category:** Configuration
- `build` script changed from `prisma generate && node_modules/.bin/nest build` to `npx prisma generate && nest build` for reliable cross-environment execution.

#### `backend/src/modules/auth/dto/register.dto.ts`

- **Category:** Bug Fix / Validation
- `@Matches` regex for `ugNumber` updated from `/^UG\d{7,}$/i` to `/^\d{2}UG\d{6}$/`.
- Validation message updated: `'UG Number must be in the format YYUGXXXXXX (e.g., 26UG123456)'`.
- Inline JSDoc example updated from `"UG20261042"` to `"26UG123456"`.

---

### C. Frontend / Next.js

#### `frontend/lib/api-client.ts`

- **Category:** Feature / Refactor
- `Event` type extended with `startDate`, `endDate`, `totalDays`, `isMultiDay`, and `days` array.
- New exported types: `EventDay`, `DayLabel`, `AnalyticsRow`, `AnalyticsDaySummary`, `AnalyticsCumulativeSummary`, `AnalyticsMultiDaySummary`, `AnalyticsResult`.
- `CreateEventRequest` updated: `startDate` and `endDate` required; `dayLabels?: DayLabel[]` added.
- `api.events.days.list(eventId)` — calls `GET /events/:id/days`.
- `api.events.attendance.scan()` — optional `eventDayId` parameter added.
- `api.admin.analytics.get()` — calls `GET /events/:id/analytics` with `dayId` and `status` params.
- `api.admin.export.download()` — fetches XLSX as Blob, triggers synthetic `<a>` click for client-side download.
- `api.admin.export.url()` — builds a direct download URL for `<a href>` contexts.

#### `frontend/app/admin/events/create/page.tsx`

- **Category:** Feature
- `EventDraft` extended with `startDate`, `endDate`, `dayLabels`.
- `BasicInfo` step: single `Event date` input replaced by two-column Start / End date row with `endDate >= startDate` constraint.
- Live status badge: `"Multi-Day Event Detected: N Days"` or `"Single-Day Event"` updates in real time.
- Per-day label inputs rendered dynamically when `totalDays > 1`.
- All submit/draft/publish handlers now include `startDate`, `endDate`, `dayLabels` in API payload.
- `addAgenda()` derives correct date+time defaults from the selected day.

#### `frontend/app/admin/analytics/page.tsx`

- **Category:** Feature / Refactor
- Old `EventAnalytics` type and `analyticsMap` replaced by single `analyticsResult: AnalyticsResult | null` fed from the new `/analytics` endpoint.
- Day selector: fetches `EventDay[]` via `api.events.days.list()`; auto-selects today's day for multi-day events.
- Status filter: `ALL / PRESENT / ABSENT` selector wired to analytics refetch.
- `tableRows` and `metrics` derived via `useMemo` — handles cumulative, per-day, and multi-day flattening.
- Native XLSX download wired to `api.admin.export.download()` with loading state and contextual filename.

#### `frontend/app/explore-events/page.tsx`

- **Category:** Feature / Bug Fix
- `formatLongDate()` replaced by `formatEventDate(event)` — renders range strings for multi-day events (e.g. `Oct 18 – 20, 2026`), cross-month ranges, or single-day full dates.
- `classifyEvent()` uses `startDate`/`endDate` (falling back to `eventDate`) for correct ongoing/upcoming/past status.

#### `frontend/app/events/[slug]/page.tsx`

- **Category:** Feature / Bug Fix
- `buildDateLabel()` added — formats single-day and multi-day date ranges for hero banner and sidebar.
- Venue fallback changed from hardcoded `"PU Tech Center, Hall A"` to `"TBD"`.
- Schedule Highlights rebuilt: groups agenda items by date using a `dayByDate` Map from `event.days`; renders `DAY N` headers for multi-day events; empty state shows placeholder text.

#### `frontend/app/student/volunteer/page.tsx`

- **Category:** Feature
- `EventDay` type imported from `api-client`.
- `eventDays` and `selectedDayId` state variables added.
- On event selection: `api.events.days.list()` called; today's matching day auto-selected.
- `api.events.attendance.scan()` now passes `selectedDayId` for per-day recording.
- Day Session Dropdown UI shown when `eventDays.length > 1` — displays day title, date, and a `Today` badge.

---

## 3. Key Issues Resolved Today

### Cross-Platform SSL Certificate Crash
- **Problem:** `fs.readFileSync('/app/rds-ca-bundle.pem')` called unconditionally at module load — crashed the backend on local dev with `ENOENT`.
- **Fix:** `getSslConfig()` / `sslConfig` checks `fs.existsSync()` first. Missing cert → `ssl: false` for local dev; cert present in production → full mTLS enforced.

### Multi-Day Event Schema Gap
- **Problem:** `Event` model only stored a single `eventDate`, making multi-day conferences impossible to represent.
- **Fix:** `startDate`, `endDate`, `totalDays`, `isMultiDay` added to `Event`; `EventDay` and `EventDayAttendance` models introduced; backend service auto-generates `EventDay` rows in a `$transaction`.

### Per-Day Duplicate Scan Vulnerability
- **Problem:** Without per-day records, the same QR code could be scanned multiple times across different days of the same event with no guard.
- **Fix:** `EventDayAttendance` has a `@@unique([eventDayId, registrationId])` compound key. Second scan on the same day throws `400 BadRequestException`.

### Analytics Stale Data / Performance
- **Problem:** Old page fetched the full attendance list and computed metrics client-side; `analyticsMap` caused stale data when filters changed.
- **Fix:** Dedicated `/events/:eventId/analytics` endpoint returns pre-aggregated metrics. Frontend re-fetches on every filter change via `useEffect` dependency array.

### Excel Export CORS / Proxy Failure
- **Problem:** `window.open()` / `<a href>` export triggered cross-origin pre-flight failures; bearer token could not be embedded safely in URLs.
- **Fix:** `api.admin.export.download()` uses `fetch()` with `Authorization` header, receives XLSX as Blob, triggers synthetic `<a>` click with `createObjectURL` — entirely client-side.

### UG Number Format Mismatch
- **Problem:** Old regex `/^UG\d{7,}$/i` accepted legacy formats like `UG20261042` and was case-insensitive.
- **Fix:** Regex updated to `/^\d{2}UG\d{6}$/` — 2-digit year + uppercase `UG` + exactly 6 digits. Case variants and legacy formats now rejected with a clear validation error.

### Static Agenda Binding (Hardcoded Day Numbers & Venue)
- **Problem:** Schedule Highlights used `i+1` as the day number and showed `"PU Tech Center, Hall A"` regardless of actual venue data.
- **Fix:** Day numbers and titles sourced from `event.days` via a `dayByDate` lookup Map. Venue fallback changed to `"TBD"`. Day headers only shown for genuinely multi-day events.

---

## 4. Pending / Next Steps

- **Prisma migration** — `schema.prisma` changes (`EventDay`, `EventDayAttendance`, `startDate`/`endDate` columns) have not been promoted to a named migration. Run `prisma migrate dev --name add_multi_day_event_support` before deploying to production.
- **Event registration capacity enforcement** — `maxCapacity` is in the schema but `EventsService.register()` does not yet check it. Implement the guard and return `409 Conflict` when capacity is reached.
- **CORS verification on deployed AWS environment** — confirm the updated `allowedOrigins` logic in `main.ts` works with the live `FRONTEND_URL` from the `.env` on the EC2 / Lambda instance.
- **Push feature branch to remote and open Pull Request** — all today's changes are on branch `drashtii`; run `git push -u origin drashtii`, then open a PR against `main` for code review.
- **End-to-end smoke test on staging** — create a multi-day event via the admin wizard, scan QR codes on different days, verify `EventDayAttendance` records, download the XLSX report, and confirm explore-events shows the correct date range.
- **Seed script validation** — run `prisma db seed` locally on macOS to confirm the dynamic SSL fallback resolves cleanly without the RDS certificate present.

---

## 5. JWT Silent Refresh & Session Expiry Fix

### Overview

Fixed silent 401 JWT expiration errors so Event Admins filling out long forms are never unexpectedly redirected to `/login`. Implemented a long-lived access token strategy and a graceful session-expired toast notification.

### Files Changed (3 surgical edits)

#### `backend/src/modules/auth/auth.module.ts`

- **Category:** Bug Fix / Configuration
- `JwtModule.registerAsync` previously hardcoded `expiresIn: '15m'` — the `.env` key `JWT_EXPIRES_IN=8h` was present but never consumed.
- Changed `expiresIn` to read `configService.get('JWT_EXPIRES_IN') ?? '8h'` so access tokens are now 8-hour tokens, matching the `.env` value.
- Added an `as` cast to satisfy `@nestjs/jwt`'s `StringValue` type constraint (`'8h'` as a valid ms duration literal).
- **Result:** Event Admins filling long event-creation or edit forms will no longer hit a token expiry mid-session.

#### `frontend/lib/api-client.ts`

- **Category:** Bug Fix / Feature
- Extracted a `redirectSessionExpired()` helper function that navigates to `/login?session=expired` (guards against calling from SSR and from within the login page itself).
- Both 401 failure paths in the axios response interceptor now call `redirectSessionExpired()` instead of bare `window.location.assign("/login")`:
  - **Path 1:** Refresh token call itself fails (refresh token expired or session revoked).
  - **Path 2:** No refresh session in localStorage at all.
- All existing silent-refresh logic — request queue, `isRefreshing` flag, token rotation, retry of original request — is untouched.

#### `frontend/app/login/page.tsx`

- **Category:** Feature / UX
- Added `import { toast } from "sonner"` (Sonner is already installed and the `<Toaster>` is mounted in `providers.tsx`).
- Added a `useEffect` (runs once on mount) that:
  1. Reads `?session=expired` from `window.location.search`.
  2. Fires `toast.warning("Your session has expired. Please log in again.")` with a 6-second duration via the existing Sonner toast system.
  3. Calls `window.history.replaceState` to strip the query param so a manual page refresh does not replay the toast.

### How the Full Flow Works

1. User logs in → `accessToken` (8h), `refreshToken` (7d), `sessionId` stored in localStorage.
2. After 8h the access token expires. User clicks "Save Changes" on an event form.
3. The axios request interceptor sends the expired token → backend returns `401`.
4. The response interceptor catches the `401`, pauses any parallel requests in `refreshQueue`, and calls `POST /auth/refresh` with `{ sessionId, refreshToken }`.
5. Backend validates the session, rotates the refresh token (old session revoked, new session created atomically), and returns a fresh `accessToken`, `refreshToken`, and `sessionId`.
6. Frontend stores the new tokens, drains `refreshQueue`, retries the original "Save Changes" request — the user never notices anything.
7. If the refresh itself fails (7-day session also expired): localStorage is cleared and the user is sent to `/login?session=expired`, which shows a clear "Your session has expired" warning toast.

### What Was NOT Changed

- No package versions modified.
- No other components, routes, or env files altered.
- `SessionService`, `AuthService.refresh()`, `JwtStrategy`, `auth-store.ts`, and all other auth infrastructure left completely untouched.

---

## 6. Event Wizard — Date/Agenda Reset Fix & Contextual Submit Button

### Overview

Fixed two critical bugs in the Event Admin wizard (`/admin/events/create?event=<id>`):

1. **Bug 1:** Existing `startTime`, `endTime`, `startDate`, `endDate`, `dayLabels`, and `agenda` data was being lost or corrupted when loading an existing event into the wizard (Step 2 and Step 3).
2. **Bug 2:** The final wizard step always showed "Submit Event For Approval" regardless of whether the event was already `APPROVED`, `PUBLISHED`, or `PENDING_APPROVAL` — clicking it would attempt to re-submit a live event.

### Files Changed (1 file)

#### `frontend/app/admin/events/create/page.tsx`

- **Category:** Bug Fix

---

#### Bug 1 — Date & Time Hydration Reset

**Root cause:** The event load `useEffect` called `setDraft` with normalised date strings computed *outside* the `setDraft((prev) => ...)` callback. This meant `prev.startDate`, `prev.endDate`, `prev.startTime`, and `prev.endTime` were referenced in the outer async closure scope where `prev` does not exist — causing a ReferenceError in strict mode and falling back to `undefined`, which wiped the fields.

Additionally, the old code sliced ISO timestamps with `.slice(0, 16)` directly (e.g. `"2026-10-18T09:00:00.000Z".slice(0,16)` → `"2026-10-18T09:00"`) which works for UTC strings but produces the wrong time when the backend returns a timezone-offset ISO string.

**Fix:**

- Moved all date/time normalisation *inside* the `setDraft((prev) => { ... return { ... }; })` callback so `prev` is always in scope.
- Extracted a `toDateTimeLocal(isoStr, datePart)` helper that:
  - Parses the ISO string with `new Date()` (handles UTC offset correctly via `getHours()` / `getMinutes()`).
  - Builds a `YYYY-MM-DDTHH:mm` string using the already-normalised `resolvedStartDate` / `resolvedEndDate` as the date part.
  - Returns `null` if the input is absent or unparseable, so the caller can fallback to `prev.startTime` / `prev.endTime` — existing data is never lost.
- `dayLabels` hydration now checks `eventData.days.length > 0` before overwriting, so navigating to Step 2 on an event with no days does not reset manually entered labels.
- `agenda`, `speakers`, `sponsors` already used `prev.X` fallbacks and were left untouched.

**Before → After (key part):**

```ts
// BEFORE (broken — prev referenced outside setDraft)
const normStartDate = eventData.startDate ? ... : prev.startDate; // ❌ prev undefined here
setDraft((prev) => ({ startDate: normStartDate, ... }));

// AFTER (correct — everything inside the updater callback)
setDraft((prev) => {
  const resolvedStartDate = eventData.startDate ? ... : prev.startDate; // ✅
  const resolvedStartTime = toDateTimeLocal(eventData.startTime, resolvedStartDate) ?? prev.startTime;
  return { ...prev, startDate: resolvedStartDate, startTime: resolvedStartTime, ... };
});
```

---

#### Bug 2 — Contextual Submit Button Label & Behaviour

**Root cause:** The `publish()` function and both button renders (fixed bottom bar + `PublishReview` component) only checked for `eventStatus === "CHANGES_REQUESTED"`. For events with status `APPROVED`, `PUBLISHED`, or `PENDING_APPROVAL`, the button still showed "Submit Event" and called `api.events.submit()` — which would attempt an invalid status transition on a live event.

**Fix:**

- Added `isExistingLiveEvent` boolean derived from `eventStatus`:
  ```ts
  const isExistingLiveEvent =
    eventStatus === "APPROVED" ||
    eventStatus === "PUBLISHED" ||
    eventStatus === "PENDING_APPROVAL";
  ```
- Inside `publish()`: when `isExistingLiveEvent` is true, the PATCH update runs but `.submit()` / `.resubmit()` are skipped — the event's approval status is preserved.
- `PublishReview` component: added `isExistingLiveEvent` prop; button label and loading label are now derived:

  | `eventStatus` | Button label | Loading label |
  |---|---|---|
  | `APPROVED` / `PUBLISHED` / `PENDING_APPROVAL` | **Save Changes** | Saving... |
  | `CHANGES_REQUESTED` | Resubmit for Approval | Resubmitting... |
  | `DRAFT` / `null` (new) | Submit Event For Approval | Submitting Event... |

- An informational banner is shown in the `PublishReview` step for live events: *"This event is currently PUBLISHED. Clicking 'Save Changes' will update the event details without changing its approval status."*
- Step intro heading changes from "Review & Submit for Approval" to "Review & Save Changes" for live events.
- The fixed bottom navigation bar's final button uses the same three-way label logic.

### Build Verification

`npm run build` in `frontend/` — `✓ Compiled successfully` — zero TypeScript errors.

---

## 7. Explore Events — Correct Timeline Classification (All / Ongoing / Upcoming / Past)

### Overview

Fixed three bugs in `frontend/app/explore-events/page.tsx` related to how events are classified and filtered:

1. Events were classified as "past" as soon as their `startTime` (time of day) passed, even mid-event.
2. Multi-day events became "past" on day 1 evening instead of after the `endDate` calendar day.
3. The "All Events" tab excluded past events entirely.

### File Changed

#### `frontend/app/explore-events/page.tsx`

- **Category:** Bug Fix

---

#### Bug 1 & 2 — `classifyEvent` boundary fix

**Root cause:** `classifyEvent(startDate, endDate)` was being called with `event.startTime` / `event.endTime` (time-of-day fields) instead of `event.startDate` / `event.endDate` (calendar date fields). A multi-day event with `startDate = "2026-10-18"` and `endDate = "2026-10-20"` would be classified as "past" once the clock passed `endTime` on day 1 (e.g. 5 PM), even though two more event days remained.

**Fixes:**

- `classifyEvent()` now compares against **date-only boundaries** using midnight of `startDate` and `23:59:59.999` of `endDate`:
  ```ts
  const startDay    = new Date(startDate.slice(0, 10) + "T00:00:00");
  const endDayClose = new Date(endDate.slice(0,   10) + "T23:59:59.999");
  ```
  An event is "ongoing" for the *entire calendar day* of `endDate`, not just until `endTime`.

- All three call-sites that computed `start`/`end` for `classifyEvent` were updated to use `event.startDate || event.eventDate` and `event.endDate || event.startDate || event.eventDate` instead of `event.startTime` / `event.endTime`:
  - `filteredEvents` memo (filter logic)
  - `filteredEvents.map(...)` render loop (badge colour)

#### Bug 3 — "All Events" showed only ongoing + upcoming

**Root cause:** The `matchTimeline` check for `selectedTimeline === "all"` was:
```ts
timeline === "ongoing" || timeline === "upcoming"   // ❌ excluded past
```

**Fix:** Changed to `true` — the "All Events" tab now shows every timeline bucket:
```ts
selectedTimeline === "all" ? true : timeline === selectedTimeline
```

### Behaviour After Fix

| Tab | Events shown |
|---|---|
| **All Events** | Upcoming + Ongoing + Past (all published events) |
| **Ongoing** | `startDate` ≤ today ≤ `endDate` (full calendar day) |
| **Upcoming** | `startDate` is in the future |
| **Past** | `endDate` calendar day has fully passed |

---

## 8. Event Page — Registration Stays Open Until `endDate` (Not `endTime`)

### Overview

Fixed a bug where the **"Registration Closed"** state was shown on `/events/[slug]` for active multi-day events. The registration UI was locking as soon as `endTime` (time-of-day) passed on the *first* day, even though the event still had multiple days remaining.

### File Changed

#### `frontend/lib/event-status.ts`

- **Category:** Bug Fix

---

#### Root Cause

`getEventExpiryTime()` only knew about `endTime`, `startTime`, and `eventDate`. For a multi-day event like AWS summit (`startDate: 2026-10-18`, `endDate: 2026-10-20`, `endTime: 17:00`), the expiry was resolved to `17:00 on Oct 18` — making the registration appear closed from 5 PM on day 1 even though two more days remained.

The `ExpirableEvent` type also did not include `startDate` or `endDate`, so the API response fields were silently ignored.

#### Fix

- Added `startDate` and `endDate` to the `ExpirableEvent` type.
- Updated `getEventExpiryTime()` with a new priority order:

  | Priority | Field used | Logic |
  |---|---|---|
  | 1 (new) | `endDate` / `startDate` | End of that calendar day: `23:59:59.999` — multi-day events stay open until midnight of the last day |
  | 2 | `endTime` | Exact datetime (legacy single-day events) |
  | 3 | `startTime` | Fallback if no end is set |
  | 4 | `eventDate` | End of day — final fallback |

  Key detail: the `endDate` ISO string is normalised to its **date-only portion** (`slice(0,10)`) before computing end-of-day, so UTC timezone offsets in the stored value don't shift the boundary to the wrong calendar day.

- This single file change fixes expiry behaviour in every consumer:
  - `/events/[slug]` — `isExpired` flag that gates the Register button, form, and modal
  - `HeroSection.tsx` — filters featured/upcoming events on the landing page

---

## 9. Event Page — Remove Default "Untitled Session" from Schedule

### Overview

Fixed a ghost "Day 1 · Session" entry appearing in the Schedule Highlights section of `/events/[slug]` even when no real agenda had been added. The placeholder was being saved to the database by the wizard and then rendered publicly.

### Root Cause

Two separate issues combined to produce the bug:

1. **Wizard `saveChanges()` saved blank rows** — when an admin clicked "Save Changes" on Step 3 (Agenda) with an empty unsaved row in the list, the payload `title: item.title || "Session"` wrote `"Session"` to the database for every blank row.

2. **Public page rendered every item returned by the API** — the schedule section had no filter, so the `"Session"` placeholder appeared publicly as "Day 1 · Session".

### Files Changed

#### `frontend/app/admin/events/create/page.tsx`

- **Category:** Bug Fix
- In `saveChanges()`, added a guard to skip agenda rows with no meaningful title before calling the API:
  ```ts
  if (!item.title?.trim()) continue;  // skip blank/unsaved rows
  ```
  This matches the existing guard in the `publish()` flow (`if (!item.id && item.title)`) so both save paths are now consistent.

#### `frontend/app/events/[slug]/page.tsx`

- **Category:** Bug Fix
- Added a `cleanAgenda` filter at the top of the Schedule Highlights IIFE before any rendering or grouping:
  ```ts
  const cleanAgenda = agenda.filter(
    (item) => item.title && item.title.trim() !== "" && item.title.trim().toLowerCase() !== "session"
  );
  ```
- `cleanAgenda.length === 0` now triggers the "No schedule details released yet" placeholder.
- All grouping (`cleanAgenda.forEach`) and rendering uses `cleanAgenda` instead of the raw `agenda` array.
- Acts as a permanent safety net — even if old `"Session"` placeholder rows exist in the database they will never surface publicly.

---

## 10. Backend — Registration "Event Has Ended" Error Uses `endDate` Not `endTime`

### Overview

Fixed the backend registration API throwing `"Registration is closed — this event has already ended."` for active multi-day events. The server-side expiry check was using `endTime` (time-of-day on day 1) as the registration close boundary, exactly mirroring the same bug that was already fixed on the frontend in Section 8.

### File Changed

#### `backend/src/common/utils/event-expiry.ts`

- **Category:** Bug Fix

---

#### Root Cause

`getEventExpiryTime()` resolved expiry in this order: `endTime` → `startTime` → end of `eventDate` day. The `endDate` and `startDate` fields (which exist on every event in the Prisma schema) were not in `ExpirableEvent` and were never consulted. For a multi-day event like the AWS summit (`endDate: 2026-10-20`, `endTime: 17:00 day 1`), the server returned `400 Bad Request` after 5 PM on day 1 even though the event ran until Oct 20.

This is the same root cause fixed for the frontend in **Section 8** (`frontend/lib/event-status.ts`). The two files are meant to mirror each other — the backend was missed.

#### Fix

Applied the identical priority-order change as the frontend:

| Priority | Field | Logic |
|---|---|---|
| 1 (new) | `endDate` / `startDate` | End of that calendar day: `23:59:59.999` |
| 2 | `endTime` | Exact datetime for single-day events |
| 3 | `startTime` | Fallback if no end defined |
| 4 | `eventDate` | End of day — final fallback |

- Added `startDate` and `endDate` to the `ExpirableEvent` type.
- `getEventExpiryTime()` now checks `endDate ?? startDate` first, snaps to the `YYYY-MM-DD` date portion (`toISOString().slice(0,10)`), and appends `T23:59:59.999` to get end-of-calendar-day.

**Result:** Registration stays open through `23:59:59` of the event's `endDate`. After that midnight the backend correctly rejects new registrations. Backend build: ✅ zero TypeScript errors.

---

## 11. Event Date/Time Changes Propagate Instantly to All Pages After Save

### Overview

Fixed stale date/time data across all pages after an admin edits and saves an event in the wizard. Updated dates were not reflecting on the explore-events card, the event detail page (`/events/[slug]`), and anywhere the event list is consumed — until a full browser refresh.

### Root Cause

Three related issues:

1. **`api.events.create()` did not bust the event list cache** — creating a brand-new event didn't clear `eventListCache`, so the new event wouldn't appear in explore-events within the 30s TTL window.
2. **`api.events.submit()`, `resubmit()`, `publish()` did not bust caches** — status-change mutations left the cached list/detail stale.
3. **Already-mounted pages never re-fetched** — explore-events and the event slug page load data once on mount with `useEffect([], [])`. If the user edited in the wizard and switched tabs back to an already-loaded page, they'd see stale data until a manual refresh.

### Files Changed

#### `frontend/lib/api-client.ts`

- **Category:** Bug Fix / Refactor
- Added exported `invalidateEventCaches(eventId?: string)` helper that clears both `eventListCache` and `eventDetailCache` (or just one entry if `eventId` is passed).
- `api.events.create()` now busts `eventListCache` before returning so new events appear immediately.
- `api.events.submit()`, `api.events.resubmit()`, `api.events.publish()` now bust both caches for the mutated event ID.
- `api.events.update()` already did this — no change needed there.

#### `frontend/app/explore-events/page.tsx`

- **Category:** Bug Fix
- Extracted `fetchEvents()` function inside the `useEffect`.
- Added a `document.addEventListener("visibilitychange", onVisible)` listener: whenever the tab becomes visible again (user switches back from the wizard), `fetchEvents()` is called. Since the cache was already busted by `api.events.update()`, the refetch hits the network and the cards update immediately.
- Cleanup removes the listener on unmount.

#### `frontend/app/events/[slug]/page.tsx`

- **Category:** Bug Fix
- Added a `refreshKey` state variable (integer, starts at 0).
- A separate `useEffect` listens to `visibilitychange` and increments `refreshKey` each time the tab becomes visible.
- `refreshKey` added to the dependency array of the main data-fetch `useEffect` — so every time the user switches back to this tab, the event detail, agenda, speakers, and sponsors are all re-fetched from the network (cache was already busted by the save).

### Result

| Action | Before | After |
|---|---|---|
| Edit date in wizard → Save Changes → go to explore-events | Stale card (up to 30s) | Fresh immediately |
| Edit date in wizard → Save Changes → switch back to open event page | Stale until manual refresh | Refetches on tab focus |
| Create new event → go to explore-events | Event missing for up to 30s | Appears immediately |
| Submit / publish event → browse | Stale status badge | Cleared on next load |

---

## 12. Wizard Date/Time Save — Fixed UTC Timezone Shift Corrupting Stored Dates

### Overview

Fixed a critical bug where editing and saving event dates in Step 2 of the wizard was writing the **wrong date** to the database — always shifted backwards by the local UTC offset (e.g. an Indian admin picking `Oct 18` had `Oct 17` saved).

### Root Cause

Every place in the wizard that built a date payload used `new Date("YYYY-MM-DDT00:00:00").toISOString()`. On a machine in IST (UTC+5:30):

```js
new Date("2026-10-18T00:00:00").toISOString()
// → "2026-10-17T18:30:00.000Z"   ❌ one full day behind
```

`new Date(localString)` without a timezone suffix interprets the string in **local time**, then `toISOString()` converts to UTC — shifting the date back by the UTC offset. With IST (+5:30) that is a 5-hour-30-minute shift, crossing midnight and landing on the previous calendar day.

The same bug affected `startDate`, `endDate`, `eventDate`, `startTime`, and `endTime` in all five payload-building paths: `saveChanges()`, `saveRegistrationForm()`, `saveTicketSettings()`, and the two `publish()` branches.

### File Changed

#### `frontend/app/admin/events/create/page.tsx`

- **Category:** Bug Fix

**Fix — date fields** (`startDate`, `endDate`, `eventDate`):  
Draft stores `"YYYY-MM-DD"`. Append `T00:00:00.000Z` directly as a template literal — no `new Date()` involved:
```ts
// Before (broken on non-UTC machines)
startDate: new Date(`${draft.startDate}T00:00:00`).toISOString()

// After (correct everywhere)
startDate: `${draft.startDate}T00:00:00.000Z`
```

**Fix — time fields** (`startTime`, `endTime`):  
Draft stores `"YYYY-MM-DDTHH:mm"` (local-naive, from `<input type="datetime-local">`). Extract the date and time portions with `slice` and assemble the UTC string directly:
```ts
// Before (shifts by UTC offset)
startTime: new Date(draft.startTime).toISOString()

// After (literal time the admin typed, sent as UTC)
startTime: `${draft.startTime.slice(0,10)}T${draft.startTime.slice(11,16)}:00.000Z`
```

**All five payload sites fixed** — `saveChanges()`, `saveRegistrationForm()` (fallback create), `saveTicketSettings()` (fallback create), `publish()` update branch, `publish()` create branch.

### Verification

```
startDate: "2026-10-18T00:00:00.000Z"  ✅  (was "2026-10-17T18:30:00.000Z")
endDate:   "2026-10-20T00:00:00.000Z"  ✅  (was "2026-10-19T18:30:00.000Z")
startTime: "2026-10-18T09:00:00.000Z"  ✅  (was "2026-10-18T03:30:00.000Z")
endTime:   "2026-10-20T17:00:00.000Z"  ✅  (was "2026-10-20T11:30:00.000Z")
```

`npx tsc --noEmit` — zero errors.

---

## 13. Event Time Display — Show Correct Start/End Time on Cards and Event Page

### Overview

Fixed event time not showing correctly on the explore-events card and event detail page. The card was showing `12:00 AM – 12:00 AM` (midnight) because it was reading `startDate`/`endDate` (date-only fields) instead of `startTime`/`endTime`. Also added a dedicated Time info card on the event detail page.

### Root Cause

Three separate issues:

1. **explore-events card** — `formatTimeRange(start, end)` was called with `start = event.startDate` and `end = event.endDate`. These are calendar date fields (`"2026-10-18T00:00:00.000Z"`), not the time-of-day the admin set. Result: midnight showed as the time on every card.

2. **`formatTimeRange` itself used `toLocaleTimeString()`** — which applies the browser's local timezone offset to UTC timestamps. So `"09:00:00.000Z"` in IST (+5:30) would display as `2:30 PM` instead of `9:00 AM`.

3. **Slug page had no time display card** — `startTime`/`endTime` were read but `fmt()` was defined and never called. Users had no way to see the event time.

### Files Changed

#### `frontend/app/explore-events/page.tsx`

- **Category:** Bug Fix
- Added `timeStart = event.startTime || ""` and `timeEnd = event.endTime || ""` variables separate from the `start`/`end` date range variables.
- Passed `timeStart` / `timeEnd` to `formatTimeRange()` instead of `start`/`end`.
- Rewrote `formatTimeRange()` to extract `HH:mm` directly from the UTC ISO string using `iso.slice(11, 16)` and manually convert to 12-hour format — no `new Date()` or `toLocaleTimeString()` involved:
  ```ts
  // "2026-10-18T09:00:00.000Z" → "9:00 AM"
  const hhmm = iso.slice(11, 16);
  const h12 = hh % 12 || 12;
  const ampm = hh < 12 ? "AM" : "PM";
  ```
  Shows `"TBA"` when `startTime` is not set.

#### `frontend/app/events/[slug]/page.tsx`

- **Category:** Bug Fix / Feature
- Fixed `startD`/`endD` (used for `dayName`, `monthShort`, `dayNum`, `year`) to come from `event.startDate` / `event.endDate` instead of `event.startTime` / `event.endTime` — these are date display variables, not time display variables.
- Added `extractUtcTime(iso)` helper — same slice-based UTC extraction as above.
- Added `startTimeLabel`, `endTimeLabel`, `timeRangeLabel` derived values.
- Added a **Time info card** in the event detail sidebar (between Date and Venue cards) that shows `timeRangeLabel` (e.g. `"9:00 AM – 5:00 PM"`). The card only renders when `startTime` is set, so events without a time don't show an empty card.
