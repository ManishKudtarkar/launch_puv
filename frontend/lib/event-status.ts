/**
 * Central event-expiry rules. Mirrors backend/src/common/utils/event-expiry.ts
 * so the UI and the registration API always agree on when an event is over.
 */

type ExpirableEvent = {
  eventDate?: string | Date | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  status?: string | null;
};

// Statuses that mean the event is finished / no longer open, regardless of date.
const CLOSED_STATUSES = new Set(["COMPLETED", "REJECTED", "PAST", "EXPIRED", "CANCELLED"]);

const toTime = (value: string | Date | null | undefined): number | null => {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
};

/**
 * Returns the moment registration closes (= the event is considered over):
 *
 * Priority order:
 *  1. End of the `endDate` calendar day (23:59:59.999) — covers multi-day events
 *     correctly so registration stays open until the last day has fully passed.
 *  2. `endTime` field (legacy / single-day events that only set a time).
 *  3. `startTime` — if no end is defined at all.
 *  4. End of `eventDate`'s day (23:59:59.999) as final fallback.
 */
export function getEventExpiryTime(event: ExpirableEvent): number | null {
  // 1. endDate — use end of that calendar day so a multi-day event is open
  //    for the full last day, not just until endTime on day 1.
  const endDateRaw = event.endDate ?? event.startDate;
  if (endDateRaw) {
    const d = new Date(endDateRaw);
    if (!Number.isNaN(d.getTime())) {
      // Snap to the date-only portion (strip time component) then set to EOD.
      const eod = new Date(d.toISOString().slice(0, 10) + "T23:59:59.999");
      return eod.getTime();
    }
  }

  // 2. Explicit endTime (single-day events that set a time field).
  const end = toTime(event.endTime);
  if (end !== null) return end;

  // 3. startTime only — nothing better available.
  const start = toTime(event.startTime);
  if (start !== null) return start;

  // 4. eventDate — end of that calendar day.
  const day = toTime(event.eventDate);
  if (day === null) return null;
  const endOfDay = new Date(day);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime();
}

export function isEventExpired(event: ExpirableEvent | null | undefined, now: number = Date.now()): boolean {
  if (!event) return false;
  if (event.status && CLOSED_STATUSES.has(event.status.toUpperCase())) return true;

  const expiry = getEventExpiryTime(event);
  return expiry !== null && now > expiry;
}
