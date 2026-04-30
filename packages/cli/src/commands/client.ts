import { Command } from 'commander';
import { addGlobalOptions, parseExpand, resolveGlobalOptions, writePageInfoIfTable, type GlobalOptions } from '../shared.js';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';
import { handleError } from '../error-handler.js';
import { renderOutput, resolveFormat } from '../output/index.js';
import { DEFAULT_COLUMNS } from '../output/default-columns.js';

const CLIENT_GET_EXPAND = ['organizations', 'roles', 'organizations,roles'] as const;

async function listClients(options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.apiClients.list({
      page: resolved.page,
      size: resolved.size,
      sort: resolved.sort,
    });

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.client });

    writePageInfoIfTable(format, result);
  } catch (err) {
    handleError(err);
  }
}

interface ClientGetOptions extends GlobalOptions {
  expand?: string;
}

async function getClient(id: string, options: ClientGetOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const expand = parseExpand(options.expand, CLIENT_GET_EXPAND);
    // Branch on the literal expand value so TypeScript can pick the right overload.
    let result;
    if (expand === 'organizations') {
      result = await client.apiClients.get(id, { expand });
    } else if (expand === 'roles') {
      result = await client.apiClients.get(id, { expand });
    } else if (expand === 'organizations,roles') {
      result = await client.apiClients.get(id, { expand });
    } else {
      result = await client.apiClients.get(id);
    }

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.clientDetail });
  } catch (err) {
    handleError(err);
  }
}

interface ClientAuditOptions extends GlobalOptions {
  querySize?: string;
}

async function auditClient(id: string, options: ClientAuditOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const querySize = options.querySize !== undefined ? parseInt(options.querySize, 10) : undefined;
    const result = await client.apiClients.auditLogs(id, querySize !== undefined ? { querySize } : undefined);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.auditLog });
  } catch (err) {
    handleError(err);
  }
}

async function clientAssignedRealms(id: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.apiClients.assignedRealms(id);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.realm });
  } catch (err) {
    handleError(err);
  }
}

async function clientAssignedInstances(id: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.apiClients.assignedInstances(id);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.instance });
  } catch (err) {
    handleError(err);
  }
}

async function createApiClient(
  options: GlobalOptions & {
    id: string;
    name: string;
    description?: string;
    organizations?: string;
    scopes?: string;
    redirectUrls?: string;
    tokenEndpointAuthMethod?: string;
  },
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const data: Record<string, unknown> = {
      id: options.id,
      name: options.name,
    };
    if (options.description !== undefined) data.description = options.description;
    if (options.organizations) data.organizations = options.organizations.split(',');
    if (options.scopes) data.scopes = options.scopes.split(',');
    if (options.redirectUrls) data.redirectUrls = options.redirectUrls.split(',');
    if (options.tokenEndpointAuthMethod) data.tokenEndpointAuthMethod = options.tokenEndpointAuthMethod;

    const result = await client.apiClients.create(
      data as unknown as Parameters<typeof client.apiClients.create>[0]
    );

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.clientDetail });
  } catch (err) {
    handleError(err);
  }
}

async function updateApiClient(
  id: string,
  options: GlobalOptions & {
    name?: string;
    description?: string;
    organizations?: string;
    scopes?: string;
    redirectUrls?: string;
    tokenEndpointAuthMethod?: string;
    active?: boolean;
    inactive?: boolean;
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
    if (options.description !== undefined) data.description = options.description;
    if (options.organizations) data.organizations = options.organizations.split(',');
    if (options.scopes) data.scopes = options.scopes.split(',');
    if (options.redirectUrls) data.redirectUrls = options.redirectUrls.split(',');
    if (options.tokenEndpointAuthMethod) data.tokenEndpointAuthMethod = options.tokenEndpointAuthMethod;
    if (options.active) data.active = true;
    if (options.inactive) data.active = false;

    const result = await client.apiClients.update(id, data);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.clientDetail });
  } catch (err) {
    handleError(err);
  }
}

async function deleteApiClient(
  id: string,
  options: GlobalOptions,
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    await client.apiClients.delete(id);
    process.stderr.write(`Deleted API client ${id}\n`);
  } catch (err) {
    handleError(err);
  }
}

async function setClientPassword(
  id: string,
  options: GlobalOptions & { password: string; oldPassword?: string },
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const data = options.oldPassword
      ? { new: options.password, old: options.oldPassword }
      : { new: options.password };
    await client.apiClients.setPassword(id, data);
    process.stderr.write(`Updated password for API client ${id}\n`);
  } catch (err) {
    handleError(err);
  }
}

async function setClientAuthType(
  id: string,
  options: GlobalOptions & { public?: boolean; confidential?: boolean },
): Promise<void> {
  try {
    if (!options.public && !options.confidential) {
      process.stderr.write('Error: specify --public or --confidential\n');
      process.exit(1);
    }

    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const isPublic = !!options.public;
    await client.apiClients.setAuthType(id, isPublic);
    process.stderr.write(`Set API client ${id} to ${isPublic ? 'public' : 'confidential'}\n`);
  } catch (err) {
    handleError(err);
  }
}

async function grantClientRole(
  id: string,
  roleId: string,
  options: GlobalOptions & { tenants?: string },
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const tenants = options.tenants
      ? options.tenants.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : undefined;
    const opts = tenants !== undefined ? { tenants } : undefined;

    const result = await client.apiClients.grantRole(id, roleId, opts);

    if (result.changed) {
      process.stderr.write(`Granted role ${roleId} to API client ${id}\n`);
    } else {
      process.stderr.write(`API client ${id} already has role ${roleId} (no changes)\n`);
    }

    if (result.roleScope !== 'GLOBAL' && (tenants === undefined || tenants.length === 0)) {
      process.stderr.write(
        `Warning: role ${roleId} has scope ${result.roleScope}; it will be inert until tenants are set\n`
      );
    }
  } catch (err) {
    handleError(err);
  }
}

async function revokeClientRole(
  id: string,
  roleId: string,
  options: GlobalOptions,
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.apiClients.revokeRole(id, roleId);

    if (result.changed) {
      process.stderr.write(`Revoked role ${roleId} from API client ${id}\n`);
    } else {
      process.stderr.write(`API client ${id} does not have role ${roleId} (no changes)\n`);
    }
  } catch (err) {
    handleError(err);
  }
}

export function registerClientCommands(program: Command): void {
  const apiClient = program
    .command('client')
    .description('Manage API clients');

  // client list
  const list = apiClient
    .command('list')
    .description('List API clients');

  addGlobalOptions(list).action(listClients);

  // client get
  const get = apiClient
    .command('get')
    .argument('<id>', 'API client ID')
    .description('Get a specific API client');

  addGlobalOptions(get)
    .option('--expand <fields>', 'Expand related resources (organizations, roles, organizations,roles)')
    .action(getClient);

  // client audit
  const audit = apiClient
    .command('audit')
    .argument('<id>', 'API client ID')
    .description('Get audit log for an API client');

  addGlobalOptions(audit)
    .option('--query-size <n>', 'Limit audit log query window size')
    .action(auditClient);

  // client assigned-realms
  const assignedRealms = apiClient
    .command('assigned-realms')
    .argument('<id>', 'API client ID')
    .description('List realms assigned to an API client via role-tenant filter');

  addGlobalOptions(assignedRealms).action(clientAssignedRealms);

  // client assigned-instances
  const assignedInstances = apiClient
    .command('assigned-instances')
    .argument('<id>', 'API client ID')
    .description('List instances assigned to an API client via role-tenant filter');

  addGlobalOptions(assignedInstances).action(clientAssignedInstances);

  // client create
  const create = apiClient
    .command('create')
    .description('Create a new API client');

  addGlobalOptions(create)
    .requiredOption('--id <id>', 'Client ID')
    .requiredOption('--name <name>', 'Client name')
    .option('--description <desc>', 'Description')
    .option('--organizations <orgs>', 'Comma-separated organization IDs')
    .option('--scopes <scopes>', 'Comma-separated OAuth scopes')
    .option('--redirect-urls <urls>', 'Comma-separated redirect URIs')
    .option('--token-endpoint-auth-method <method>', 'Auth method (private_key_jwt, client_secret_post, client_secret_basic, none)')
    .action(createApiClient);

  // client update
  const update = apiClient
    .command('update')
    .argument('<id>', 'API client ID')
    .description('Update an API client');

  addGlobalOptions(update)
    .option('--name <name>', 'Client name')
    .option('--description <desc>', 'Description')
    .option('--organizations <orgs>', 'Comma-separated organization IDs')
    .option('--scopes <scopes>', 'Comma-separated OAuth scopes')
    .option('--redirect-urls <urls>', 'Comma-separated redirect URIs')
    .option('--token-endpoint-auth-method <method>', 'Auth method')
    .option('--active', 'Set client as active')
    .option('--inactive', 'Set client as inactive')
    .action(updateApiClient);

  // client delete
  const del = apiClient
    .command('delete')
    .argument('<id>', 'API client ID')
    .description('Delete an API client (requires the client to have been disabled for 7+ days)');

  addGlobalOptions(del).action(deleteApiClient);

  // client set-password
  const setPassword = apiClient
    .command('set-password')
    .argument('<id>', 'API client ID')
    .description('Change an API client secret');

  addGlobalOptions(setPassword)
    .requiredOption('--password <secret>', 'New client secret')
    .option('--old-password <secret>', 'Current client secret (required when the client already has a password)')
    .action(setClientPassword);

  // client set-auth-type
  const setAuthType = apiClient
    .command('set-auth-type')
    .argument('<id>', 'API client ID')
    .description('Switch API client between public and confidential');

  addGlobalOptions(setAuthType)
    .option('--public', 'Set as public client')
    .option('--confidential', 'Set as confidential client')
    .action(setClientAuthType);

  // client grant-role
  const grantRole = apiClient
    .command('grant-role')
    .argument('<id>', 'API client ID')
    .argument('<role-id>', 'Role ID to grant (e.g. "ccdx-sbx-user")')
    .description('Grant a role to an API client (idempotent; read-modify-write on the client resource)');

  addGlobalOptions(grantRole)
    .option('--tenants <csv>', 'Comma-separated tenants for scoped roles; union-merged into roleTenantFilter')
    .action(grantClientRole);

  // client revoke-role
  const revokeRole = apiClient
    .command('revoke-role')
    .argument('<id>', 'API client ID')
    .argument('<role-id>', 'Role ID to revoke')
    .description('Revoke a role from an API client (idempotent; server auto-strips any tenant-filter entry)');

  addGlobalOptions(revokeRole).action(revokeClientRole);
}
