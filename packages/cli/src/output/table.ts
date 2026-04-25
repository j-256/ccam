import Table from 'cli-table3';
import chalk from 'chalk';

const MAX_CELL_LENGTH = 60;

export function formatTable(data: unknown, fields?: string[]): string {
  let items: unknown[];
  if (!Array.isArray(data)) {
    items = [data];
  } else {
    items = data;
  }

  if (items.length === 0) {
    return 'No results.';
  }

  // Determine columns
  const columns = fields || extractColumns(items);
  if (columns.length === 0) {
    return 'No results.';
  }

  // Create table with styled headers
  const table = new Table({
    head: columns.map((col) => chalk.gray(col)),
    style: {
      head: [],
      border: [],
    },
  });

  // Add data rows
  for (const item of items) {
    const row = columns.map((col) => {
      const value = getNestedValue(item, col);
      return formatCell(value);
    });
    table.push(row);
  }

  return table.toString();
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

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return chalk.dim('-');
  }

  let stringValue: string;

  if (Array.isArray(value)) {
    stringValue = value.join(', ');
  } else if (typeof value === 'object') {
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value);
  }

  // Apply color coding for known status values
  stringValue = colorizeStatus(stringValue);

  // Truncate long values
  if (stringValue.length > MAX_CELL_LENGTH) {
    return stringValue.slice(0, MAX_CELL_LENGTH - 3) + '...';
  }

  return stringValue;
}

function colorizeStatus(value: string): string {
  if (value === 'ENABLED' || value === 'true') {
    return chalk.green(value);
  }
  if (value === 'DELETED') {
    return chalk.red(value);
  }
  if (value === 'false') {
    return chalk.dim(value);
  }
  return value;
}
