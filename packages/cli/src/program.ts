import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth.js';
import { registerUserCommands } from './commands/user.js';
import { registerOrgCommands } from './commands/org.js';
import { registerClientCommands } from './commands/client.js';
import { registerRoleCommands } from './commands/role.js';
import { registerRealmCommands } from './commands/realm.js';
import { registerPermissionCommands } from './commands/permission.js';
import { registerServiceTypeCommands } from './commands/service-type.js';
import { registerInstanceCommands } from './commands/instance.js';
import { registerOrgConfigCommands } from './commands/org-config.js';

export const program = new Command()
  .name('ccam')
  .description('CLI for the Salesforce Commerce Cloud Account Manager API')
  .version('0.1.0')
  .option('-i, --interactive', 'Launch interactive TUI')
  .action(async (options) => {
    if (options.interactive || process.stdout.isTTY) {
      const { startTui } = await import('./tui/index.js');
      await startTui();
    } else {
      program.help();
    }
  });

// Register all command groups
registerAuthCommands(program);
registerUserCommands(program);
registerOrgCommands(program);
registerClientCommands(program);
registerRoleCommands(program);
registerRealmCommands(program);
registerPermissionCommands(program);
registerServiceTypeCommands(program);
registerInstanceCommands(program);
registerOrgConfigCommands(program);
