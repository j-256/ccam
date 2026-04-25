import { stringify } from 'yaml';
import { applyFieldSelection } from './shared.js';

export function formatYaml(data: unknown, fields?: string[]): string {
  if (!fields) {
    return stringify(data);
  }

  // Apply field selection
  const filtered = applyFieldSelection(data, fields);
  return stringify(filtered);
}
