import { Command } from 'commander';
import { addGlobalOptions, resolveGlobalOptions, type GlobalOptions } from '../shared.js';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';
import { handleError } from '../error-handler.js';
import { renderOutput, resolveFormat } from '../output/index.js';
import { DEFAULT_COLUMNS } from '../output/default-columns.js';

interface InstanceFilters {
  org?: string;
  realm?: string;
  ids?: string;
}

type InstanceFinder = 'list' | 'findByOrganization' | 'findByRealm' | 'findById';

export function selectInstanceFinder(filters: InstanceFilters): InstanceFinder {
  if (filters.org) {
    return 'findByOrganization';
  }

  if (filters.realm) {
    return 'findByRealm';
  }

  if (filters.ids) {
    return 'findById';
  }

  return 'list';
}

interface InstanceListOptions extends GlobalOptions {
  org?: string;
  realm?: string;
  ids?: string;
}

async function listInstances(options: InstanceListOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const filters: InstanceFilters = {
      org: options.org,
      realm: options.realm,
      ids: options.ids,
    };

    const finder = selectInstanceFinder(filters);

    let result;
    switch (finder) {
      case 'list':
        result = await client.instances.list({
          page: resolved.page,
          size: resolved.size,
          sort: resolved.sort,
        });
        break;

      case 'findByOrganization':
        result = await client.instances.search.findByOrganization({
          organization: filters.org!,
          page: resolved.page,
          size: resolved.size,
        });
        break;

      case 'findByRealm':
        result = await client.instances.search.findByRealm({
          realm: filters.realm!,
          page: resolved.page,
          size: resolved.size,
        });
        break;

      case 'findById':
        result = await client.instances.search.findById({
          id: filters.ids!,
          page: resolved.page,
          size: resolved.size,
        });
        break;
    }

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    const data = result && typeof result === 'object' && 'content' in result ? result.content : result;
    renderOutput(data, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.instance });

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

async function getInstance(id: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.instances.get(id);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.instance });
  } catch (err) {
    handleError(err);
  }
}

async function validateFilter(options: GlobalOptions & { filter: string }): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    await client.instances.validateFilter(options.filter);
    process.stderr.write(`Filter "${options.filter}" is valid\n`);
  } catch (err) {
    handleError(err);
  }
}

export function registerInstanceCommands(program: Command): void {
  const instance = program
    .command('instance')
    .description('Manage instances');

  // instance list
  const list = instance
    .command('list')
    .description('List instances with optional filters');

  addGlobalOptions(list)
    .option('--org <id>', 'Filter instances by organization ID')
    .option('--realm <ids>', 'Filter instances by realm (comma-separated realm IDs)')
    .option('--ids <ids>', 'Filter instances by ID (comma-separated instance IDs)')
    .action(listInstances);

  // instance get
  const get = instance
    .command('get')
    .argument('<id>', 'Instance ID (REALM_TYPE format, e.g. "aabc_prd")')
    .description('Get a specific instance');

  addGlobalOptions(get).action(getInstance);

  // instance validate-filter
  const validate = instance
    .command('validate-filter')
    .description('Validate a tenant filter string');

  addGlobalOptions(validate)
    .requiredOption('--filter <filter>', 'Tenant filter string (e.g. "aalm_prd")')
    .action(validateFilter);
}
