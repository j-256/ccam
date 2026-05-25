import { Command } from 'commander';
import { TokenManager, createPkcePair, buildAuthorizeUrl, generateState, exchangeAuthorizationCode, CcamOAuthError } from 'ccam-sdk';
import chalk from 'chalk';
import YAML from 'yaml';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';
import { promptText, promptPassword } from '../auth/prompt.js';
import { runLoopbackLogin, LoopbackPromise } from '../auth/browser-login.js';
import { extractCodeFromInput } from '../auth/manual-login.js';
import { handleError } from '../error-handler.js';
import { ProfileStore, ProfileSummary } from '../auth/profile-store.js';

export function registerAuthCommands(program: Command): void {
  const auth = program
    .command('auth')
    .description('Manage authentication profiles');

  auth
    .command('login')
    .description('Log in to a profile (browser-based by default)')
    .option('--profile <name>', 'Profile name')
    .option('--host <url>', 'AM host URL')
    .option('--client-id <id>', 'API client ID')
    .option('--client-secret <secret>', 'API client secret')
    .option('--redirect-port <port>', 'Loopback redirect port', '65535')
    .option('--manual', 'Skip loopback server; paste the redirect URL manually')
    .option('--public', 'Treat the API client as public (skip client-secret prompt for browser flow)')
    .option('--client', 'Non-interactive client_credentials login')
    .option('--password', 'Non-interactive ROPC login')
    .option('--user <email>', 'User email (for --password)')
    .option('--user-password <pw>', 'User password (for --password)')
    .action(async (_opts, command) => {
      try { await loginDispatch(command.optsWithGlobals()); } catch (err) { handleError(err); }
    });

  auth
    .command('logout')
    .description('Remove a profile (defaults to the active profile)')
    .option('--profile <name>', 'Profile name')
    .action(async (_opts, command) => {
      const opts = command.optsWithGlobals();
      try {
        const name = await resolveProfileNameOrActive(opts.profile);
        await runAuthLogout({ profile: name });
      } catch (err) { handleError(err); }
    });

  auth
    .command('list')
    .description('List all profiles')
    .action(async () => {
      try {
        const result = await runAuthList();
        printList(result);
      } catch (err) { handleError(err); }
    });

  auth
    .command('show [name]')
    .description("Show a profile's non-secret fields (defaults to the active profile)")
    .action(async (name, _opts, command) => {
      try {
        const profile = await resolveProfileNameOrActive(name ?? command.optsWithGlobals().profile);
        const shown = await runAuthShow({ name: profile });
        process.stdout.write(YAML.stringify(shown));
      } catch (err) { handleError(err); }
    });

  auth
    .command('use <name>')
    .description('Set the active profile')
    .action(async (name) => {
      try { await runAuthUse({ name }); } catch (err) { handleError(err); }
    });

  auth
    .command('rename <old> <new>')
    .description('Rename a profile')
    .action(async (oldName, newName) => {
      try { await runAuthRename({ oldName, newName }); } catch (err) { handleError(err); }
    });

  auth
    .command('status')
    .description('Show the currently effective auth')
    .action(async () => {
      try { await runAuthStatus(); } catch (err) { handleError(err); }
    });

  auth
    .command('token')
    .description('Print an access token (for piping)')
    .action(async () => {
      try { await runAuthToken(); } catch (err) { handleError(err); }
    });
}

async function loginDispatch(opts: Record<string, string | boolean | undefined>): Promise<void> {
  const profile = String(opts.profile ?? process.env.CCAM_PROFILE ?? 'default');
  const host = (opts.host as string) ?? (await promptText({ message: 'Host:', defaultValue: 'https://account.demandware.com' }));

  if (opts.client) {
    const clientId = (opts.clientId as string) ?? (await promptText({ message: 'Client ID:' }));
    const clientSecret = (opts.clientSecret as string) ?? (await promptPassword({ message: 'Client secret:' }));
    await runAuthLoginClient({ profile, host, clientId, clientSecret });
    process.stdout.write(chalk.green(`Logged in (profile: ${profile})\n`));
    return;
  }
  if (opts.password) {
    const clientId = (opts.clientId as string) ?? (await promptText({ message: 'Client ID:' }));
    const clientSecret = (opts.clientSecret as string) ?? (await promptPassword({ message: 'Client secret:' }));
    const user = (opts.user as string) ?? (await promptText({ message: 'User email:' }));
    const password = (opts.userPassword as string) ?? (await promptPassword({ message: 'Password:' }));
    await runAuthLoginPassword({ profile, host, clientId, clientSecret, user, password });
    process.stdout.write(chalk.green(`Logged in as ${user} (profile: ${profile})\n`));
    return;
  }
  // Browser flow (default)
  const clientId = (opts.clientId as string) ?? (await promptText({ message: 'Client ID:' }));
  const clientSecret = await resolveBrowserClientSecret({
    clientSecret: opts.clientSecret as string | undefined,
    isPublic: Boolean(opts.public),
    prompt: () => promptPassword({ message: 'Client secret (blank for public client):' }),
  });
  const redirectPort = parseInt(String(opts.redirectPort ?? '65535'), 10);
  const openBrowser = await loadOpenImpl(Boolean(opts.manual));
  const loopbackRunner = opts.manual ? manualRunner : undefined;
  try {
    await runAuthLoginBrowser({ profile, host, clientId, clientSecret, redirectPort, openBrowser, loopbackRunner });
  } catch (err) {
    throw rewriteBrowserLoginError(err, { hasSecret: Boolean(clientSecret) });
  }
  process.stdout.write(chalk.green(`Logged in (profile: ${profile})\n`));
}

export interface ResolveBrowserSecretOptions {
  clientSecret: string | undefined;
  isPublic: boolean;
  prompt: () => Promise<string>;
}

export async function resolveBrowserClientSecret(opts: ResolveBrowserSecretOptions): Promise<string | undefined> {
  if (opts.clientSecret) return opts.clientSecret;
  if (opts.isPublic) return undefined;
  const entered = await opts.prompt();
  return entered ? entered : undefined;
}

export function rewriteBrowserLoginError(err: unknown, ctx: { hasSecret: boolean }): unknown {
  if (err instanceof CcamOAuthError && err.oauthCode === 'invalid_client' && !ctx.hasSecret) {
    return new Error(
      'AM rejected the login as a confidential client. Rerun and provide the client secret (--client-secret, or enter it at the prompt). If the API client really is public, keep --public set.',
    );
  }
  return err;
}

async function setActiveIfNone(store: ProfileStore, profile: string): Promise<void> {
  const state = await store.read();
  if (!state.activeProfile) {
    await store.setActiveProfile(profile);
  }
}

async function resolveProfileNameOrActive(explicit: string | undefined): Promise<string> {
  if (explicit) return explicit;
  if (process.env.CCAM_PROFILE) return process.env.CCAM_PROFILE;
  const state = await new ProfileStore().read();
  if (state.activeProfile) return state.activeProfile;
  throw new Error('No profile specified and no active profile set. Pass --profile, set CCAM_PROFILE, or run `ccam auth use <name>`.');
}

async function loadOpenImpl(manual: boolean): Promise<(url: string) => void | Promise<void>> {
  if (manual) {
    return (url) => { process.stdout.write(`Open this URL:\n  ${url}\n`); };
  }
  const open = (await import('open')).default;
  return (url) => { void open(url); };
}

function manualRunner(input: Parameters<typeof runLoopbackLogin>[0]): LoopbackPromise {
  const getCode = async () => {
    process.stdout.write(`Open this URL in a browser:\n  ${input.authorizeUrl}\n`);
    const raw = await promptText({ message: 'Paste the redirect URL or code:' });
    return extractCodeFromInput(raw, input.expectedState);
  };
  const done = getCode().then(code => ({ code })) as LoopbackPromise;
  Object.assign(done, { port: Promise.resolve(input.port) });
  return done;
}

async function runAuthStatus(): Promise<void> {
  const resolved = await resolveProfile({ flags: {} });
  process.stdout.write(chalk.bold('Authentication Status:\n\n'));
  process.stdout.write(`Profile: ${resolved.profileName ?? chalk.dim('(none)')}\n`);
  process.stdout.write(`Source: ${resolved.source}\n`);
  process.stdout.write(`Host: ${resolved.host}\n`);
  process.stdout.write(`Client ID: ${resolved.clientId ? chalk.green(resolved.clientId) : chalk.red('(not set)')}\n`);
  if (resolved.user) process.stdout.write(`User: ${resolved.user}\n`);
  if (!resolved.clientId || !resolved.clientSecret) {
    process.stdout.write(chalk.red('\nStatus: Not authenticated\n'));
    return;
  }
  try {
    const client = await createClientFromResolved(resolved);
    await client.roles.list({ page: 0, size: 1 });
    process.stdout.write(chalk.green('\nStatus: Valid\n'));
  } catch {
    process.stdout.write(chalk.red('\nStatus: Invalid or expired\n'));
  }
}

async function runAuthToken(): Promise<void> {
  const resolved = await resolveProfile({ flags: {} });
  if (!resolved.clientId || !resolved.clientSecret) {
    throw new Error('No credentials resolved.');
  }
  const tm = new TokenManager({
    clientId: resolved.clientId,
    clientSecret: resolved.clientSecret,
    host: resolved.host,
    user: resolved.user,
    userPassword: resolved.userPassword,
    initialCache: resolved.cachedToken
      ? { accessToken: resolved.cachedToken.accessToken, refreshToken: resolved.cachedToken.refreshToken, expiresAt: resolved.cachedToken.expiresAt }
      : undefined,
  });
  const token = await tm.getToken();
  process.stdout.write(token + '\n');
}

function printList(result: AuthListResult): void {
  for (const p of result.profiles) {
    const marker = result.activeProfile === p.name ? '*' : ' ';
    const badge = p.state === 'ok' ? '' : chalk.yellow(` [${p.state}]`);
    process.stdout.write(`${marker} ${p.name}${badge}\n`);
  }
  if (!result.profiles.length) {
    process.stdout.write(chalk.dim('No profiles configured. Run `ccam auth login` to create one.\n'));
  }
}

export interface AuthLoginClientOptions {
  profile: string;
  host: string;
  clientId: string;
  clientSecret: string;
  fetch?: typeof fetch;
}

export async function runAuthLoginClient(opts: AuthLoginClientOptions): Promise<void> {
  let capturedExpiresAt: number | undefined;
  const tm = new TokenManager({
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
    host: opts.host,
    fetch: opts.fetch,
    onTokenRefresh: (cache) => {
      capturedExpiresAt = cache.expiresAt;
    },
  });
  const accessToken = await tm.getToken();
  const store = new ProfileStore();
  await store.saveProfile(opts.profile, {
    config: { host: opts.host, clientId: opts.clientId },
    credentials: {
      clientSecret: opts.clientSecret,
      accessToken,
      expiresAt: capturedExpiresAt,
    },
  });
  await setActiveIfNone(store, opts.profile);
}

export interface AuthLoginPasswordOptions {
  profile: string;
  host: string;
  clientId: string;
  clientSecret: string;
  user: string;
  password: string;
  fetch?: typeof fetch;
}

export async function runAuthLoginPassword(opts: AuthLoginPasswordOptions): Promise<void> {
  let capturedRefresh: string | undefined;
  let capturedExpiresAt: number | undefined;
  const tm = new TokenManager({
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
    user: opts.user,
    userPassword: opts.password,
    host: opts.host,
    fetch: opts.fetch,
    onTokenRefresh: (cache) => {
      capturedRefresh = cache.refreshToken;
      capturedExpiresAt = cache.expiresAt;
    },
  });
  const accessToken = await tm.getToken();
  const store = new ProfileStore();
  await store.saveProfile(opts.profile, {
    config: { host: opts.host, clientId: opts.clientId, userEmail: opts.user },
    credentials: {
      clientSecret: opts.clientSecret,
      userPassword: opts.password,
      refreshToken: capturedRefresh,
      accessToken,
      expiresAt: capturedExpiresAt,
    },
  });
  await setActiveIfNone(store, opts.profile);
}

export interface AuthLoginBrowserOptions {
  profile: string;
  host: string;
  clientId: string;
  clientSecret?: string;
  redirectPort: number;
  fetch?: typeof fetch;
  openBrowser: (url: string) => void | Promise<void>;
  loopbackRunner?: typeof runLoopbackLogin;
}

export async function runAuthLoginBrowser(opts: AuthLoginBrowserOptions): Promise<void> {
  const { verifier, challenge } = createPkcePair();
  const state = generateState();
  const redirectUri = `http://127.0.0.1:${opts.redirectPort}/callback`;
  const authorizeUrl = buildAuthorizeUrl({
    host: opts.host,
    clientId: opts.clientId,
    redirectUri,
    codeChallenge: challenge,
    state,
  });
  const runner = opts.loopbackRunner ?? runLoopbackLogin;
  const { code } = await runner({
    authorizeUrl,
    expectedState: state,
    port: opts.redirectPort,
    open: opts.openBrowser,
  });
  const result = await exchangeAuthorizationCode({
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
    host: opts.host,
    code,
    redirectUri,
    codeVerifier: verifier,
    fetch: opts.fetch,
  });
  const store = new ProfileStore();
  await store.saveProfile(opts.profile, {
    config: { host: opts.host, clientId: opts.clientId },
    credentials: {
      clientSecret: opts.clientSecret,
      refreshToken: result.refreshToken,
      accessToken: result.accessToken,
      expiresAt: Date.now() + (result.expiresIn - 60) * 1000,
    },
  });
  await setActiveIfNone(store, opts.profile);
}

export interface AuthLogoutOptions {
  profile: string;
}

export async function runAuthLogout(opts: AuthLogoutOptions): Promise<void> {
  const store = new ProfileStore();
  const state = await store.read();
  if (!state.profiles[opts.profile] && !state.credentials[opts.profile]) {
    throw new Error(`Profile '${opts.profile}' not found`);
  }
  await store.deleteProfile(opts.profile);
}

export interface AuthListResult {
  activeProfile?: string;
  profiles: ProfileSummary[];
}

export async function runAuthList(): Promise<AuthListResult> {
  const store = new ProfileStore();
  const state = await store.read();
  const profiles = await store.listProfiles();
  return { activeProfile: state.activeProfile, profiles };
}

export interface AuthShowOptions {
  name: string;
}

/**
 * Returns the non-secret fields for a profile: host, clientId, userEmail, name.
 *
 * Note: clientId and host are not secrets but are semi-sensitive (useful
 * recon for an attacker who has already obtained a secret elsewhere).
 * Treat the contents of `profiles.yaml` accordingly before checking it in.
 */
export async function runAuthShow(opts: AuthShowOptions): Promise<{
  host: string;
  clientId: string;
  userEmail?: string;
  name: string;
}> {
  const store = new ProfileStore();
  const state = await store.read();
  const profile = state.profiles[opts.name];
  if (!profile) {
    if (state.credentials[opts.name]) {
      throw new Error(`Profile '${opts.name}' is incomplete: credentials present but config is missing. Run \`ccam auth login --profile ${opts.name}\` to repair.`);
    }
    throw new Error(`Profile '${opts.name}' not found`);
  }
  return { ...profile, name: opts.name };
}

export interface AuthUseOptions {
  name: string;
}

export async function runAuthUse(opts: AuthUseOptions): Promise<void> {
  const store = new ProfileStore();
  await store.setActiveProfile(opts.name);
}

export interface AuthRenameOptions {
  oldName: string;
  newName: string;
}

export async function runAuthRename(opts: AuthRenameOptions): Promise<void> {
  const store = new ProfileStore();
  await store.renameProfile(opts.oldName, opts.newName);
}
