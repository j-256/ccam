import { render } from 'ink';
import { App } from './App.js';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';

export async function startTui(options: { host?: string; profile?: string }): Promise<void> {
  let client;
  try {
    const resolved = await resolveProfile({
      flags: { profile: options.profile, host: options.host },
    });
    client = await createClientFromResolved(resolved);
  } catch (err) {
    console.error(`Auth error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const { waitUntilExit } = render(
    <App client={client} host={options.host} />,
    { alternateScreen: true },
  );
  await waitUntilExit();
}
