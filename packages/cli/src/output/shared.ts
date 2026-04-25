/**
 * Shared utilities for output formatters.
 */

/** Collect the union of top-level keys across a list of objects. */
export function extractColumns(data: unknown[]): string[] {
  const columns = new Set<string>();
  for (const item of data) {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach((key) => columns.add(key));
    }
  }
  return Array.from(columns);
}

/** Return the top-level property of an object by key. */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (typeof obj !== 'object' || obj === null) return undefined;
  return (obj as Record<string, unknown>)[path];
}

/**
 * Apply a field allowlist to a single object or an array of objects.
 * Used by JSON/YAML formatters where the goal is to drop un-requested fields.
 */
export function applyFieldSelection(data: unknown, fields: string[]): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => pickFields(item, fields));
  }
  return pickFields(data, fields);
}

function pickFields(obj: unknown, fields: string[]): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in obj) {
      result[field] = (obj as Record<string, unknown>)[field];
    }
  }
  return result;
}
