import { describe, it, expect, vi } from 'vitest';
import { TokenManager } from '../../auth/token.js';
import { CcamOAuthError, CcamRefreshFailedError } from '../../errors.js';

describe('TokenManager', () => {
  const baseConfig = {
    clientId: 'test-client',
    clientSecret: 'test-secret',
    host: 'https://account.demandware.com',
  };

  it('acquires token via client_credentials grant', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-token',
        expires_in: 3600,
      }),
    });

    const manager = new TokenManager({ ...baseConfig, fetch: mockFetch });
    const token = await manager.getToken();

    expect(token).toBe('new-token');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://account.demandware.com/dwsso/oauth2/access_token',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': expect.stringMatching(/^Basic /),
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
        body: 'grant_type=client_credentials',
      })
    );
  });

  it('reuses cached token if not expired', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'cached-token',
        expires_in: 3600,
      }),
    });

    const manager = new TokenManager({ ...baseConfig, fetch: mockFetch });
    const token1 = await manager.getToken();
    const token2 = await manager.getToken();

    expect(token1).toBe('cached-token');
    expect(token2).toBe('cached-token');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('refreshes token when expired', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'first-token',
          expires_in: 0,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'second-token',
          expires_in: 3600,
        }),
      });

    const manager = new TokenManager({ ...baseConfig, fetch: mockFetch });
    const token1 = await manager.getToken();
    const token2 = await manager.getToken();

    expect(token1).toBe('first-token');
    expect(token2).toBe('second-token');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('acquires token via password grant when user credentials provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'user-token',
        expires_in: 3600,
      }),
    });

    const manager = new TokenManager({
      ...baseConfig,
      user: 'test@example.com',
      userPassword: 'test-password',
      fetch: mockFetch,
    });
    const token = await manager.getToken();

    expect(token).toBe('user-token');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://account.demandware.com/dwsso/oauth2/access_token',
      expect.objectContaining({
        body: expect.stringContaining('grant_type=password'),
      })
    );

    const body = mockFetch.mock.calls[0][1].body;
    expect(body).toContain('username=test%40example.com');
    expect(body).toContain('password=test-password');
  });

  it('throws on acquisition failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Invalid credentials',
    });

    const manager = new TokenManager({ ...baseConfig, fetch: mockFetch });
    await expect(manager.getToken()).rejects.toThrow('Token acquisition failed');
  });

  it('throws CcamOAuthError on HTTP 200 with malformed body (acquireInitialToken)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ error: 'invalid_grant' }),
    });

    const manager = new TokenManager({ ...baseConfig, fetch: mockFetch });
    await expect(manager.getToken()).rejects.toThrow(CcamOAuthError);
    // Cache must remain unset so a retry doesn't read NaN expiresAt.
    const retryFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'recovered', expires_in: 1800 }),
    });
    const manager2 = new TokenManager({ ...baseConfig, fetch: retryFetch });
    await expect(manager2.getToken()).resolves.toBe('recovered');
  });

  it('invalidate forces token re-fetch', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'first-token',
          expires_in: 3600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'second-token',
          expires_in: 3600,
        }),
      });

    const manager = new TokenManager({ ...baseConfig, fetch: mockFetch });
    const token1 = await manager.getToken();
    expect(token1).toBe('first-token');

    manager.invalidate();

    const token2 = await manager.getToken();
    expect(token2).toBe('second-token');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('invokes onTokenRefresh on client_credentials acquisition', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'initial-access', expires_in: 1800 }),
    });
    const onRefresh = vi.fn();
    const manager = new TokenManager({
      ...baseConfig,
      fetch: mockFetch,
      onTokenRefresh: onRefresh,
    });
    await manager.getToken();
    expect(onRefresh).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'initial-access',
      expiresAt: expect.any(Number),
    }));
  });
});

describe('TokenManager with refresh token', () => {
  it('uses refresh_token grant when cache has refreshToken and access token is expired', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-access', refresh_token: 'rotated-refresh', expires_in: 1800 }),
    });
    const tm = new TokenManager({
      clientId: 'cid',
      clientSecret: 'sec',
      host: 'https://am.example',
      fetch: fetchMock as unknown as typeof fetch,
      initialCache: { accessToken: 'old', refreshToken: 'r1', expiresAt: 0 },
    });
    const token = await tm.getToken();
    expect(token).toBe('new-access');
    const call = fetchMock.mock.calls[0];
    expect(call[1].body).toContain('grant_type=refresh_token');
    expect(call[1].body).toContain('refresh_token=r1');
  });

  it('invokes onTokenRefresh with the new tokens after refresh', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-access', refresh_token: 'rotated', expires_in: 1800 }),
    });
    const onRefresh = vi.fn();
    const tm = new TokenManager({
      clientId: 'cid',
      clientSecret: 'sec',
      host: 'https://am.example',
      fetch: fetchMock as unknown as typeof fetch,
      initialCache: { accessToken: 'old', refreshToken: 'r1', expiresAt: 0 },
      onTokenRefresh: onRefresh,
    });
    await tm.getToken();
    expect(onRefresh).toHaveBeenCalledWith({
      accessToken: 'new-access',
      refreshToken: 'rotated',
      expiresAt: expect.any(Number),
    });
  });

  it('keeps the existing refresh token when the response omits refresh_token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-access', expires_in: 1800 }),
    });
    const onRefresh = vi.fn();
    const tm = new TokenManager({
      clientId: 'cid',
      clientSecret: 'sec',
      host: 'https://am.example',
      fetch: fetchMock as unknown as typeof fetch,
      initialCache: { accessToken: 'old', refreshToken: 'r1', expiresAt: 0 },
      onTokenRefresh: onRefresh,
    });
    await tm.getToken();
    expect(onRefresh).toHaveBeenCalledWith(expect.objectContaining({ refreshToken: 'r1' }));
  });

  it('throws CcamRefreshFailedError on 400/401 from refresh endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '{"error":"invalid_grant"}',
    });
    const tm = new TokenManager({
      clientId: 'cid',
      clientSecret: 'sec',
      host: 'https://am.example',
      fetch: fetchMock as unknown as typeof fetch,
      initialCache: { accessToken: 'old', refreshToken: 'r1', expiresAt: 0 },
      profileName: 'staging',
    });
    await expect(tm.getToken()).rejects.toThrow(CcamRefreshFailedError);
  });

  it('does not embed the raw response body in the refresh error message', async () => {
    const echoed = '{"error":"invalid_grant","refresh_token":"LEAK_ME","client_secret":"also-leak"}';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 400, text: async () => echoed,
    });
    const tm = new TokenManager({
      clientId: 'cid', clientSecret: 'sec', host: 'https://am.example',
      fetch: fetchMock as unknown as typeof fetch,
      initialCache: { accessToken: 'old', refreshToken: 'r1', expiresAt: 0 },
    });
    try {
      await tm.getToken();
      throw new Error('expected throw');
    } catch (err) {
      const e = err as Error & { rawBody: string };
      expect(e.message).not.toContain('LEAK_ME');
      expect(e.message).not.toContain('also-leak');
      expect(e.rawBody).toContain('LEAK_ME');
    }
  });

  it('returns cached access token without network when not expired', async () => {
    const fetchMock = vi.fn();
    const tm = new TokenManager({
      clientId: 'cid',
      clientSecret: 'sec',
      host: 'https://am.example',
      fetch: fetchMock as unknown as typeof fetch,
      initialCache: { accessToken: 'still-fresh', refreshToken: 'r1', expiresAt: Date.now() + 60_000 },
    });
    const token = await tm.getToken();
    expect(token).toBe('still-fresh');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws CcamOAuthError on HTTP 200 with malformed body (refreshAccessToken)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ error: 'invalid_grant' }),
    });
    const tm = new TokenManager({
      clientId: 'cid',
      clientSecret: 'sec',
      host: 'https://am.example',
      fetch: fetchMock as unknown as typeof fetch,
      initialCache: { accessToken: 'old', refreshToken: 'r1', expiresAt: 0 },
    });
    await expect(tm.getToken()).rejects.toThrow(CcamOAuthError);
  });
});

describe('TokenManager with public client (no secret)', () => {
  it('throws CcamRefreshFailedError when cache is expired and there is no refresh token', async () => {
    const fetchMock = vi.fn();
    const tm = new TokenManager({
      clientId: 'public-cid',
      host: 'https://am.example',
      fetch: fetchMock as unknown as typeof fetch,
      initialCache: { accessToken: 'stale', expiresAt: Date.now() - 1 },
    });
    await expect(tm.getToken()).rejects.toThrow(CcamRefreshFailedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws CcamRefreshFailedError when no cache at all (cannot mint via client_credentials)', async () => {
    const fetchMock = vi.fn();
    const tm = new TokenManager({
      clientId: 'public-cid',
      host: 'https://am.example',
      fetch: fetchMock as unknown as typeof fetch,
    });
    await expect(tm.getToken()).rejects.toThrow(/Run `ccam auth login`/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes without Basic auth and includes client_id in the body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-at', refresh_token: 'r2', expires_in: 1800 }),
    });
    const tm = new TokenManager({
      clientId: 'public-cid',
      host: 'https://am.example',
      fetch: fetchMock as unknown as typeof fetch,
      initialCache: { accessToken: 'stale', refreshToken: 'r1', expiresAt: Date.now() - 1 },
    });
    const token = await tm.getToken();
    expect(token).toBe('new-at');
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(init.body).toContain('client_id=public-cid');
    expect(init.body).toContain('grant_type=refresh_token');
  });
});
