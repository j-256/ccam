export function formatCsv(data: unknown, fields?: string[]): string {
  return formatDelimited(data, ',', fields, true);
}

export function formatTsv(data: unknown, fields?: string[]): string {
  return formatDelimited(data, '\t', fields, false);
}

function formatDelimited(
  data: unknown,
  delimiter: string,
  fields?: string[],
  quote: boolean = false
): string {
  let items: unknown[];
  if (!Array.isArray(data)) {
    items = [data];
  } else {
    items = data;
  }

  if (items.length === 0) {
    return '';
  }

  // Determine columns
  const columns = fields || extractColumns(items);
  if (columns.length === 0) {
    return '';
  }

  // Build header row
  const header = columns.map((col) => (quote ? escapeCsv(col) : col)).join(delimiter);

  // Build data rows
  const rows = items.map((item) => {
    return columns
      .map((col) => {
        const value = getNestedValue(item, col);
        const stringValue = formatValue(value);
        return quote ? escapeCsv(stringValue) : stringValue;
      })
      .join(delimiter);
  });

  return [header, ...rows].join('\n');
}

function extractColumns(data: unknown[]): string[] {
  const columns = new Set<string>();
  for (const item of data) {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach((key) => columns.add(key));
    }
  }
  return Array.from(columns);
}

function getNestedValue(obj: unknown, path: string): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  return (obj as Record<string, unknown>)[path];
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.join(';');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function escapeCsv(value: string): string {
  // Quote if contains comma, double quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
