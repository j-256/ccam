import { Command } from 'commander';
import { addGlobalOptions, resolveGlobalOptions, type GlobalOptions } from '../shared.js';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';
import { handleError } from '../error-handler.js';
import { renderOutput, resolveFormat } from '../output/index.js';
import { DEFAULT_COLUMNS } from '../output/default-columns.js';

async function getServiceType(id: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.serviceTypes.get(id);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.serviceType });
  } catch (err) {
    handleError(err);
  }
}

async function listServiceTypes(options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.serviceTypes.list({
      page: resolved.page,
      size: resolved.size,
    });

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.serviceType });

    // Write pagination info to stderr for table format
    if (format === 'table' && result && typeof result === 'object' && 'page' in result) {
      const page = result as { page: { number: number; size: number; totalElements: number; totalPages: number } };
      process.stderr.write(
        `Page ${page.page.number + 1} of ${page.page.totalPages} (${page.page.totalElements} total)\n`
      );
    }
  } catch (err) {
    handleError(err);
  }
}

export function registerServiceTypeCommands(program: Command): void {
  const serviceType = program
    .command('service-type')
    .description('Manage service types');

  // service-type list
  const list = serviceType
    .command('list')
    .description('List service types');

  addGlobalOptions(list).action(listServiceTypes);

  // service-type get
  const get = serviceType
    .command('get')
    .argument('<id>', 'Service type ID (e.g. "ECOM", "CDN")')
    .description('Get a specific service type');

  addGlobalOptions(get).action(getServiceType);
}
