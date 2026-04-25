import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveCredentials } from '../../auth/credentials.js';

describe('resolveCredentials', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = { ...process.env };
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('CCAM_')) delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses explicit params when provided', () => {
    process.env.CCAM_CLIENT_ID = 'env-client';
    process.env.CCAM_CLIENT_SECRET = 'env-secret';

    const result = resolveCredentials({
      clientId: 'explicit-client',
      clientSecret: 'explicit-secret',
    });

    expect(result.clientId).toBe('explicit-client');
    expect(result.clientSecret).toBe('explicit-secret');
    expect(result.host).toBe('https://account.demandware.com');
  });

  it('falls back to env vars when explicit params not provided', () => {
    process.env.CCAM_CLIENT_ID = 'env-client';
    process.env.CCAM_CLIENT_SECRET = 'env-secret';

    const result = resolveCredentials({});

    expect(result.clientId).toBe('env-client');
    expect(result.clientSecret).toBe('env-secret');
  });

  it('resolves user credentials from env', () => {
    process.env.CCAM_USER = 'test-user';
    process.env.CCAM_USER_PASSWORD = 'test-pass';

    const result = resolveCredentials({
      clientId: 'client',
      clientSecret: 'secret',
    });

    expect(result.user).toBe('test-user');
    expect(result.userPassword).toBe('test-pass');
  });

  it('resolves host from env', () => {
    process.env.CCAM_HOST = 'https://custom.host.com';

    const result = resolveCredentials({
      clientId: 'client',
      clientSecret: 'secret',
    });

    expect(result.host).toBe('https://custom.host.com');
  });

  it('explicit params override env vars', () => {
    process.env.CCAM_CLIENT_ID = 'env-client';
    process.env.CCAM_CLIENT_SECRET = 'env-secret';
    process.env.CCAM_HOST = 'https://env.host.com';

    const result = resolveCredentials({
      clientId: 'explicit-client',
      clientSecret: 'explicit-secret',
      host: 'https://explicit.host.com',
    });

    expect(result.clientId).toBe('explicit-client');
    expect(result.clientSecret).toBe('explicit-secret');
    expect(result.host).toBe('https://explicit.host.com');
  });

  it('throws when no credentials available', () => {
    delete process.env.CCAM_CLIENT_ID;
    delete process.env.CCAM_CLIENT_SECRET;

    expect(() => resolveCredentials({})).toThrow('No client credentials found');
  });

  it('throws when only clientId provided', () => {
    expect(() => resolveCredentials({ clientId: 'client' })).toThrow('Both clientId and clientSecret must be provided');
  });

  it('throws when only clientSecret provided', () => {
    expect(() => resolveCredentials({ clientSecret: 'secret' })).toThrow('Both clientId and clientSecret must be provided');
  });
});
