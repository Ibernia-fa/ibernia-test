import { Details } from 'src/app/clients/models/client';

/** First name only for ownership labels and short UI copy. */
export function formatClientPersonDisplayName(
  details: Details | null | undefined,
): string {
  if (!details) return '';
  return (details.firstName ?? '').trim();
}
