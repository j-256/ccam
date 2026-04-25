import type { OutputFormat } from './types.js';
export type { OutputFormat };

export function resolveFormat(explicit: string | undefined, isTTY: boolean): OutputFormat {
  if (explicit) return explicit as OutputFormat;
  return isTTY ? 'table' : 'json';
}
