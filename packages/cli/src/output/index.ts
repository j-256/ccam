export type { OutputFormat } from './types.js';
export { resolveFormat } from './detect.js';
export { formatJson } from './json.js';
export { formatCsv, formatTsv } from './csv.js';
export { formatYaml } from './yaml-fmt.js';
export { formatTable } from './table.js';
export { DEFAULT_COLUMNS } from './default-columns.js';

import type { OutputFormat } from './types.js';
import { formatJson } from './json.js';
import { formatCsv, formatTsv } from './csv.js';
import { formatYaml } from './yaml-fmt.js';
import { formatTable } from './table.js';

export interface RenderOptions {
  format: OutputFormat;
  fields?: string[];
  defaultFields?: string[];
}

export function renderOutput(data: unknown, options: RenderOptions): void {
  let output: string;

  switch (options.format) {
    case 'json':
      output = formatJson(data, options.fields);
      break;
    case 'csv':
      output = formatCsv(data, options.fields);
      break;
    case 'tsv':
      output = formatTsv(data, options.fields);
      break;
    case 'yaml':
      output = formatYaml(data, options.fields);
      break;
    case 'table':
      output = formatTable(data, options.fields ?? options.defaultFields);
      break;
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }

  process.stdout.write(output + '\n');
}
