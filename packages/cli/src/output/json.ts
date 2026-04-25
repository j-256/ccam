import { applyFieldSelection } from './shared.js';

export function formatJson(data: unknown, fields?: string[]): string {
  if (!fields) {
    return JSON.stringify(data, null, 2);
  }

  // Apply field selection
  const filtered = applyFieldSelection(data, fields);
  return JSON.stringify(filtered, null, 2);
}
