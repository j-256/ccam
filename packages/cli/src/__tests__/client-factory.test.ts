import { describe, it, expect } from 'vitest';
import { createClientFromResolved } from '../client-factory.js';

describe('createClientFromResolved', () => {
  it('returns a CcamClient wired with the resolved credentials', async () => {
    const client = await createClientFromResolved({
      host: 'https://am.example',
      clientId: 'cid',
      clientSecret: 'sec',
      source: 'env',
    });
    expect(client).toBeDefined();
  });

  it('throws when clientId is missing', async () => {
    await expect(createClientFromResolved({
      host: 'https://am.example',
      source: 'defaults',
    })).rejects.toThrow(/client id/i);
  });

  it('accepts a public-client profile with only clientId + cached token', async () => {
    const client = await createClientFromResolved({
      host: 'https://am.example',
      clientId: 'public-cid',
      cachedToken: { accessToken: 'at', refreshToken: 'rt', expiresAt: Date.now() + 60_000 },
      source: 'profile',
    });
    expect(client).toBeDefined();
  });

  it('throws when secretless and no cached token', async () => {
    await expect(createClientFromResolved({
      host: 'https://am.example',
      clientId: 'public-cid',
      source: 'profile',
    })).rejects.toThrow(/cached token/i);
  });
});
