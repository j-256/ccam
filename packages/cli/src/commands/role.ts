import { Command } from 'commander';
import { addGlobalOptions, parseExpand, resolveGlobalOptions, writePageInfoIfTable, type GlobalOptions } from '../shared.js';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';
import { handleError } from '../error-handler.js';
import { renderOutput, resolveFormat } from '../output/index.js';
import { DEFAULT_COLUMNS } from '../output/default-columns.js';

const ROLE_EXPAND = ['serviceType'] as const;

interface RoleListOptions extends GlobalOptions {
  expand?: string;
  targetType?: string;
}

interface RoleGetOptions extends GlobalOptions {
  expand?: string;
}

async function listRoles(options: RoleListOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const baseOpts = {
      page: resolved.page,
      size: resolved.size,
      sort: resolved.sort,
    };

    const expand = parseExpand(options.expand, ROLE_EXPAND);
    let result;
    if (expand === 'serviceType') {
      result = await client.roles.list({
        ...baseOpts,
        expand,
        ...(options.targetType !== undefined ? { roleTargetType: options.targetType } : {}),
      });
    } else {
      result = await client.roles.list(baseOpts);
    }

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.role });

    writePageInfoIfTable(format, result);
  } catch (err) {
    handleError(err);
  }
}

async function getRole(id: string, options: RoleGetOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const expand = parseExpand(options.expand, ROLE_EXPAND);
    const result = expand ? await client.roles.get(id, { expand }) : await client.roles.get(id);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.roleDetail });
  } catch (err) {
    handleError(err);
  }
}

export function registerRoleCommands(program: Command): void {
  const role = program
    .command('role')
    .description('Manage roles');

  // role list
  const list = role
    .command('list')
    .description('List roles');

  addGlobalOptions(list)
    .option('--expand <fields>', 'Expand related resources (serviceType)')
    .option('--target-type <type>', 'Filter by role target type (User, ApiClient)')
    .action(listRoles);

  // role get
  const get = role
    .command('get')
    .argument('<id>', 'Role ID')
    .description('Get a specific role');

  addGlobalOptions(get)
    .option('--expand <fields>', 'Expand related resources (serviceType)')
    .action(getRole);
}
