import { Command } from 'commander';
import { addGlobalOptions, resolveGlobalOptions, type GlobalOptions } from '../shared.js';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';
import { handleError } from '../error-handler.js';
import { renderOutput, resolveFormat } from '../output/index.js';

async function getOrgConfig(options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const result = await client.organizationConfiguration.get();

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields });
  } catch (err) {
    handleError(err);
  }
}

export function registerOrgConfigCommands(program: Command): void {
  const orgConfig = program
    .command('org-config')
    .description('Manage organization configuration');

  // org-config get
  const get = orgConfig
    .command('get')
    .description('Get the current organization configuration');

  addGlobalOptions(get).action(getOrgConfig);
}
