import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ProfileStore } from '../../auth/profile-store.js';

let tempDir: string;
let originalXdg: string | undefined;

beforeEach(async () => {
  originalXdg = process.env.XDG_CONFIG_HOME;
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccam-test-'));
  process.env.XDG_CONFIG_HOME = tempDir;
});

afterEach(async () => {
  if (originalXdg === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = originalXdg;
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('ProfileStore.read', () => {
  it('returns empty state when no files exist', async () => {
    const store = new ProfileStore();
    const state = await store.read();
    expect(state.profiles).toEqual({});
    expect(state.credentials).toEqual({});
    expect(state.activeProfile).toBeUndefined();
  });

  it('reads a profiles.yaml with one profile', async () => {
    const dir = path.join(tempDir, 'ccam');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'profiles.yaml'),
      'activeProfile: default\nprofiles:\n  default:\n    host: https://am.example\n    clientId: cid\n    userEmail: alice@example.com\n');
    const state = await new ProfileStore().read();
    expect(state.activeProfile).toBe('default');
    expect(state.profiles.default).toEqual({
      host: 'https://am.example',
      clientId: 'cid',
      userEmail: 'alice@example.com',
    });
  });

  it('reads a credentials file', async () => {
    const dir = path.join(tempDir, 'ccam');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'credentials'),
      'default:\n  refreshToken: r1\n  accessToken: a1\n  expiresAt: 1700000000000\n');
    const state = await new ProfileStore().read();
    expect(state.credentials.default).toEqual({
      refreshToken: 'r1',
      accessToken: 'a1',
      expiresAt: 1700000000000,
    });
  });
});

describe('ProfileStore.saveProfile', () => {
  it('creates profiles.yaml and credentials with the new entry', async () => {
    const store = new ProfileStore();
    await store.saveProfile('default', {
      config: { host: 'https://am.example', clientId: 'cid', userEmail: 'a@b.com' },
      credentials: { refreshToken: 'r1', accessToken: 'a1', expiresAt: 1700000000000 },
    });
    const state = await store.read();
    expect(state.profiles.default.clientId).toBe('cid');
    expect(state.credentials.default.refreshToken).toBe('r1');
  });

  it('preserves existing profiles when saving another', async () => {
    const store = new ProfileStore();
    await store.saveProfile('a', {
      config: { host: 'https://am.example', clientId: 'cid-a' },
      credentials: { refreshToken: 'r-a' },
    });
    await store.saveProfile('b', {
      config: { host: 'https://am.example', clientId: 'cid-b' },
      credentials: { refreshToken: 'r-b' },
    });
    const state = await store.read();
    expect(Object.keys(state.profiles).sort()).toEqual(['a', 'b']);
    expect(state.credentials.a.refreshToken).toBe('r-a');
    expect(state.credentials.b.refreshToken).toBe('r-b');
  });

  it('writes credentials with mode 0600', async () => {
    const store = new ProfileStore();
    await store.saveProfile('default', {
      config: { host: 'https://am.example', clientId: 'cid' },
      credentials: { refreshToken: 'r1' },
    });
    const stat = await fs.stat(path.join(tempDir, 'ccam', 'credentials'));
    expect(stat.mode & 0o777).toBe(0o600);
  });

  it('creates the config dir with mode 0o700', async () => {
    const store = new ProfileStore();
    await store.saveProfile('default', {
      config: { host: 'https://am.example', clientId: 'cid' },
      credentials: { refreshToken: 'r1' },
    });
    const stat = await fs.stat(path.join(tempDir, 'ccam'));
    expect(stat.mode & 0o777).toBe(0o700);
  });

  it('chmods an existing config dir to 0o700', async () => {
    const configDir = path.join(tempDir, 'ccam');
    await fs.mkdir(configDir, { recursive: true, mode: 0o755 });
    await fs.chmod(configDir, 0o755);
    const store = new ProfileStore();
    await store.saveProfile('x', { config: { host: 'h', clientId: 'c' }, credentials: {} });
    const stat = await fs.stat(configDir);
    expect(stat.mode & 0o777).toBe(0o700);
  });
});

describe('ProfileStore.setActiveProfile', () => {
  it('persists the active profile name', async () => {
    const store = new ProfileStore();
    await store.saveProfile('x', { config: { host: 'h', clientId: 'c' }, credentials: {} });
    await store.setActiveProfile('x');
    const state = await store.read();
    expect(state.activeProfile).toBe('x');
  });

  it('throws when setting active to a profile that does not exist', async () => {
    const store = new ProfileStore();
    await expect(store.setActiveProfile('ghost')).rejects.toThrow(/not found/i);
  });
});

describe('ProfileStore.deleteProfile', () => {
  it('removes the profile from both files', async () => {
    const store = new ProfileStore();
    await store.saveProfile('x', { config: { host: 'h', clientId: 'c' }, credentials: { refreshToken: 'r' } });
    await store.deleteProfile('x');
    const state = await store.read();
    expect(state.profiles.x).toBeUndefined();
    expect(state.credentials.x).toBeUndefined();
  });

  it('clears activeProfile if it pointed at the deleted profile', async () => {
    const store = new ProfileStore();
    await store.saveProfile('x', { config: { host: 'h', clientId: 'c' }, credentials: { refreshToken: 'r' } });
    await store.setActiveProfile('x');
    await store.deleteProfile('x');
    const state = await store.read();
    expect(state.activeProfile).toBeUndefined();
  });
});

describe('ProfileStore.renameProfile', () => {
  it('moves profile and credentials under a new key', async () => {
    const store = new ProfileStore();
    await store.saveProfile('old', { config: { host: 'h', clientId: 'c' }, credentials: { refreshToken: 'r' } });
    await store.renameProfile('old', 'new');
    const state = await store.read();
    expect(state.profiles.old).toBeUndefined();
    expect(state.profiles.new.clientId).toBe('c');
    expect(state.credentials.new.refreshToken).toBe('r');
  });

  it('updates activeProfile if it matched the old name', async () => {
    const store = new ProfileStore();
    await store.saveProfile('old', { config: { host: 'h', clientId: 'c' }, credentials: {} });
    await store.setActiveProfile('old');
    await store.renameProfile('old', 'new');
    const state = await store.read();
    expect(state.activeProfile).toBe('new');
  });

  it('throws if the source profile does not exist', async () => {
    const store = new ProfileStore();
    await expect(store.renameProfile('missing', 'new')).rejects.toThrow(/not found/i);
  });

  it('throws if the destination profile already exists', async () => {
    const store = new ProfileStore();
    await store.saveProfile('a', { config: { host: 'h', clientId: 'c' }, credentials: {} });
    await store.saveProfile('b', { config: { host: 'h', clientId: 'c' }, credentials: {} });
    await expect(store.renameProfile('a', 'b')).rejects.toThrow(/already exists/i);
  });
});

describe('ProfileStore.updateCredentials', () => {
  it('patches only the specified credential fields', async () => {
    const store = new ProfileStore();
    await store.saveProfile('x', {
      config: { host: 'h', clientId: 'c' },
      credentials: { clientSecret: 'keep', refreshToken: 'old', accessToken: 'old-at', expiresAt: 1 },
    });
    await store.updateCredentials('x', { accessToken: 'new-at', expiresAt: 2 });
    const state = await store.read();
    expect(state.credentials.x).toEqual({
      clientSecret: 'keep',
      refreshToken: 'old',
      accessToken: 'new-at',
      expiresAt: 2,
    });
  });

  it('does not touch profiles.yaml', async () => {
    const store = new ProfileStore();
    await store.saveProfile('x', { config: { host: 'h', clientId: 'c' }, credentials: { refreshToken: 'r' } });
    await store.setActiveProfile('x');
    const profilesBefore = await fs.readFile(path.join(tempDir, 'ccam', 'profiles.yaml'), 'utf8');
    await store.updateCredentials('x', { accessToken: 'new-at' });
    const profilesAfter = await fs.readFile(path.join(tempDir, 'ccam', 'profiles.yaml'), 'utf8');
    expect(profilesAfter).toBe(profilesBefore);
  });

  it('creates the credentials entry when it did not exist', async () => {
    const store = new ProfileStore();
    await store.updateCredentials('x', { accessToken: 'a', expiresAt: 1 });
    const state = await store.read();
    expect(state.credentials.x).toEqual({ accessToken: 'a', expiresAt: 1 });
  });

  it('creates the config dir with mode 0o700 from scratch', async () => {
    const store = new ProfileStore();
    await store.updateCredentials('x', { accessToken: 'a', expiresAt: 1 });
    const stat = await fs.stat(path.join(tempDir, 'ccam'));
    expect(stat.mode & 0o777).toBe(0o700);
  });
});

describe('ProfileStore.listProfiles', () => {
  it('returns an empty list when nothing exists', async () => {
    expect(await new ProfileStore().listProfiles()).toEqual([]);
  });

  it('returns intact profiles with state "ok"', async () => {
    const store = new ProfileStore();
    await store.saveProfile('x', { config: { host: 'h', clientId: 'c' }, credentials: { refreshToken: 'r' } });
    const list = await store.listProfiles();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: 'x', state: 'ok' });
  });

  it('flags a profile as "missing-credentials" when credentials are absent', async () => {
    const dir = path.join(tempDir, 'ccam');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'profiles.yaml'),
      'profiles:\n  x:\n    host: h\n    clientId: c\n');
    const list = await new ProfileStore().listProfiles();
    expect(list[0]).toMatchObject({ name: 'x', state: 'missing-credentials' });
  });

  it('flags a profile as "missing-config" when config is absent', async () => {
    const dir = path.join(tempDir, 'ccam');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'credentials'), 'x:\n  refreshToken: r\n');
    const list = await new ProfileStore().listProfiles();
    expect(list[0]).toMatchObject({ name: 'x', state: 'missing-config' });
  });
});
