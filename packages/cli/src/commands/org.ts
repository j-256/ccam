import { Command } from 'commander';
import { CcamNotFoundError } from '@ccam/sdk';
import { addGlobalOptions, resolveGlobalOptions, type GlobalOptions } from '../shared.js';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';
import { handleError } from '../error-handler.js';
import { renderOutput, resolveFormat } from '../output/index.js';
import { DEFAULT_COLUMNS } from '../output/default-columns.js';

interface OrgFilters {
  name?: string;
  startsWith?: string;
  sfAccountId?: string;
}

type OrgFinder = 'list' | 'findByName' | 'findBySfAccountId';

export function selectOrgFinder(filters: OrgFilters): OrgFinder {
  if (filters.sfAccountId) {
    return 'findBySfAccountId';
  }

  if (filters.name || filters.startsWith) {
    return 'findByName';
  }

  return 'list';
}

async function resolveOrgId(client: { organizations: { get: (id: string) => Promise<{ id: string }>; search: { findByName: (opts: { term: string; page: number; size: number }) => Promise<{ content: { id: string }[] }> } } }, idOrName: string): Promise<string> {
  // Try direct get first (handles UUIDs and non-UUID IDs like "Demandware  Inc.")
  try {
    const org = await client.organizations.get(idOrName);
    return org.id;
  } catch (err) {
    if (!(err instanceof CcamNotFoundError)) throw err;
  }
  // Fall back to name search
  const searchResult = await client.organizations.search.findByName({
    term: idOrName,
    page: 0,
    size: 1,
  });
  if (!searchResult.content || searchResult.content.length === 0) {
    process.stderr.write(`Error: No organization found with ID or name "${idOrName}"\n`);
    process.exit(1);
  }
  return searchResult.content[0].id;
}

interface OrgListOptions extends GlobalOptions {
  name?: string;
  startsWith?: string;
  sfAccountId?: string;
  ignoreCase?: boolean;
}

interface OrgRealmsOptions extends GlobalOptions {
  expand?: string;
}

async function listOrgs(options: OrgListOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const filters: OrgFilters = {
      name: options.name,
      startsWith: options.startsWith,
      sfAccountId: options.sfAccountId,
    };

    const finder = selectOrgFinder(filters);

    let result;
    switch (finder) {
      case 'list':
        result = await client.organizations.list({
          page: resolved.page,
          size: resolved.size,
          sort: resolved.sort,
        });
        break;

      case 'findByName':
        result = await client.organizations.search.findByName({
          term: filters.name,
          startsWith: filters.startsWith,
          ignoreCase: options.ignoreCase,
          page: resolved.page,
          size: resolved.size,
        });
        break;

      case 'findBySfAccountId':
        result = await client.organizations.search.findBySfAccountId({
          sfAccountId: filters.sfAccountId!,
          page: resolved.page,
          size: resolved.size,
        });
        break;
    }

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.org });

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

async function getOrg(idOrName: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const orgId = await resolveOrgId(client, idOrName);
    const result = await client.organizations.get(orgId);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.orgDetail });
  } catch (err) {
    handleError(err);
  }
}

async function getOrgRealms(idOrName: string, options: OrgRealmsOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const orgId = await resolveOrgId(client, idOrName);
    const result = options.expand === 'instance'
      ? await client.organizations.realms(orgId, { expand: 'instance' })
      : await client.organizations.realms(orgId);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.realm });
  } catch (err) {
    handleError(err);
  }
}

async function getOrgInstances(idOrName: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const orgId = await resolveOrgId(client, idOrName);
    const result = await client.organizations.instances(orgId);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.instance });
  } catch (err) {
    handleError(err);
  }
}

interface OrgAuditOptions extends GlobalOptions {
  querySize?: string;
}

async function auditOrg(idOrName: string, options: OrgAuditOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const orgId = await resolveOrgId(client, idOrName);
    const querySize = options.querySize !== undefined ? parseInt(options.querySize, 10) : undefined;
    const result = await client.organizations.auditLogs(orgId, querySize !== undefined ? { querySize } : undefined);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.auditLog });

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

async function updateOrg(
  id: string,
  options: GlobalOptions & {
    name?: string;
    contactUsers?: string;
    emailDomains?: string;
    passwordMinEntropy?: string;
    type?: string;
  },
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const data: Record<string, unknown> = {};
    if (options.name !== undefined) data.name = options.name;
    if (options.contactUsers) data.contactUsers = options.contactUsers.split(',');
    if (options.emailDomains) data.emailDomains = options.emailDomains.split(',');
    if (options.passwordMinEntropy) data.passwordMinEntropy = parseInt(options.passwordMinEntropy, 10);
    if (options.type) data.type = options.type;

    const result = await client.organizations.update(id, data);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields });
  } catch (err) {
    handleError(err);
  }
}

export function registerOrgCommands(program: Command): void {
  const org = program
    .command('org')
    .description('Manage organizations');

  // org list
  const list = org
    .command('list')
    .description('List organizations with optional filters');

  addGlobalOptions(list)
    .option('--name <name>', 'Search organizations by name (exact match)')
    .option('--starts-with <prefix>', 'Search organizations by name prefix')
    .option('--sf-account-id <id>', 'Find organization by Salesforce Account ID')
    .option('--ignore-case', 'Case-insensitive name search (use with --name or --starts-with)')
    .action(listOrgs);

  // org get
  const get = org
    .command('get')
    .argument('<idOrName>', 'Organization ID (UUID) or name')
    .description('Get a specific organization');

  addGlobalOptions(get).action(getOrg);

  // org realms
  const realms = org
    .command('realms')
    .argument('<idOrName>', 'Organization ID (UUID) or name')
    .description('List realms belonging to an organization');

  addGlobalOptions(realms)
    .option('--expand <fields>', 'Expand related resources (instance)')
    .action(getOrgRealms);

  // org instances
  const instances = org
    .command('instances')
    .argument('<idOrName>', 'Organization ID (UUID) or name')
    .description('List instances belonging to an organization');

  addGlobalOptions(instances).action(getOrgInstances);

  // org audit
  const audit = org
    .command('audit')
    .argument('<idOrName>', 'Organization ID (UUID) or name')
    .description('Get audit log for an organization');

  addGlobalOptions(audit)
    .option('--query-size <n>', 'Limit audit log query window size')
    .action(auditOrg);

  // org update
  const update = org
    .command('update')
    .argument('<id>', 'Organization ID')
    .description('Update an organization');

  addGlobalOptions(update)
    .option('--name <name>', 'Organization name')
    .option('--contact-users <ids>', 'Comma-separated contact user IDs')
    .option('--email-domains <domains>', 'Comma-separated email domains')
    .option('--password-min-entropy <n>', 'Minimum password entropy')
    .option('--type <type>', 'Organization type')
    .action(updateOrg);
}
