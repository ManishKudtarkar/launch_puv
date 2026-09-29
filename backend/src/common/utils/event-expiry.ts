/**
 * Central event-expiry rules. Mirrors frontend/lib/event-status.ts so the API
 * and the UI always agree on when registration closes.
 */

type ExpirableEvent = {
  eventDate?: Date | string | null;
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

/** endTime → startTime → end of eventDate's day. */
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
