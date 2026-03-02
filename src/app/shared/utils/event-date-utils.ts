export function isEventValue(val: any): boolean {
  return typeof val === 'string' && val.startsWith('event:');
}

export function extractEventId(val: any): string | null {
  return isEventValue(val) ? val.substring(6) : null;
}

export function resolveYear(val: any, eventsList: any[]): number {
  if (isEventValue(val)) {
    const eventId = val.substring(6);
    const event = eventsList.find((e: any) => e.id === eventId);
    return event?.start?.year ?? 0;
  }
  return typeof val === 'number' ? val : 0;
}
