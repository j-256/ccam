import type { SortOption } from '../types/index.js';

/**
 * Format a SortOption into the API's "field,direction" string.
 */
export function formatSort(sort?: SortOption<string>): string | undefined {
  if (!sort) return undefined;
  return `${sort.field},${sort.direction}`;
}
