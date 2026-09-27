# PUVerse V1 — Backend API Contract

**Frontend Integration and Production Handoff Document**

| Field | Value |
|---|---|
| Project | PUVerse |
| Version | V1 |
| Document Type | Backend API Contract |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL + Prisma |
| Authentication | JWT + Refresh Token Sessions |
| API Style | REST |
| Swagger | http://localhost:3001/api/docs |
| Status | Production Handoff |
| Last Updated | 2026-09-08 |

> The deployed backend implementation and Swagger/OpenAPI specification are the final source of truth if this document and implementation ever differ.

---

## Revision History

| Version | Date | Changes | Author |
|---|---|---|---|
| V1.0 | 2026-09-08 | Initial V1 API contract | Backend Team |

---

## Intended Audience

- Frontend developers
- Backend developers
- QA/testing developers
- DevOps/deployment team
- Technical leads

---

## 1. Project Overview

PUVerse is a university event management platform for Parul University. It enables authenticated users to discover and register for events, Event Admins to create and manage events through an approval workflow, and Super Admins to govern users and approve event publications.

### V1 Scope

- Authentication: register, login, refresh, logout, password management, forgot/reset password
- User management (SUPER_ADMIN only)
- Event creation, management, approval workflow, and publication
- Event content: agenda, speakers, sponsors
- Dynamic registration forms (Event Admin configures, participants submit)
- Participant event registration

### Roles

| Role | Responsibilities |
|---|---|
| `SUPER_ADMIN` | Manages users, assigns roles, reviews and approves/rejects/requests changes on events |
| `EVENT_ADMIN` | Creates and manages events, submits for approval, publishes approved events |
| `PARTICIPANT` | Views published events, registers for events |

> **QR code attendance, QR scanning, attendance marking, and attendance analytics are NOT part of V1. These belong to V2.**

---

## 2. Base URLs

| Environment | URL |
|---|---|
| Development | `http://localhost:3001` |
| Production | `[TO BE CONFIRMED — configure via environment variable]` |

**Swagger UI (Development):** `http://localhost:3001/api/docs`

Frontend must never hardcode API URLs. Use environment variables:

```env
# Development
VITE_API_URL=http://localhost:3001

# Production
VITE_API_URL=https://[PRODUCTION_DOMAIN]
```

---

## 3. API Conventions

| Convention | Value |
|---|---|
| Request format | JSON |
| Response format | JSON |
| Content-Type header | `application/json` |
| ID format | UUID v4 |
| Timestamp format | ISO 8601 UTC — `2026-08-29T11:00:00.000Z` |
| HTTP methods used | GET, POST, PATCH, DELETE |

**Authenticated requests must include:**

```http
Authorization: Bearer <access_token>
```

> The frontend must never send the refresh token as the Bearer access token. These are two separate credentials with different purposes.

---

## 4. Uniform Error Response Format

Every error response from the backend uses this exact shape:

```json
{
  "statusCode": 400,
  "message": "string or array of validation error strings",
  "timestamp": "2026-09-08T10:00:00.000Z",
  "path": "/auth/login"
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request — validation failure or business rule violation |
| 401 | Unauthorized — missing, invalid, or expired token; invalid credentials |
| 403 | Forbidden — authenticated but insufficient role |
| 404 | Not Found |
| 409 | Conflict — duplicate email |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable — SMTP not configured |

---

## 5. Authentication API

### Enums Used in Authentication

| Enum | Values |
|---|---|
| `Role` | `PARTICIPANT` \| `EVENT_ADMIN` \| `SUPER_ADMIN` |
| `UserType` | `STUDENT` \| `FACULTY` |
| `UserStatus` | `ACTIVE` \| `INACTIVE` \| `BLOCKED` |

---

### POST /auth/register

**Public.** Rate limit: 10 requests per 60 seconds.

**Request Body:**

```json
{
  "fullName": "string, required, non-empty",
  "email": "string, required, valid email ending with @paruluniversity.ac.in",
  "password": "string, required, minimum 8 characters",
  "userType": "STUDENT | FACULTY"
}
```

**Success 201:**

```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "fullName": "string",
    "email": "string",
    "role": "PARTICIPANT",
    "userType": "STUDENT | FACULTY",
    "status": "ACTIVE",
    "createdAt": "ISO timestamp"
  }
}
```

**Errors:** `400` validation failure, `409` email already registered

---

### POST /auth/login

**Public.** Rate limit: 5 requests per 60 seconds.

**Request Body:**

```json
{
  "email": "string, required",
  "password": "string, required"
}
```

**Success 200:**

```json
{
  "message": "Login successful",
  "accessToken": "string (JWT)",
  "refreshToken": "string (raw hex token)",
  "sessionId": "uuid",
  "user": {
    "id": "uuid",
    "fullName": "string",
    "email": "string",
    "role": "PARTICIPANT | EVENT_ADMIN | SUPER_ADMIN",
    "userType": "STUDENT | FACULTY",
    "status": "ACTIVE",
    "mustChangePassword": false
  }
}
```

**Errors:** `400` validation, `401` invalid credentials, `401` account not active

> If `mustChangePassword` is `true`, the frontend must redirect the user to the change password page before allowing access to any other route. The `POST /auth/password` endpoint is accessible even when `mustChangePassword` is `true`.

---

### POST /auth/refresh

**Public.** Rate limit: 10 requests per 60 seconds.

**Request Body:**

```json
{
  "sessionId": "uuid, required",
  "refreshToken": "string, required"
}
```

**Success 200:**

```json
{
  "message": "Token refreshed successfully",
  "accessToken": "string (new JWT)",
  "refreshToken": "string (new raw token)",
  "sessionId": "uuid (new session ID)"
}
```

**Errors:** `401` session not found, `401` session revoked, `401` session expired, `401` invalid token

> Refresh token rotation is implemented. Every refresh call invalidates the old session and creates a new one. The frontend must store the new `accessToken`, `refreshToken`, and `sessionId` returned from every refresh call.

---

### POST /auth/logout

**Authenticated.** Any role. No request body.

**Success 200:**

```json
{
  "message": "Logged out successfully"
}
```

---

### POST /auth/logout-all

**Authenticated.** Any role. No request body.

**Success 200:**

```json
{
  "message": "Logged out from all sessions successfully"
}
```

---

### POST /auth/password

**Authenticated.** Any role. Accessible when `mustChangePassword` is `true`.

**Request Body:**

```json
{
  "currentPassword": "string, required",
  "newPassword": "string, required, minimum 8 characters"
}
```

**Success 200:**

```json
{
  "message": "Password changed successfully. Please login again."
}
```

> All sessions are revoked after a password change. The frontend must clear all authentication state and redirect the user to the login page.

---

### GET /auth/me

**Authenticated.** Any role. No request body.

**Success 200:**

```json
{
  "userId": "uuid",
  "email": "string",
  "role": "PARTICIPANT | EVENT_ADMIN | SUPER_ADMIN",
  "userType": "STUDENT | FACULTY",
  "sessionId": "uuid"
}
```

---

### POST /auth/forgot-password

**Public.** Rate limit: 3 requests per 5 minutes.

**Request Body:**

```json
{
  "email": "string, required, must end with @paruluniversity.ac.in"
}
```

**Success 200** (always returned regardless of whether the email exists — security by design):

```json
{
  "message": "If an active account exists for this email, a password-reset link has been sent."
}
```

**Errors:** `503` if SMTP is not configured on the backend

---

### POST /auth/reset-password

**Public.** Rate limit: 5 requests per 15 minutes.

**Request Body:**

```json
{
  "token": "string, required, exactly 64 hex characters",
  "newPassword": "string, required, minimum 8 characters"
}
```

**Success 200:**

```json
{
  "message": "Password reset successfully. Please login again."
}
```

**Errors:** `401` invalid or expired token

> The reset token is single-use. All sessions are revoked after a successful password reset. The frontend must clear all authentication state and redirect to login.

---

## 6. Users API

All endpoints require `SUPER_ADMIN` role except `GET /users/me`.

---

### GET /users/me

**Authenticated.** Any role.

Returns the full user profile from the database for the currently authenticated user.

**Success 200:** Full user object — TO BE CONFIRMED BY BACKEND IMPLEMENTATION (exact fields from `UsersService.getMe`)

---

### GET /users

**Authenticated. SUPER_ADMIN only.**

Returns an array of all registered users.

**Success 200:** Array of user objects.

---

### GET /users/:id

**Authenticated. SUPER_ADMIN only.**

**Path parameter:** `id` — UUID of the user.

**Success 200:** Single user object.

**Errors:** `404` user not found

---

### PATCH /users/:id/role

**Authenticated. SUPER_ADMIN only.**

**Path parameter:** `id` — UUID of the user.

**Request Body:**

```json
{
  "role": "PARTICIPANT | EVENT_ADMIN | SUPER_ADMIN"
}
```

**Success 200:** Updated user object.

---

### DELETE /users/:id

**Authenticated. SUPER_ADMIN only.**

Permanently deletes a participant or event admin and their account-owned data. Super Admin users cannot be deleted. Users who still own events must have those events reassigned or removed first.

**Path parameter:** `id` — UUID of the user.

**Success 200:**

```json
{
  "message": "User permanently deleted",
  "userId": "uuid"
}
```

**Errors:** `404` user not found, `403` Super Admin deletion attempted, `409` user still owns events.

---

## 7. Events API

### EventStatus Enum

`DRAFT` | `PENDING_APPROVAL` | `CHANGES_REQUESTED` | `APPROVED` | `REJECTED` | `PUBLISHED` | `COMPLETED`

---

### POST /events

**Authenticated. EVENT_ADMIN role required.**

**Request Body:**

```json
{
  "title": "string, required, max 200 characters",
  "description": "string, optional, max 5000 characters",
  "bannerUrl": "string, optional, valid URL",
  "eventDate": "ISO date string, required",
  "startTime": "ISO date string, optional",
  "endTime": "ISO date string, optional",
  "venue": "string, optional, max 300 characters"
}
```

**Success 201:** Created event object. Initial `status` is `DRAFT`. A URL-safe `slug` is auto-generated from the title.

---

### GET /events

**Public. No authentication required.**

Returns all `PUBLISHED` events ordered by `eventDate` ascending.

**Success 200:** Array of event objects.

---

### GET /events/my

**Authenticated. EVENT_ADMIN role required.**

Returns all events created by the authenticated Event Admin, ordered by `createdAt` descending.

**Success 200:** Array of event objects.

---

### GET /events/:id/preview

**Authenticated. EVENT_ADMIN role required. Own events only.**

Returns full event data for preview before publication.

**Success 200:**

```json
{
  "event": {
    "id": "uuid",
    "title": "string",
    "slug": "string",
    "description": "string | null",
    "bannerUrl": "string | null",
    "eventDate": "ISO timestamp",
    "startTime": "ISO timestamp | null",
    "endTime": "ISO timestamp | null",
    "venue": "string | null",
    "status": "EventStatus"
  },
  "agenda": "array of agenda items ordered by displayOrder",
  "speakers": "array of speakers ordered by displayOrder",
  "sponsors": "array of sponsors ordered by displayOrder",
  "registrationForm": "form object | null"
}
```

**Errors:** `404` event not found or not owned by the authenticated user

---

### GET /events/:id

**Public. No authentication required.**

Returns a single `PUBLISHED` event by ID.

**Errors:** `404` event not found or not published

---

### POST /events/:id/submit

**Authenticated. EVENT_ADMIN role required. Own events only.**

Transitions event status from `DRAFT` to `PENDING_APPROVAL`.

Requires `title` and `eventDate` to be present on the event.

**Success 200:** Updated event object with `status: "PENDING_APPROVAL"`.

**Errors:** `400` only DRAFT events can be submitted, `400` missing required fields with `missingFields` array, `404` not found

---

### POST /events/:id/resubmit

**Authenticated. EVENT_ADMIN role required. Own events only.**

Transitions event status from `CHANGES_REQUESTED` back to `PENDING_APPROVAL`.

**Success 200:** Updated event object with `status: "PENDING_APPROVAL"`.

**Errors:** `400` only CHANGES_REQUESTED events can be resubmitted

---

### POST /events/:id/publish

**Authenticated. EVENT_ADMIN role required. Own events only.**

Transitions event status from `APPROVED` to `PUBLISHED`. Also publishes the latest `DRAFT` registration form for the event if one exists.

**Success 200:** Updated event object with `status: "PUBLISHED"`.

**Errors:** `400` only APPROVED events can be published

---

### PATCH /events/:id

**Authenticated. EVENT_ADMIN role required. Own events only.**

Editable only when event status is `DRAFT` or `CHANGES_REQUESTED`.

**Request Body:** All fields from `POST /events` are optional.

```json
{
  "title": "string, optional, max 200 characters",
  "description": "string, optional, max 5000 characters",
  "bannerUrl": "string, optional, valid URL",
  "eventDate": "ISO date string, optional",
  "startTime": "ISO date string, optional",
  "endTime": "ISO date string, optional",
  "venue": "string, optional, max 300 characters"
}
```

**Success 200:** Updated event object.

**Errors:** `403` event cannot be edited in its current status, `404` not found

---

### DELETE /events/:id

**Authenticated. EVENT_ADMIN role required. Own events only.**

Only `DRAFT` events can be deleted.

**Success 200:**

```json
{
  "message": "Event deleted successfully"
}
```

**Errors:** `403` only draft events can be deleted, `404` not found

---

## 8. Event Lifecycle State Machine

```
DRAFT
  ├── edit allowed
  ├── delete allowed
  └── submit ──────────────────────► PENDING_APPROVAL
                                           │
                          ┌────────────────┼────────────────┐
                          ▼                ▼                ▼
                       APPROVED    CHANGES_REQUESTED    REJECTED
                          │                │
                          │         Event Admin edits
                          │                │
                          │           resubmit
                          │                │
                          │                ▼
                          │         PENDING_APPROVAL
                          │
                       publish
                          │
                          ▼
                       PUBLISHED
```

| Status | Edit Allowed | Delete Allowed | Submit | Resubmit | Publish |
|---|---|---|---|---|---|
| `DRAFT` | Yes | Yes | Yes | No | No |
| `PENDING_APPROVAL` | No | No | No | No | No |
| `CHANGES_REQUESTED` | Yes | No | No | Yes | No |
| `APPROVED` | No | No | No | No | Yes |
| `REJECTED` | No | No | No | No | No |
| `PUBLISHED` | No | No | No | No | No |

---

## 9. Admin Events API

All endpoints require `SUPER_ADMIN` role. Base path: `/admin/events`

---

### GET /admin/events/pending

Returns all events with status `PENDING_APPROVAL`.

**Success 200:** Array of event objects.

---

### GET /admin/events/:id

Returns full event details for review.

**Success 200:** Event object with full details — TO BE CONFIRMED BY BACKEND IMPLEMENTATION (exact included relations)

---

### PATCH /admin/events/:id/approve

Transitions event to `APPROVED`. Creates an `EventApproval` record with action `APPROVED`.

**Request Body:**

```json
{
  "remarks": "string, optional, max 1000 characters"
}
```

**Success 200:** Updated event object.

---

### PATCH /admin/events/:id/request-changes

Transitions event to `CHANGES_REQUESTED`. Creates an `EventApproval` record with action `CHANGES_REQUESTED`.

**Request Body:**

```json
{
  "remarks": "string, optional, max 1000 characters"
}
```

**Success 200:** Updated event object.

---

### PATCH /admin/events/:id/reject

Transitions event to `REJECTED`. Creates an `EventApproval` record with action `REJECTED`.

**Request Body:**

```json
{
  "remarks": "string, optional, max 1000 characters"
}
```

**Success 200:** Updated event object.

### EventApprovalAction Enum

`APPROVED` | `CHANGES_REQUESTED` | `REJECTED`

---

## 10. Agenda API

Base path: `/events/:eventId/agenda`

---

### POST /events/:eventId/agenda

**Authenticated. EVENT_ADMIN. Own events only.**

**Request Body:**

```json
{
  "title": "string, required, max 200 characters",
  "description": "string, optional, max 3000 characters",
  "startTime": "ISO datetime string, required",
  "endTime": "ISO datetime string, optional",
  "displayOrder": "integer, required, minimum 1"
}
```

**Success 201:** Created agenda item object.

---

### GET /events/:eventId/agenda

**Public. No authentication required.**

Returns all agenda items for the event ordered by `displayOrder` ascending.

**Success 200:** Array of agenda item objects.

---

### PATCH /events/:eventId/agenda/:agendaId

**Authenticated. EVENT_ADMIN. Own events only.**

All fields optional.

```json
{
  "title": "string, optional",
  "description": "string, optional",
  "startTime": "ISO datetime string, optional",
  "endTime": "ISO datetime string, optional",
  "displayOrder": "integer, optional, minimum 1"
}
```

**Success 200:** Updated agenda item object.

---

### DELETE /events/:eventId/agenda/:agendaId

**Authenticated. EVENT_ADMIN. Own events only.**

**Success 200:** Deleted agenda item confirmation — TO BE CONFIRMED BY BACKEND IMPLEMENTATION

---

### PATCH /events/:eventId/agenda/reorder

**Authenticated. EVENT_ADMIN. Own events only.**

**Request Body:**

```json
{
  "items": [
    { "id": "uuid", "displayOrder": 1 },
    { "id": "uuid", "displayOrder": 2 }
  ]
}
```

**Success 200:** TO BE CONFIRMED BY BACKEND IMPLEMENTATION

---

## 11. Speakers API

Base path: `/events/:eventId/speakers`

---

### POST /events/:eventId/speakers

**Authenticated. EVENT_ADMIN. Own events only.**

**Request Body:**

```json
{
  "name": "string, required, max 200 characters",
  "designation": "string, optional, max 200 characters",
  "organization": "string, optional, max 300 characters",
  "bio": "string, optional, max 3000 characters",
  "photoUrl": "string, optional, valid URL",
  "linkedinUrl": "string, optional, valid URL",
  "displayOrder": "integer, optional, minimum 1"
}
```

**Success 201:** Created speaker object.

---

### GET /events/:eventId/speakers

**Public. No authentication required.**

Returns all speakers ordered by `displayOrder`.

**Success 200:** Array of speaker objects.

---

### GET /events/:eventId/speakers/:speakerId

**Public. No authentication required.**

**Success 200:** Single speaker object.

---

### PATCH /events/:eventId/speakers/:speakerId

**Authenticated. EVENT_ADMIN. Own events only.** All fields optional.

**Success 200:** Updated speaker object.

---

### DELETE /events/:eventId/speakers/:speakerId

**Authenticated. EVENT_ADMIN. Own events only.**

**Success 200:** TO BE CONFIRMED BY BACKEND IMPLEMENTATION

---

### PATCH /events/:eventId/speakers/reorder

**Authenticated. EVENT_ADMIN. Own events only.**

**Request Body:**

```json
{
  "items": [
    { "id": "uuid", "displayOrder": 1 }
  ]
}
```

---

## 12. Sponsors API

Base path: `/events/:eventId/sponsors`

---

### POST /events/:eventId/sponsors

**Authenticated. EVENT_ADMIN. Own events only.**

**Request Body:**

```json
{
  "name": "string, required, max 200 characters",
  "logoUrl": "string, optional, valid URL",
  "description": "string, optional, max 3000 characters",
  "websiteUrl": "string, optional, valid URL",
  "sponsorshipLevel": "string, optional, max 100 characters (e.g. Gold, Silver, Bronze)",
  "displayOrder": "integer, optional, minimum 1"
}
```

**Success 201:** Created sponsor object.

---

### GET /events/:eventId/sponsors

**Public. No authentication required.**

**Success 200:** Array of sponsor objects.

---

### GET /events/:eventId/sponsors/:sponsorId

**Public. No authentication required.**

**Success 200:** Single sponsor object.

---

### PATCH /events/:eventId/sponsors/:sponsorId

**Authenticated. EVENT_ADMIN. Own events only.** All fields optional.

**Success 200:** Updated sponsor object.

---

### DELETE /events/:eventId/sponsors/:sponsorId

**Authenticated. EVENT_ADMIN. Own events only.**

**Success 200:** TO BE CONFIRMED BY BACKEND IMPLEMENTATION

---

### PATCH /events/:eventId/sponsors/reorder

**Authenticated. EVENT_ADMIN. Own events only.**

**Request Body:**

```json
{
  "items": [
    { "id": "uuid", "displayOrder": 1 }
  ]
}
```

---

## 13. Registration Form API

Base path: `/events/:eventId/registration-form`

---

### GET /registration-fields

**Public. No authentication required.**

Returns the full catalog of available registration field definitions that an Event Admin can select when building a registration form.

**Success 200:** Array of field definition objects:

```json
{
  "key": "FULL_NAME",
  "label": "Full Name",
  "category": "SYSTEM | ACADEMIC | PERSONAL | TECHNICAL | HACKATHON | WORKSHOP",
  "inputType": "TEXT | EMAIL | PHONE | NUMBER | DATE | URL | TEXTAREA | SELECT | RADIO | CHECKBOX | MULTI_SELECT",
  "systemMandatory": true,
  "options": ["only present for SELECT, RADIO, MULTI_SELECT input types"]
}
```

**System mandatory fields** (automatically included in every form, cannot be removed):

`FULL_NAME`, `EMAIL`, `UNIVERSITY_ID`, `PHONE_NUMBER`, `COLLEGE`, `DEPARTMENT`

**Field categories:**

| Category | Description |
|---|---|
| `SYSTEM` | Core identity fields, always mandatory |
| `ACADEMIC` | Academic details: course, year, semester, CGPA |
| `PERSONAL` | Personal details: gender, date of birth, city |
| `TECHNICAL` | Technical profile: GitHub, LinkedIn, skills |
| `HACKATHON` | Hackathon-specific: team name, size, project title |
| `WORKSHOP` | Workshop-specific: experience level, learning goal |

---

### POST /events/:eventId/registration-form

**Authenticated. EVENT_ADMIN. Own events only.**

**Request Body:**

```json
{
  "selectedFields": [
    { "key": "TEAM_NAME", "required": true },
    { "key": "TEAM_SIZE", "required": true },
    { "key": "GITHUB", "required": false }
  ]
}
```

Maximum 30 selected fields. System mandatory fields are always included automatically and do not need to be listed.

**Success 201:** Created registration form object.

---

### GET /events/:eventId/registration-form

**Authenticated. EVENT_ADMIN. Own events only.**

Returns the registration form for the event (admin view).

**Success 200:** Registration form object.

---

### GET /events/:eventId/registration-form/public

**Public. No authentication required.**

Returns the published registration form for a published event. Used by participants to render the registration form UI.

**Success 200:** Published registration form object.

---

### PATCH /events/:eventId/registration-form

**Authenticated. EVENT_ADMIN. Own events only.**

**Request Body:** Same as `POST /events/:eventId/registration-form`.

**Success 200:** Updated registration form object.

---

## 14. Registrations API

Base path: `/events/:eventId/registrations`

All endpoints require authentication (any role).

---

### POST /events/:eventId/registrations

**Authenticated. Any role.**

Participant submits a registration for an event.

**Request Body:**

```json
{
  "registrationData": {
    "FULL_NAME": "Rahul Patel",
    "EMAIL": "rahul@paruluniversity.ac.in",
    "UNIVERSITY_ID": "PU12345",
    "PHONE_NUMBER": "9876543210",
    "COLLEGE": "Parul University",
    "DEPARTMENT": "Computer Science",
    "TEAM_NAME": "Code Warriors",
    "GITHUB": "https://github.com/rahul"
  }
}
```

`registrationData` is a flexible key-value object. Keys must match the field keys defined in the event's published registration form. System mandatory fields must always be present.

**Success 201:** Created registration object.

---

### GET /events/:eventId/registrations/me

**Authenticated. Any role.**

Returns the authenticated user's own registration for the event.

**Success 200:** Registration object.

---

### GET /events/:eventId/registrations/count

**Authenticated. Any role.** Service enforces EVENT_ADMIN ownership check.

Returns the registration count for the event.

**Success 200:** TO BE CONFIRMED BY BACKEND IMPLEMENTATION (count response shape)

---

### GET /events/:eventId/registrations

**Authenticated. Any role.** Service enforces EVENT_ADMIN ownership check.

Returns all registrations for the event.

**Success 200:** Array of registration objects.

---

### GET /events/:eventId/registrations/:registrationId

**Authenticated. Any role.** Service enforces ownership check.

Returns a single registration.

**Success 200:** Registration object.

---

### DELETE /events/:eventId/registrations/:registrationId

**Authenticated. Any role.**

Participant cancels their own registration.

**Success 200:** TO BE CONFIRMED BY BACKEND IMPLEMENTATION

---

## 15. Health Check

### GET /health

**Public. No authentication required.**

**Success 200:**

```json
{
  "status": "ok",
  "info": { "application": { "status": "up" } },
  "error": {},
  "details": { "application": { "status": "up" } }
}
```

---

## 16. Rate Limits

| Endpoint | Limit | Window |
|---|---|---|
| `POST /auth/register` | 10 requests | 60 seconds |
| `POST /auth/login` | 5 requests | 60 seconds |
| `POST /auth/refresh` | 10 requests | 60 seconds |
| `POST /auth/forgot-password` | 3 requests | 5 minutes |
| `POST /auth/reset-password` | 5 requests | 15 minutes |
| All other endpoints | 100 requests | 60 seconds |

Rate limit exceeded returns `429 Too Many Requests` with a `Retry-After` header indicating seconds until the window resets.

---

## 17. Enums Reference

> All enum values are case-sensitive. The frontend must use exact values as defined below.

| Enum | Values |
|---|---|
| `Role` | `PARTICIPANT` \| `EVENT_ADMIN` \| `SUPER_ADMIN` |
| `UserType` | `STUDENT` \| `FACULTY` |
| `UserStatus` | `ACTIVE` \| `INACTIVE` \| `BLOCKED` |
| `EventStatus` | `DRAFT` \| `PENDING_APPROVAL` \| `CHANGES_REQUESTED` \| `APPROVED` \| `REJECTED` \| `PUBLISHED` \| `COMPLETED` |
| `EventApprovalAction` | `APPROVED` \| `CHANGES_REQUESTED` \| `REJECTED` |
| `RegistrationStatus` | `ACTIVE` \| `CANCELLED` |
| `RegistrationFormStatus` | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |

---

## 18. Authentication Flow for Frontend

### Login Flow

```
1. POST /auth/login
2. Store accessToken, refreshToken, sessionId, user object
3. Attach Authorization: Bearer <accessToken> to all protected requests
4. On 401 response → call POST /auth/refresh with { sessionId, refreshToken }
5. Store new accessToken, refreshToken, sessionId from refresh response
6. Retry the original failed request
7. If refresh returns 401 → clear all auth state → redirect to login
```

### mustChangePassword Flow

```
1. After login, check user.mustChangePassword
2. If true → redirect to change password page
3. Call POST /auth/password with currentPassword and newPassword
4. On success → clear all auth state → redirect to login
```

### Logout Flow

```
1. Call POST /auth/logout
2. Clear all stored auth state (accessToken, refreshToken, sessionId, user)
3. Redirect to login
```

---

## 19. Permissions Matrix

| Action | SUPER_ADMIN | EVENT_ADMIN | PARTICIPANT |
|---|---|---|---|
| `GET /users` | Yes | No | No |
| `GET /users/:id` | Yes | No | No |
| `PATCH /users/:id/role` | Yes | No | No |
| `POST /events` | No | Yes | No |
| `GET /events` (published) | Yes | Yes | Yes |
| `GET /events/my` | No | Yes | No |
| `GET /events/:id/preview` | No | Yes (own) | No |
| `POST /events/:id/submit` | No | Yes (own) | No |
| `POST /events/:id/resubmit` | No | Yes (own) | No |
| `POST /events/:id/publish` | No | Yes (own) | No |
| `PATCH /events/:id` | No | Yes (own) | No |
| `DELETE /events/:id` | No | Yes (own, DRAFT only) | No |
| `GET /admin/events/pending` | Yes | No | No |
| `PATCH /admin/events/:id/approve` | Yes | No | No |
| `PATCH /admin/events/:id/request-changes` | Yes | No | No |
| `PATCH /admin/events/:id/reject` | Yes | No | No |
| `POST /events/:eventId/agenda` | No | Yes (own) | No |
| `GET /events/:eventId/agenda` | Yes | Yes | Yes |
| `POST /events/:eventId/speakers` | No | Yes (own) | No |
| `GET /events/:eventId/speakers` | Yes | Yes | Yes |
| `POST /events/:eventId/sponsors` | No | Yes (own) | No |
| `GET /events/:eventId/sponsors` | Yes | Yes | Yes |
| `POST /events/:eventId/registration-form` | No | Yes (own) | No |
| `GET /events/:eventId/registration-form/public` | Yes | Yes | Yes |
| `POST /events/:eventId/registrations` | Yes | Yes | Yes |
| `GET /events/:eventId/registrations/me` | Yes | Yes | Yes |
| `GET /events/:eventId/registrations` | Yes (own event) | Yes (own event) | No |
| `DELETE /events/:eventId/registrations/:id` | Yes | Yes | Yes (own) |

---

## 20. File and Image Handling

V1 does not provide a backend file upload API. The following fields accept externally hosted URLs only:

| Field | Endpoint |
|---|---|
| `bannerUrl` | Event |
| `photoUrl` | Speaker |
| `logoUrl` | Sponsor |

The frontend must handle image hosting separately (e.g. upload to a CDN or cloud storage) and pass the resulting public URL to the API.

---

## 21. Pagination, Filtering, and Sorting

Not implemented in V1. All list endpoints return complete result sets without pagination, filtering, or sorting parameters.

---

## 22. CORS

The backend allows the origin configured in the `FRONTEND_URL` environment variable. In development this is `http://localhost:5173`. Credentials are enabled (`credentials: true`).

The frontend origin must match `FRONTEND_URL` exactly. If the frontend runs on a different port or domain, `FRONTEND_URL` must be updated on the backend.

---

## 23. Security Notes for Frontend

- Never expose `JWT_SECRET`, `DATABASE_URL`, or SMTP credentials in frontend code
- Never hardcode production API URLs — use environment variables
- Do not trust frontend role checks as authorization — the backend enforces all authorization
- Handle `401` and `403` responses gracefully in all API calls
- Do not log access tokens, refresh tokens, or passwords
- Use HTTPS in production
- Clear all authentication state on logout and on session expiry
- Display backend error messages appropriately — do not expose raw stack traces to end users

---

## 24. V1 Scope Boundary — Not in V1

The following features are **not** part of V1 and must not be implemented as V1 API functionality:

- QR code generation for attendance
- QR code scanning
- Attendance marking
- Attendance analytics
- Advanced notification system
- Advanced analytics dashboard
- Multi-role users
- File upload API

> These features will be introduced in PUVerse V2.

---

## 25. Complete Endpoint Reference

### Authentication

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `POST` | `/auth/register` | No | — | Register new user |
| `POST` | `/auth/login` | No | — | Login |
| `POST` | `/auth/refresh` | No | — | Refresh access token |
| `POST` | `/auth/logout` | Yes | Any | Logout current session |
| `POST` | `/auth/logout-all` | Yes | Any | Logout all sessions |
| `POST` | `/auth/password` | Yes | Any | Change password |
| `GET` | `/auth/me` | Yes | Any | Get current user (JWT payload) |
| `POST` | `/auth/forgot-password` | No | — | Request password reset email |
| `POST` | `/auth/reset-password` | No | — | Reset password with token |

### Users

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/users/me` | Yes | Any | Get full user profile |
| `GET` | `/users` | Yes | SUPER_ADMIN | Get all users |
| `GET` | `/users/:id` | Yes | SUPER_ADMIN | Get user by ID |
| `PATCH` | `/users/:id/role` | Yes | SUPER_ADMIN | Update user role |

### Events

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `POST` | `/events` | Yes | EVENT_ADMIN | Create event |
| `GET` | `/events` | No | — | Get published events |
| `GET` | `/events/my` | Yes | EVENT_ADMIN | Get own events |
| `GET` | `/events/:id/preview` | Yes | EVENT_ADMIN | Preview own event |
| `GET` | `/events/:id` | No | — | Get published event by ID |
| `POST` | `/events/:id/submit` | Yes | EVENT_ADMIN | Submit for approval |
| `POST` | `/events/:id/resubmit` | Yes | EVENT_ADMIN | Resubmit after changes requested |
| `POST` | `/events/:id/publish` | Yes | EVENT_ADMIN | Publish approved event |
| `PATCH` | `/events/:id` | Yes | EVENT_ADMIN | Update event |
| `DELETE` | `/events/:id` | Yes | EVENT_ADMIN | Delete draft event |

### Admin — Events

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/admin/events/pending` | Yes | SUPER_ADMIN | Get pending approval events |
| `GET` | `/admin/events/:id` | Yes | SUPER_ADMIN | Get event for review |
| `PATCH` | `/admin/events/:id/approve` | Yes | SUPER_ADMIN | Approve event |
| `PATCH` | `/admin/events/:id/request-changes` | Yes | SUPER_ADMIN | Request changes |
| `PATCH` | `/admin/events/:id/reject` | Yes | SUPER_ADMIN | Reject event |

### Agenda

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `POST` | `/events/:eventId/agenda` | Yes | EVENT_ADMIN | Add agenda item |
| `GET` | `/events/:eventId/agenda` | No | — | Get agenda items |
| `PATCH` | `/events/:eventId/agenda/:agendaId` | Yes | EVENT_ADMIN | Update agenda item |
| `DELETE` | `/events/:eventId/agenda/:agendaId` | Yes | EVENT_ADMIN | Delete agenda item |
| `PATCH` | `/events/:eventId/agenda/reorder` | Yes | EVENT_ADMIN | Reorder agenda items |

### Speakers

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `POST` | `/events/:eventId/speakers` | Yes | EVENT_ADMIN | Add speaker |
| `GET` | `/events/:eventId/speakers` | No | — | Get all speakers |
| `GET` | `/events/:eventId/speakers/:speakerId` | No | — | Get single speaker |
| `PATCH` | `/events/:eventId/speakers/:speakerId` | Yes | EVENT_ADMIN | Update speaker |
| `DELETE` | `/events/:eventId/speakers/:speakerId` | Yes | EVENT_ADMIN | Delete speaker |
| `PATCH` | `/events/:eventId/speakers/reorder` | Yes | EVENT_ADMIN | Reorder speakers |

### Sponsors

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `POST` | `/events/:eventId/sponsors` | Yes | EVENT_ADMIN | Add sponsor |
| `GET` | `/events/:eventId/sponsors` | No | — | Get all sponsors |
| `GET` | `/events/:eventId/sponsors/:sponsorId` | No | — | Get single sponsor |
| `PATCH` | `/events/:eventId/sponsors/:sponsorId` | Yes | EVENT_ADMIN | Update sponsor |
| `DELETE` | `/events/:eventId/sponsors/:sponsorId` | Yes | EVENT_ADMIN | Delete sponsor |
| `PATCH` | `/events/:eventId/sponsors/reorder` | Yes | EVENT_ADMIN | Reorder sponsors |

### Registration Form

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/registration-fields` | No | — | Get field catalog |
| `POST` | `/events/:eventId/registration-form` | Yes | EVENT_ADMIN | Create registration form |
| `GET` | `/events/:eventId/registration-form` | Yes | EVENT_ADMIN | Get form (admin) |
| `GET` | `/events/:eventId/registration-form/public` | No | — | Get published form |
| `PATCH` | `/events/:eventId/registration-form` | Yes | EVENT_ADMIN | Update registration form |

### Registrations

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `POST` | `/events/:eventId/registrations` | Yes | Any | Register for event |
| `GET` | `/events/:eventId/registrations/me` | Yes | Any | Get own registration |
| `GET` | `/events/:eventId/registrations/count` | Yes | Any | Get registration count |
| `GET` | `/events/:eventId/registrations` | Yes | Any | Get all registrations |
| `GET` | `/events/:eventId/registrations/:registrationId` | Yes | Any | Get single registration |
| `DELETE` | `/events/:eventId/registrations/:registrationId` | Yes | Any | Cancel registration |

### Health

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/health` | No | — | Health check |

---

## 26. Frontend Integration Checklist

### Setup
- [ ] Configure `VITE_API_URL` environment variable
- [ ] Create centralized API client with base URL
- [ ] Configure `Authorization: Bearer` header injection
- [ ] Implement token refresh interceptor
- [ ] Implement global error handling for 401, 403, 404, 429, 500

### Authentication
- [ ] Registration form with university email validation
- [ ] Login with `mustChangePassword` redirect
- [ ] Store `accessToken`, `refreshToken`, `sessionId`, `user`
- [ ] Protected route guard using stored role
- [ ] Automatic token refresh on 401
- [ ] Logout (single session)
- [ ] Logout all sessions
- [ ] Change password flow
- [ ] Forgot password form
- [ ] Reset password form (reads token from URL query param)

### Users (SUPER_ADMIN UI)
- [ ] User list
- [ ] User detail view
- [ ] Role assignment

### Events (EVENT_ADMIN UI)
- [ ] Create event form
- [ ] Edit event (DRAFT and CHANGES_REQUESTED only)
- [ ] Delete event (DRAFT only)
- [ ] Event preview
- [ ] Submit for approval
- [ ] Resubmit after changes requested
- [ ] Publish approved event
- [ ] Agenda management (add, edit, delete, reorder)
- [ ] Speaker management (add, edit, delete, reorder)
- [ ] Sponsor management (add, edit, delete, reorder)
- [ ] Registration form builder using field catalog
- [ ] View registrations

### Events (SUPER_ADMIN UI)
- [ ] Pending events list
- [ ] Event review detail
- [ ] Approve event
- [ ] Request changes with remarks
- [ ] Reject event with remarks

### Events (Public / PARTICIPANT UI)
- [ ] Published events list
- [ ] Event detail page
- [ ] Registration form (rendered from published form definition)
- [ ] View own registration
- [ ] Cancel own registration

### Testing
- [ ] 401 handling and token refresh
- [ ] 403 handling
- [ ] 404 handling
- [ ] 409 conflict handling
- [ ] 429 rate limit handling
- [ ] Validation error display (400 with message array)
- [ ] Expired access token auto-refresh
- [ ] Revoked session redirect to login

---

## 27. Frontend Developer Handoff

The frontend developer must integrate against this API contract and the Swagger/OpenAPI specification available at `http://localhost:3001/api/docs`. The frontend must not directly access PostgreSQL or Prisma. All application data must flow through the REST API.

```
Frontend
   ↓
API Client (centralized, with auth headers and refresh logic)
   ↓
HTTP/HTTPS
   ↓
NestJS REST API
   ↓
JwtAuthGuard + RolesGuard
   ↓
Controllers
   ↓
Services
   ↓
Prisma ORM
   ↓
PostgreSQL
```

> If any API response, request field, enum value, validation rule, or authentication behaviour differs between this document and the actual deployed backend, the backend implementation and Swagger/OpenAPI specification must be treated as the final source of truth and this document should be updated accordingly.
