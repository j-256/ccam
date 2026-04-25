import Table from 'cli-table3';
import chalk from 'chalk';
import { extractColumns, getNestedValue } from './shared.js';

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

  // Truncate long values before colorizing so ANSI escapes aren't split.
  if (stringValue.length > MAX_CELL_LENGTH) {
    stringValue = stringValue.slice(0, MAX_CELL_LENGTH - 3) + '...';
  }

  // Apply color coding for known status values after truncation.
  return colorizeStatus(stringValue);
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
