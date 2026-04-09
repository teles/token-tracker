export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatRatio(value: number): string {
  return value.toFixed(2);
}

export function formatMaybePercent(value: number): string {
  if (value <= 0) {
    return 'N/A';
  }

  return formatPercent(value);
}
