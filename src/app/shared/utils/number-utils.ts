export function parseFormattedNumber(raw: string): number {
  if (raw == null) return 0;
  const cleaned = String(raw).replace(/[^0-9.]/g, '');
  if (cleaned === '') return 0;
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default { parseFormattedNumber };
