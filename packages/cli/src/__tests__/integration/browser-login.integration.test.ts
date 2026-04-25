import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { runAuthLoginBrowser } from '../../commands/auth.js';

let tempDir: string;
let originalXdg: string | undefined;

beforeEach(async () => {
  originalXdg = process.env.XDG_CONFIG_HOME;
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccam-e2e-'));
  process.env.XDG_CONFIG_HOME = tempDir;
});

afterEach(async () => {
  if (originalXdg === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = originalXdg;
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('browser login end-to-end', () => {
  it('runs the full auth_code + PKCE flow and persists a usable profile', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/dwsso/oauth2/access_token')) {
        const body = String(init.body);
        expect(body).toContain('grant_type=authorization_code');
        expect(body).toContain('code_verifier=');
        return {
          ok: true,
          json: async () => ({ access_token: 'at', refresh_token: 'rt', expires_in: 1800 }),
        } as Response;
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    await runAuthLoginBrowser({
      profile: 'e2e',
      host: 'https://am.example',
      clientId: 'cid',
      redirectPort: 65535,
      fetch: fetchMock as unknown as typeof fetch,
      openBrowser: () => {},
      loopbackRunner: (async () => ({ code: 'simulated-code' })) as unknown as typeof import('../../auth/browser-login.js').runLoopbackLogin,
    });

    const profiles = await fs.readFile(path.join(tempDir, 'ccam', 'profiles.yaml'), 'utf8');
    expect(profiles).toContain('e2e:');
    const creds = await fs.readFile(path.join(tempDir, 'ccam', 'credentials'), 'utf8');
    expect(creds).toContain('refreshToken: rt');
  });
});
