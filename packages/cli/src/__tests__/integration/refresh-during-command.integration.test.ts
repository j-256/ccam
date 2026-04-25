import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ProfileStore } from '../../auth/profile-store.js';
import { resolveProfile } from '../../auth/profile-resolver.js';
import { createClientFromResolved } from '../../client-factory.js';

let tempDir: string;
let originalXdg: string | undefined;
let savedCcamEnv: Record<string, string | undefined>;

beforeEach(async () => {
  originalXdg = process.env.XDG_CONFIG_HOME;
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccam-refresh-'));
  process.env.XDG_CONFIG_HOME = tempDir;

  savedCcamEnv = {};
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('CCAM_')) {
      savedCcamEnv[key] = process.env[key];
      delete process.env[key];
    }
  }
});

afterEach(async () => {
  if (originalXdg === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = originalXdg;
  for (const [key, value] of Object.entries(savedCcamEnv)) {
    if (value !== undefined) process.env[key] = value;
  }
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('refresh during command', () => {
  it('refreshes the access token and persists the rotated refresh token', async () => {
    const store = new ProfileStore();
    await store.saveProfile('x', {
      config: { host: 'https://am.example', clientId: 'cid' },
      credentials: {
        clientSecret: 'sec',
        refreshToken: 'r1',
        accessToken: 'old',
        expiresAt: Date.now() - 1000,
      },
    });
    await store.setActiveProfile('x');

    const fetchMock = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const body = String(init.body);
      expect(body).toContain('grant_type=refresh_token');
      expect(body).toContain('refresh_token=r1');
      return {
        ok: true,
        json: async () => ({ access_token: 'new-at', refresh_token: 'r2', expires_in: 1800 }),
        text: async () => '',
      } as Response;
    });

    const resolved = await resolveProfile({ flags: {} });
    const client = await createClientFromResolved(resolved, { fetch: fetchMock as unknown as typeof fetch });

    const token = await client.getTokenManager().getToken();
    expect(token).toBe('new-at');

    const state = await store.read();
    expect(state.credentials.x.refreshToken).toBe('r2');
    expect(state.credentials.x.accessToken).toBe('new-at');
  });
});
