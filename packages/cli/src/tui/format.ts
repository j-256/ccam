import chalk from 'chalk';

/**
 * Format a user state value with semantic color:
 * green for ENABLED, red for DELETED, yellow for INITIAL
 */
export function formatUserState(value: unknown): string {
  const s = String(value ?? '');
  switch (s) {
    case 'ENABLED':
      return chalk.green(s);
    case 'DELETED':
      return chalk.red(s);
    case 'INITIAL':
      return chalk.yellow(s);
    default:
      return s;
  }
}

/** Format a boolean value: green "Yes" / dim "No" */
export function formatBoolean(value: unknown): string {
  if (value === true || value === 'true') return chalk.green('Yes');
  return chalk.dim('No');
}

/**
 * Format a date value: if it looks like an ISO date string, truncate to
 * just the date portion (YYYY-MM-DD); otherwise return as-is
 */
export function formatDate(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  // Match ISO-8601 datetime strings (2026-04-14T12:00:00Z etc.)
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  return s;
}

/**
 * Format an array value by joining with ', '.
 * Truncation is handled by the Table component
 */
export function formatArray(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value == null) return '';
  return String(value);
}

/** Format a count: if the value is an array, return its length; otherwise stringify */
export function formatCount(value: unknown): string {
  if (Array.isArray(value)) return String(value.length);
  if (value == null) return '';
  return String(value);
}
