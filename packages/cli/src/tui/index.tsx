import { render } from 'ink';
import { App } from './App.js';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';
import { handleError } from '../error-handler.js';

export async function startTui(): Promise<void> {
  let client;
  let host: string | undefined;
  try {
    const resolved = await resolveProfile({ flags: {} });
    client = await createClientFromResolved(resolved);
    host = resolved.host;
  } catch (err) {
    handleError(err);
  }

  process.stderr.write(
    'Starting interactive TUI. Press `q` to quit, or run `ccam --help` for the CLI.\n',
  );

  const { waitUntilExit } = render(
    <App client={client} host={host} />,
    { alternateScreen: true },
  );
  await waitUntilExit();
}
