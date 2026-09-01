import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ProfileStore } from '../../auth/profile-store.js';
import {
  runAuthLoginClient,
  runAuthLoginPassword,
  runAuthLoginBrowser,
  runAuthLogout,
  runAuthList,
  runAuthShow,
  runAuthUse,
  runAuthRename,
} from '../../commands/auth.js';

let tempDir: string;
let originalXdg: string | undefined;

beforeEach(async () => {
  originalXdg = process.env.XDG_CONFIG_HOME;
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccam-cmd-'));
  process.env.XDG_CONFIG_HOME = tempDir;
});

afterEach(async () => {
  if (originalXdg === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = originalXdg;
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('ccam auth login --client', () => {
  it('writes a new profile after a successful token mint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'at', expires_in: 1800 }),
    });
    await runAuthLoginClient({
      profile: 'svc',
      host: 'https://am.example',
      clientId: 'cid',
      clientSecret: 'sec',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const content = await fs.readFile(path.join(tempDir, 'ccam', 'profiles.yaml'), 'utf8');
    expect(content).toContain('clientId: cid');
    expect(content).toContain('svc:');
  });

  it('does not write when the token mint fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 401, text: async () => 'nope',
    });
    await expect(runAuthLoginClient({
      profile: 'svc',
      host: 'https://am.example',
      clientId: 'cid',
      clientSecret: 'sec',
      fetch: fetchMock as unknown as typeof fetch,
    })).rejects.toThrow(/401/);
    await expect(fs.access(path.join(tempDir, 'ccam', 'profiles.yaml'))).rejects.toThrow();
  });

  it('ignores env vars when saving the profile (values come from args only)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'at', expires_in: 1800 }),
    });
    const originalEnv = { ...process.env };
    process.env.CCAM_CLIENT_ID = 'env-cid';
    process.env.CCAM_CLIENT_SECRET = 'env-sec';
    process.env.CCAM_HOST = 'https://env.example';
    try {
      await runAuthLoginClient({
        profile: 'svc',
        host: 'https://arg.example',
        clientId: 'arg-cid',
        clientSecret: 'arg-sec',
        fetch: fetchMock as unknown as typeof fetch,
      });
      const profiles = await fs.readFile(path.join(tempDir, 'ccam', 'profiles.yaml'), 'utf8');
      expect(profiles).toContain('host: https://arg.example');
      expect(profiles).toContain('clientId: arg-cid');
      expect(profiles).not.toContain('env-cid');
      expect(profiles).not.toContain('env.example');
    } finally {
      process.env = originalEnv;
    }
  });

  it('marks the profile active when no profile was active before', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'at', expires_in: 1800 }),
    });
    await runAuthLoginClient({
      profile: 'first',
      host: 'https://am.example',
      clientId: 'cid',
      clientSecret: 'sec',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const state = await new ProfileStore().read();
    expect(state.activeProfile).toBe('first');
  });

  it('does not switch the active profile when one is already set', async () => {
    const store = new ProfileStore();
    await store.saveProfile('existing', { config: { host: 'h', clientId: 'c' }, credentials: {} });
    await store.setActiveProfile('existing');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'at', expires_in: 1800 }),
    });
    await runAuthLoginClient({
      profile: 'second',
      host: 'https://am.example',
      clientId: 'cid',
      clientSecret: 'sec',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const state = await store.read();
    expect(state.activeProfile).toBe('existing');
  });
});

describe('ccam auth login --password', () => {
  it('mints a token via ROPC and persists user context', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'at', refresh_token: 'rt', expires_in: 1800 }),
    });
    await runAuthLoginPassword({
      profile: 'mine',
      host: 'https://am.example',
      clientId: 'cid',
      clientSecret: 'sec',
      user: 'alice@example.com',
      password: 'pw',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const creds = await fs.readFile(path.join(tempDir, 'ccam', 'credentials'), 'utf8');
    expect(creds).toContain('refreshToken: rt');
    const profiles = await fs.readFile(path.join(tempDir, 'ccam', 'profiles.yaml'), 'utf8');
    expect(profiles).toContain('userEmail: alice@example.com');
    const call = fetchMock.mock.calls[0];
    expect(call[1].body).toContain('grant_type=password');
    expect(call[1].body).toContain('username=alice%40example.com');
  });

  it('does not write when the token mint fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 401, text: async () => 'bad creds',
    });
    await expect(runAuthLoginPassword({
      profile: 'mine',
      host: 'https://am.example',
      clientId: 'cid',
      clientSecret: 'sec',
      user: 'alice@example.com',
      password: 'wrong',
      fetch: fetchMock as unknown as typeof fetch,
    })).rejects.toThrow(/401/);
    await expect(fs.access(path.join(tempDir, 'ccam', 'profiles.yaml'))).rejects.toThrow();
  });
});

describe('ccam auth login (browser)', () => {
  it('completes the auth code flow and persists the refresh token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'at', refresh_token: 'rt', expires_in: 1800 }),
    });
    const loopback = vi.fn().mockResolvedValue({ code: 'the-code' });
    await runAuthLoginBrowser({
      profile: 'me',
      host: 'https://am.example',
      clientId: 'cid',
      redirectPort: 65535,
      fetch: fetchMock as unknown as typeof fetch,
      openBrowser: () => {},
      loopbackRunner: loopback as unknown as typeof import('../../auth/browser-login.js').runLoopbackLogin,
    });
    const creds = await fs.readFile(path.join(tempDir, 'ccam', 'credentials'), 'utf8');
    expect(creds).toContain('refreshToken: rt');
    const call = fetchMock.mock.calls[0];
    expect(call[1].body).toContain('grant_type=authorization_code');
    expect(call[1].body).toContain('code=the-code');
    expect(call[1].body).toContain('code_verifier=');
  });

  it('does not write a profile when code exchange fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 400, text: async () => '{"error":"invalid_grant"}',
    });
    const loopback = vi.fn().mockResolvedValue({ code: 'bad-code' });
    await expect(runAuthLoginBrowser({
      profile: 'me',
      host: 'https://am.example',
      clientId: 'cid',
      redirectPort: 65535,
      fetch: fetchMock as unknown as typeof fetch,
      openBrowser: () => {},
      loopbackRunner: loopback as unknown as typeof import('../../auth/browser-login.js').runLoopbackLogin,
    })).rejects.toThrow(/invalid_grant/);
    await expect(fs.access(path.join(tempDir, 'ccam', 'credentials'))).rejects.toThrow();
  });
});

describe('ccam auth logout', () => {
  it('removes the profile from both files', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'at', expires_in: 1800 }),
    });
    await runAuthLoginClient({
      profile: 'tmp', host: 'https://am.example',
      clientId: 'cid', clientSecret: 'sec',
      fetch: fetchMock as unknown as typeof fetch,
    });
    await runAuthLogout({ profile: 'tmp' });
    const profiles = await fs.readFile(path.join(tempDir, 'ccam', 'profiles.yaml'), 'utf8');
    expect(profiles).not.toContain('tmp:');
  });

  it('throws a clear error when the profile does not exist', async () => {
    await expect(runAuthLogout({ profile: 'nope' })).rejects.toThrow(/not found/i);
  });
});

describe('ccam auth list', () => {
  it('returns all profiles with the default one marked', async () => {
    const store = new ProfileStore();
    await store.saveProfile('a', { config: { host: 'h', clientId: 'ca' }, credentials: {} });
    await store.saveProfile('b', { config: { host: 'h', clientId: 'cb' }, credentials: {} });
    await store.setActiveProfile('b');
    const result = await runAuthList();
    expect(result.profiles.map((p) => p.name).sort()).toEqual(['a', 'b']);
    expect(result.activeProfile).toBe('b');
    expect(result.profiles.find((p) => p.name === 'b')?.state).toBe('ok');
  });

  it('returns empty when no profiles exist', async () => {
    const result = await runAuthList();
    expect(result.profiles).toEqual([]);
    expect(result.activeProfile).toBeUndefined();
  });
});

describe('ccam auth show', () => {
  it('returns the non-secret fields for a profile', async () => {
    const store = new ProfileStore();
    await store.saveProfile('x', {
      config: { host: 'https://am.example', clientId: 'cid', userEmail: 'alice@example.com' },
      credentials: { refreshToken: 'sensitive' },
    });
    const result = await runAuthShow({ name: 'x' });
    expect(result.host).toBe('https://am.example');
    expect(result.clientId).toBe('cid');
    expect(result.userEmail).toBe('alice@example.com');
    expect((result as Record<string, unknown>).refreshToken).toBeUndefined();
  });

  it('throws when the profile does not exist', async () => {
    await expect(runAuthShow({ name: 'missing' })).rejects.toThrow(/not found/i);
  });

  it('throws a clear "incomplete" error for credentials-only profiles', async () => {
    const store = new ProfileStore();
    await store.updateCredentials('orphan', { refreshToken: 'sensitive' });
    await expect(runAuthShow({ name: 'orphan' })).rejects.toThrow(/incomplete.*auth login/i);
  });
});

describe('ccam auth use', () => {
  it('sets the active profile', async () => {
    const store = new ProfileStore();
    await store.saveProfile('a', { config: { host: 'h', clientId: 'c' }, credentials: {} });
    await runAuthUse({ name: 'a' });
    const state = await store.read();
    expect(state.activeProfile).toBe('a');
  });

  it('throws when profile does not exist', async () => {
    await expect(runAuthUse({ name: 'ghost' })).rejects.toThrow(/not found/i);
  });

  it('throws a clear "incomplete" error for credentials-only profiles', async () => {
    const store = new ProfileStore();
    await store.updateCredentials('orphan', { refreshToken: 'sensitive' });
    await expect(runAuthUse({ name: 'orphan' })).rejects.toThrow(/incomplete.*auth login/i);
  });
});

describe('ccam auth rename', () => {
  it('renames a profile', async () => {
    const store = new ProfileStore();
    await store.saveProfile('old', { config: { host: 'h', clientId: 'c' }, credentials: {} });
    await runAuthRename({ oldName: 'old', newName: 'new' });
    const state = await store.read();
    expect(state.profiles.old).toBeUndefined();
    expect(state.profiles.new).toBeDefined();
  });
});

describe('resolveBrowserClientSecret', () => {
  it('uses the provided --client-secret without prompting', async () => {
    const { resolveBrowserClientSecret } = await import('../../commands/auth.js');
    const prompt = vi.fn().mockResolvedValue('should-not-be-used');
    const result = await resolveBrowserClientSecret({ clientSecret: 'sec', isPublic: false, prompt });
    expect(result).toBe('sec');
    expect(prompt).not.toHaveBeenCalled();
  });

  it('returns undefined and skips the prompt when --public is set', async () => {
    const { resolveBrowserClientSecret } = await import('../../commands/auth.js');
    const prompt = vi.fn().mockResolvedValue('should-not-be-used');
    const result = await resolveBrowserClientSecret({ clientSecret: undefined, isPublic: true, prompt });
    expect(result).toBeUndefined();
    expect(prompt).not.toHaveBeenCalled();
  });

  it('prompts when neither secret nor --public is set', async () => {
    const { resolveBrowserClientSecret } = await import('../../commands/auth.js');
    const prompt = vi.fn().mockResolvedValue('entered-secret');
    const result = await resolveBrowserClientSecret({ clientSecret: undefined, isPublic: false, prompt });
    expect(result).toBe('entered-secret');
    expect(prompt).toHaveBeenCalled();
  });

  it('treats blank prompt input as public', async () => {
    const { resolveBrowserClientSecret } = await import('../../commands/auth.js');
    const prompt = vi.fn().mockResolvedValue('');
    const result = await resolveBrowserClientSecret({ clientSecret: undefined, isPublic: false, prompt });
    expect(result).toBeUndefined();
  });
});

describe('rewriteBrowserLoginError', () => {
  it('rewrites invalid_client without a secret as a confidential-client hint', async () => {
    const { CcamOAuthError } = await import('ccam-sdk');
    const { rewriteBrowserLoginError } = await import('../../commands/auth.js');
    const original = new CcamOAuthError('boom', {
      status: 400, resource: 'auth', operation: 'authorization_code',
      rawBody: '{"error":"invalid_client"}',
    });
    const rewritten = rewriteBrowserLoginError(original, { hasSecret: false }) as Error;
    expect(rewritten).toBeInstanceOf(Error);
    expect(rewritten).not.toBe(original);
    expect(rewritten.message).toContain('confidential client');
  });

  it('passes through when a secret was provided', async () => {
    const { CcamOAuthError } = await import('ccam-sdk');
    const { rewriteBrowserLoginError } = await import('../../commands/auth.js');
    const original = new CcamOAuthError('boom', {
      status: 400, resource: 'auth', operation: 'authorization_code',
      rawBody: '{"error":"invalid_client"}',
    });
    expect(rewriteBrowserLoginError(original, { hasSecret: true })).toBe(original);
  });

  it('passes through other OAuth errors', async () => {
    const { CcamOAuthError } = await import('ccam-sdk');
    const { rewriteBrowserLoginError } = await import('../../commands/auth.js');
    const original = new CcamOAuthError('boom', {
      status: 400, resource: 'auth', operation: 'authorization_code',
      rawBody: '{"error":"invalid_grant"}',
    });
    expect(rewriteBrowserLoginError(original, { hasSecret: false })).toBe(original);
  });

  it('passes through non-oauth errors', async () => {
    const { rewriteBrowserLoginError } = await import('../../commands/auth.js');
    const original = new Error('network down');
    expect(rewriteBrowserLoginError(original, { hasSecret: false })).toBe(original);
  });
});

describe('auth command parsing (commander integration)', () => {
  it('passes --host through despite a matching root option', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'at', expires_in: 1800 }),
    });
    const originalFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      const { Command } = await import('commander');
      const { registerAuthCommands } = await import('../../commands/auth.js');
      const program = new Command()
        .name('ccam')
        .option('--host <h>')
        .option('--profile <p>', 'Auth profile name');
      registerAuthCommands(program);
      await program.parseAsync([
        'node', 'ccam', 'auth', 'login', '--client',
        '--host', 'https://pod5.example',
        '--client-id', 'cid',
        '--client-secret', 'sec',
        '-p', 'pod5',
      ]);
      const profiles = await fs.readFile(path.join(tempDir, 'ccam', 'profiles.yaml'), 'utf8');
      expect(profiles).toContain('host: https://pod5.example');
      expect(profiles).toContain('pod5:');
      const call = fetchMock.mock.calls[0];
      expect(call[0]).toContain('pod5.example');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('auth show with no arg targets the active profile (not the literal "default")', async () => {
    const store = new ProfileStore();
    await store.saveProfile('prod', { config: { host: 'https://prod', clientId: 'pc' }, credentials: {} });
    await store.setActiveProfile('prod');

    const { Command } = await import('commander');
    const { registerAuthCommands } = await import('../../commands/auth.js');
    const program = new Command()
      .name('ccam')
      .option('--host <h>')
      .option('--profile <p>', 'Auth profile name');
    registerAuthCommands(program);

    const chunks: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((s: string | Uint8Array) => { chunks.push(String(s)); return true; }) as typeof process.stdout.write;
    try {
      await program.parseAsync(['node', 'ccam', 'auth', 'show']);
    } finally {
      process.stdout.write = origWrite;
    }
    const output = chunks.join('');
    expect(output).toContain('name: prod');
    expect(output).toContain('host: https://prod');
  });

  it('auth show with no arg honors CCAM_PROFILE over activeProfile', async () => {
    const store = new ProfileStore();
    await store.saveProfile('a', { config: { host: 'https://a', clientId: 'ac' }, credentials: {} });
    await store.saveProfile('b', { config: { host: 'https://b', clientId: 'bc' }, credentials: {} });
    await store.setActiveProfile('a');
    const prev = process.env.CCAM_PROFILE;
    process.env.CCAM_PROFILE = 'b';
    try {
      const { Command } = await import('commander');
      const { registerAuthCommands } = await import('../../commands/auth.js');
      const program = new Command()
        .name('ccam')
        .option('--host <h>')
        .option('--profile <p>', 'Auth profile name');
      registerAuthCommands(program);

      const chunks: string[] = [];
      const origWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((s: string | Uint8Array) => { chunks.push(String(s)); return true; }) as typeof process.stdout.write;
      try {
        await program.parseAsync(['node', 'ccam', 'auth', 'show']);
      } finally {
        process.stdout.write = origWrite;
      }
      expect(chunks.join('')).toContain('name: b');
    } finally {
      if (prev === undefined) delete process.env.CCAM_PROFILE;
      else process.env.CCAM_PROFILE = prev;
    }
  });

  it('auth login --client honors CCAM_PROFILE when --profile is not passed', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'at', expires_in: 1800 }),
    });
    const originalFetch = global.fetch;
    const prev = process.env.CCAM_PROFILE;
    process.env.CCAM_PROFILE = 'from-env';
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      const { Command } = await import('commander');
      const { registerAuthCommands } = await import('../../commands/auth.js');
      const program = new Command()
        .name('ccam')
        .option('--host <h>')
        .option('--profile <p>', 'Auth profile name');
      registerAuthCommands(program);
      await program.parseAsync([
        'node', 'ccam', 'auth', 'login', '--client',
        '--host', 'https://am.example',
        '--client-id', 'cid',
        '--client-secret', 'sec',
      ]);
      const profiles = await fs.readFile(path.join(tempDir, 'ccam', 'profiles.yaml'), 'utf8');
      expect(profiles).toContain('from-env:');
      expect(profiles).not.toContain('default:');
    } finally {
      global.fetch = originalFetch;
      if (prev === undefined) delete process.env.CCAM_PROFILE;
      else process.env.CCAM_PROFILE = prev;
    }
  });
});
