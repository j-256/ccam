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

export function addGlobalOptions(cmd: Command): Command {
  return cmd
    .option('--format <format>', 'Output format: table, json, csv, tsv, yaml')
    .option('--fields <fields>', 'Comma-separated list of fields to include')
    .option('--page <page>', 'Page number for pagination', '0')
    .option('--size <size>', 'Page size for pagination', '25')
    .option('--sort <sort>', 'Sort field and direction (e.g., name:asc)')
    .option('--profile <profile>', 'Profile name from config')
    .option('--host <host>', 'API host URL override')
    .option('-j, --json', 'Shorthand for --format json');
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
