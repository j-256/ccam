import { Command } from 'commander';
import { addGlobalOptions, resolveGlobalOptions, writePageInfoIfTable, type GlobalOptions } from '../shared.js';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';
import { handleError } from '../error-handler.js';
import { renderOutput, resolveFormat } from '../output/index.js';
import { DEFAULT_COLUMNS } from '../output/default-columns.js';

async function listRealms(options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.realms.list({
      page: resolved.page,
      size: resolved.size,
      sort: resolved.sort,
    });

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.realm });

    writePageInfoIfTable(format, result);
  } catch (err) {
    handleError(err);
  }
}

async function getRealm(id: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.realms.get(id);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.realm });
  } catch (err) {
    handleError(err);
  }
}

export function registerRealmCommands(program: Command): void {
  const realm = program
    .command('realm')
    .description('Manage realms');

  // realm list
  const list = realm
    .command('list')
    .description('List realms');

  addGlobalOptions(list).action(listRealms);

  // realm get
  const get = realm
    .command('get')
    .argument('<id>', 'Realm ID (4-character code)')
    .description('Get a specific realm');

  addGlobalOptions(get).action(getRealm);
}
