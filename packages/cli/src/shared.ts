import { Command } from 'commander';
import type { OutputFormat } from './output/index.js';

export interface GlobalOptions {
  format?: string;
  fields?: string;
  page?: string;
  size?: string;
  sort?: string;
  profile?: string;
  host?: string;
  json?: boolean;
}

export interface ParsedSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ResolvedGlobalOptions {
  format?: OutputFormat;
  fields?: string[];
  page?: number;
  size?: number;
  sort?: ParsedSort;
  profile?: string;
  host?: string;
}

export function parseFields(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  return value.split(',').map((field) => field.trim()).filter((field) => field.length > 0);
}

export function parseSort(value: string | undefined): ParsedSort | undefined {
  if (!value) return undefined;
  const [field, direction = 'asc'] = value.split(':');
  if (!field) {
    throw new Error(`Invalid sort field: empty. Use "field:asc" or "field:desc"`);
  }
  if (direction !== 'asc' && direction !== 'desc') {
    throw new Error(`Invalid sort direction: "${direction}". Use "asc" or "desc"`);
  }
  return { field, direction };
}

export function parsePageSize(value: string | undefined, defaultValue?: number): number | undefined {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid number: ${value}`);
  }
  return parsed;
}

/**
 * Parse and validate a user-provided --expand flag against an allowed set.
 * Throws with a clear message on unknown values, so the user gets a CLI error
 * instead of the AM server silently ignoring the parameter.
 *
 * @param input - raw --expand value (e.g. 'organizations')
 * @param allowed - array of allowed expand tokens for this endpoint
 * @returns the validated expand value, or undefined if input was undefined
 */
export function parseExpand<T extends string>(
  input: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (input === undefined) return undefined;
  if (!(allowed as readonly string[]).includes(input)) {
    throw new Error(
      `Invalid --expand value: "${input}". Allowed: ${allowed.join(', ')}`,
    );
  }
  return input as T;
}

export function addGlobalOptions(cmd: Command): Command {
  return cmd
    .option('--format <format>', 'Output format: table, json, csv, tsv, yaml')
    .option('--fields <fields>', 'Comma-separated list of fields to include')
    .option('--page <page>', 'Page number for pagination', '0')
    .option('--size <size>', 'Page size for pagination', '25')
    .option('--sort <sort>', 'Sort field and direction (e.g., name:asc)')
    .option('--profile <profile>', 'Profile name from config')
    .option('--host <host>', 'API host URL (default: https://account.demandware.com)')
    .option('-j, --json', 'Shorthand for --format json');
}

/**
 * Write "Page X of Y (N total)" to stderr if the format is 'table' and the
 * result has page metadata. No-op otherwise.
 */
export function writePageInfoIfTable(format: string, result: unknown): void {
  if (format !== 'table') return;
  if (!result || typeof result !== 'object') return;
  if (!('page' in result)) return;
  const page = (result as { page: { number: number; totalPages: number; totalElements: number; size: number } }).page;
  process.stderr.write(
    `Page ${page.number + 1} of ${page.totalPages} (${page.totalElements} total)\n`,
  );
}

export function resolveGlobalOptions(opts: GlobalOptions): ResolvedGlobalOptions {
  const resolved: ResolvedGlobalOptions = {
    profile: opts.profile,
  };

  // -j flag overrides format
  if (opts.json) {
    resolved.format = 'json';
  } else if (opts.format) {
    resolved.format = opts.format as OutputFormat;
  }

  // Parse fields
  if (opts.fields) {
    resolved.fields = parseFields(opts.fields);
  }

  // Parse page and size
  resolved.page = parsePageSize(opts.page, 0);
  resolved.size = parsePageSize(opts.size, 25);

  // Parse sort
  if (opts.sort) {
    resolved.sort = parseSort(opts.sort);
  }
  if (opts.host) {
    resolved.host = opts.host;
  }

  return resolved;
}
