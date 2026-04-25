// packages/cli/src/__tests__/auth/profile-resolver.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { resolveProfile } from '../../auth/profile-resolver.js';
import { ProfileStore } from '../../auth/profile-store.js';

let tempDir: string;
let originalXdg: string | undefined;
const envKeys = ['CCAM_HOST', 'CCAM_CLIENT_ID', 'CCAM_CLIENT_SECRET', 'CCAM_USER', 'CCAM_USER_PASSWORD', 'CCAM_PROFILE'];
const originalEnv: Record<string, string | undefined> = {};

beforeEach(async () => {
  originalXdg = process.env.XDG_CONFIG_HOME;
  for (const k of envKeys) originalEnv[k] = process.env[k];
  for (const k of envKeys) delete process.env[k];
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccam-resolver-'));
  process.env.XDG_CONFIG_HOME = tempDir;
});

afterEach(async () => {
  if (originalXdg === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = originalXdg;
  for (const k of envKeys) {
    if (originalEnv[k] === undefined) delete process.env[k];
    else process.env[k] = originalEnv[k];
  }
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('resolveProfile', () => {
  it('returns default host with no profile and no env', async () => {
    const r = await resolveProfile({ flags: {} });
    expect(r.host).toBe('https://account.demandware.com');
    expect(r.source).toBe('defaults');
  });

  it('selects env vars over defaults', async () => {
    process.env.CCAM_HOST = 'https://env.example';
    process.env.CCAM_CLIENT_ID = 'env-cid';
    process.env.CCAM_CLIENT_SECRET = 'env-sec';
    const r = await resolveProfile({ flags: {} });
    expect(r.host).toBe('https://env.example');
    expect(r.clientId).toBe('env-cid');
    expect(r.clientSecret).toBe('env-sec');
  });

  it('selects profile values when no env or flags are set', async () => {
    const store = new ProfileStore();
    await store.saveProfile('default', {
      config: { host: 'https://profile.example', clientId: 'pcid' },
      credentials: { clientSecret: 'psec', accessToken: 'at', expiresAt: 1 },
    });
    await store.setActiveProfile('default');
    const r = await resolveProfile({ flags: {} });
    expect(r.host).toBe('https://profile.example');
    expect(r.clientId).toBe('pcid');
    expect(r.clientSecret).toBe('psec');
    expect(r.profileName).toBe('default');
    expect(r.cachedToken?.accessToken).toBe('at');
  });

  it('flags win over env, env wins over profile', async () => {
    const store = new ProfileStore();
    await store.saveProfile('default', {
      config: { host: 'https://profile', clientId: 'pcid' },
      credentials: { clientSecret: 'psec' },
    });
    await store.setActiveProfile('default');
    process.env.CCAM_HOST = 'https://env';
    const r = await resolveProfile({ flags: { host: 'https://flag' } });
    expect(r.host).toBe('https://flag');
  });

  it('drops cached access token when any credential-affecting override is present', async () => {
    const store = new ProfileStore();
    await store.saveProfile('default', {
      config: { host: 'https://profile', clientId: 'pcid' },
      credentials: { clientSecret: 'psec', accessToken: 'cached', expiresAt: Date.now() + 60_000 },
    });
    await store.setActiveProfile('default');
    const r = await resolveProfile({ flags: { clientId: 'override-cid', clientSecret: 'override-sec' } });
    expect(r.cachedToken).toBeUndefined();
  });

  it('drops cached access token when --user overrides the principal', async () => {
    const store = new ProfileStore();
    await store.saveProfile('default', {
      config: { host: 'https://profile', clientId: 'pcid', userEmail: 'alice@example.com' },
      credentials: { clientSecret: 'psec', accessToken: 'cached-alice', expiresAt: Date.now() + 60_000 },
    });
    await store.setActiveProfile('default');
    const r = await resolveProfile({ flags: { user: 'bob@example.com' } });
    expect(r.cachedToken).toBeUndefined();
    expect(r.source).toBe('flags');
  });

  it('drops cached access token when CCAM_USER overrides the principal', async () => {
    const store = new ProfileStore();
    await store.saveProfile('default', {
      config: { host: 'https://profile', clientId: 'pcid' },
      credentials: { clientSecret: 'psec', accessToken: 'cached', expiresAt: Date.now() + 60_000 },
    });
    await store.setActiveProfile('default');
    process.env.CCAM_USER = 'carol@example.com';
    const r = await resolveProfile({ flags: {} });
    expect(r.cachedToken).toBeUndefined();
    expect(r.source).toBe('env');
  });

  it('honors --profile flag over env CCAM_PROFILE over activeProfile pointer', async () => {
    const store = new ProfileStore();
    await store.saveProfile('a', { config: { host: 'https://a', clientId: 'ac' }, credentials: {} });
    await store.saveProfile('b', { config: { host: 'https://b', clientId: 'bc' }, credentials: {} });
    await store.saveProfile('c', { config: { host: 'https://c', clientId: 'cc' }, credentials: {} });
    await store.setActiveProfile('a');
    process.env.CCAM_PROFILE = 'b';
    const r = await resolveProfile({ flags: { profile: 'c' } });
    expect(r.profileName).toBe('c');
    expect(r.host).toBe('https://c');
  });
});
