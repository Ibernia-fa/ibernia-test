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
