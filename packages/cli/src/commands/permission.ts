import { Command } from 'commander';
import { addGlobalOptions, resolveGlobalOptions, writePageInfoIfTable, type GlobalOptions } from '../shared.js';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';
import { handleError } from '../error-handler.js';
import { renderOutput, resolveFormat } from '../output/index.js';
import { DEFAULT_COLUMNS } from '../output/default-columns.js';

async function getPermission(name: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.permissions.get(name);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.permission });
  } catch (err) {
    handleError(err);
  }
}

interface PermissionListOptions extends GlobalOptions {
  admin?: boolean;
}

async function listPermissions(options: PermissionListOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.permissions.list({
      page: resolved.page,
      size: resolved.size,
      ...(options.admin !== undefined ? { adminPermission: options.admin } : {}),
    });

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.permission });

    writePageInfoIfTable(format, result);
  } catch (err) {
    handleError(err);
  }
}

export function registerPermissionCommands(program: Command): void {
  const permission = program
    .command('permission')
    .description('Manage permissions');

  // permission list
  const list = permission
    .command('list')
    .description('List permissions');

  addGlobalOptions(list)
    .option('--admin', 'Filter to admin permissions only')
    .action(listPermissions);

  // permission get
  const get = permission
    .command('get')
    .argument('<name>', 'Permission name (e.g. "READ_USER", "WRITE_ORGANIZATION")')
    .description('Get a specific permission');

  addGlobalOptions(get).action(getPermission);
}
