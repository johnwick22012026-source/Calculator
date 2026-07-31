/**
 * Format numeric result for display: limit precision, switch to exponential for extreme values,
 * and trim trailing zeros.
 */
export function formatResult(value: number): string {
  if (!isFinite(value)) return String(value)
  const abs = Math.abs(value)
  // Use exponential notation for very small or very large numbers
  if ((abs !== 0 && abs < 1e-6) || abs >= 1e12) {
    // 6 digits after decimal in exponential form
    return value.toExponential(6)
  }
  // For normal range, use up to 12 significant digits
  let str = value.toPrecision(12)
  // Remove trailing zeros and optional decimal point
  if (str.indexOf('.') >= 0) {
    str = str.replace(/\.?(?:0+)$/, '')
  }
  return str
}
