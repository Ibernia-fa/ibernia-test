export function isEventValue(val: any): boolean {
  return typeof val === 'string' && val.startsWith('event:');
}

export function extractEventId(val: any): string | null {
  return isEventValue(val) ? val.substring(6) : null;
}

export function resolveYear(val: any, eventsList: any[] | undefined | null): number {
  if (isEventValue(val)) {
    const eventId = val.substring(6);
    const event = (eventsList ?? []).find((e: any) => e.id === eventId);
    return event?.start?.year ?? 0;
  }
  if (typeof val === 'number' && Number.isFinite(val)) {
    return val;
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return 0;
}

/**
 * Calendar year for a goal/custom timeline event's **end** when it is tied to another
 * event via `endEventId` (e.g. end at "Retirement age Inam"). Uses the linked event's
 * current `start.year` so the bar/labels follow moves without relying on a stale copied `end.year`.
 */
export function resolveClientEventEndCalendarYear(
  event: {
    end?: { year?: number } | null;
    endEventId?: string | null;
  },
  clientEvents:
    | Array<{ id?: string | null; start?: { year?: number } | null }>
    | null
    | undefined,
): number | null {
  const evs = clientEvents ?? [];
  if (event.endEventId) {
    const linked = evs.find((e) => e.id === event.endEventId);
    const y = linked?.start?.year;
    if (y != null && Number.isFinite(Number(y)) && Number(y) > 0) {
      return Number(y);
    }
  }
  const ey = event.end?.year;
  if (ey != null && Number.isFinite(Number(ey)) && Number(ey) > 0) {
    return Number(ey);
  }
  return null;
}

/** Calendar year for lifetime-plan markers when income is tied to a timeline event (matches resolveYear semantics). */
export function resolveIncomeMarkerCalendarYear(
  income: {
    start?: { year?: number } | null;
    startEventId?: string | null;
    endEventId?: string | null;
  },
  clientEvents: Array<{ id?: string | null; start?: { year?: number } | null }> | null | undefined,
): number | null {
  const evs = clientEvents ?? [];
  if (income.startEventId) {
    const ev = evs.find((e) => e.id === income.startEventId);
    const y = ev?.start?.year;
    if (y != null && Number.isFinite(Number(y)) && Number(y) > 0) {
      return Number(y);
    }
  }
  if (income.endEventId) {
    const ev = evs.find((e) => e.id === income.endEventId);
    const y = ev?.start?.year;
    if (y != null && Number.isFinite(Number(y)) && Number(y) > 0) {
      return Number(y);
    }
  }
  const sy = income.start?.year;
  if (sy != null && Number.isFinite(Number(sy)) && Number(sy) > 0) {
    return Number(sy);
  }
  return null;
}
