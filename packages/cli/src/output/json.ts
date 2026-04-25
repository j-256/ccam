export function formatJson(data: unknown, fields?: string[]): string {
  if (!fields) {
    return JSON.stringify(data, null, 2);
  }

  // Apply field selection
  const filtered = applyFieldSelection(data, fields);
  return JSON.stringify(filtered, null, 2);
}

function applyFieldSelection(data: unknown, fields: string[]): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => pickFields(item, fields));
  }
  return pickFields(data, fields);
}

function pickFields(obj: unknown, fields: string[]): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in obj) {
      result[field] = (obj as Record<string, unknown>)[field];
    }
  }
  return result;
}
