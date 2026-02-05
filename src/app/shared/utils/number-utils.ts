export function parseFormattedNumber(raw: string): number {
  if (raw == null) return 0;

  let value = String(raw).trim();
  if (value === '') return 0;

  // keep digits and common separators only
  value = value.replace(/[^0-9.,]/g, '');
  if (value === '') return 0;

  const lastDot = value.lastIndexOf('.');
  const lastComma = value.lastIndexOf(',');

  let decimalSep: '.' | ',' | null = null;
  let thousandSep: '.' | ',' | null = null;

  if (lastDot !== -1 && lastComma !== -1) {
    // both present: last one is decimal separator
    decimalSep = lastDot > lastComma ? '.' : ',';
    thousandSep = decimalSep === '.' ? ',' : '.';
  } else if (lastDot !== -1) {
    const dotCount = (value.match(/\./g) ?? []).length;
    if (dotCount > 1) {
      thousandSep = '.';
    } else {
      const digitsAfter = value.length - lastDot - 1;
      // if exactly 3 digits after, treat as thousands grouping
      if (digitsAfter === 3 && value.length > 4) {
        thousandSep = '.';
      } else {
        decimalSep = '.';
      }
    }
  } else if (lastComma !== -1) {
    const commaCount = (value.match(/,/g) ?? []).length;
    if (commaCount > 1) {
      thousandSep = ',';
    } else {
      const digitsAfter = value.length - lastComma - 1;
      if (digitsAfter === 3 && value.length > 4) {
        thousandSep = ',';
      } else {
        decimalSep = ',';
      }
    }
  }

  let normalized = value;
  if (thousandSep) {
    const re = new RegExp(`\\${thousandSep}`, 'g');
    normalized = normalized.replace(re, '');
  }
  if (decimalSep && decimalSep !== '.') {
    const re = new RegExp(`\\${decimalSep}`, 'g');
    normalized = normalized.replace(re, '.');
  }

  if (normalized === '' || normalized === '.') return 0;
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default { parseFormattedNumber };
