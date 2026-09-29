/**
 * Central event-expiry rules. Mirrors backend/src/common/utils/event-expiry.ts
 * so the UI and the registration API always agree on when an event is over.
 */

type ExpirableEvent = {
  eventDate?: string | Date | null;
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
 * Returns the moment registration closes:
 *  - endTime when set,
 *  - otherwise startTime,
 *  - otherwise the END of eventDate's day (eventDate alone is usually midnight,
 *    so closing at midnight would lock the event on its own day).
 */
export function getEventExpiryTime(event: ExpirableEvent): number | null {
  const end = toTime(event.endTime);
  if (end !== null) return end;

  const start = toTime(event.startTime);
  if (start !== null) return start;

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
