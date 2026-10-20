/**
 * Central event-expiry rules. Mirrors frontend/lib/event-status.ts so the API
 * and the UI always agree on when registration closes.
 */

type ExpirableEvent = {
  eventDate?: Date | string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  status?: string | null;
};

const CLOSED_STATUSES = new Set([
  'COMPLETED',
  'REJECTED',
  'PAST',
  'EXPIRED',
  'CANCELLED',
]);

const toTime = (value: Date | string | null | undefined): number | null => {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
};

/**
 * Returns the moment registration closes (= event is considered over).
 *
 * Priority order:
 *  1. End of the `endDate` calendar day (23:59:59.999) — multi-day events stay
 *     open until midnight of the last day, not just until endTime on day 1.
 *  2. `endTime`  — explicit close time for single-day events.
 *  3. `startTime` — fallback when no end is defined.
 *  4. End of `eventDate` day — final fallback.
 */
export function getEventExpiryTime(event: ExpirableEvent): number | null {
  // 1. endDate — use end of that calendar day so multi-day events stay open
  //    for the full last calendar day.
  const endDateRaw = event.endDate ?? event.startDate;
  if (endDateRaw) {
    const d = new Date(endDateRaw);
    if (!Number.isNaN(d.getTime())) {
      // Strip the time component and set to 23:59:59.999 of that date.
      const eod = new Date(
        new Date(d).toISOString().slice(0, 10) + 'T23:59:59.999',
      );
      return eod.getTime();
    }
  }

  // 2. Explicit endTime (single-day / legacy events).
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

export function isEventExpired(
  event: ExpirableEvent | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!event) return false;
  if (event.status && CLOSED_STATUSES.has(event.status.toUpperCase())) {
    return true;
  }
  const expiry = getEventExpiryTime(event);
  return expiry !== null && now > expiry;
}
