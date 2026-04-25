import { describe, it, expect, vi } from 'vitest';
import { exchangeAuthorizationCode, buildAuthorizeUrl, generateState } from '../../auth/auth-code.js';

describe('exchangeAuthorizationCode', () => {
  it('POSTs to the token endpoint with the authorization_code grant', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'a', refresh_token: 'r', expires_in: 1800 }),
    });
    const result = await exchangeAuthorizationCode({
      clientId: 'cid',
      clientSecret: 'sec',
      host: 'https://am.example',
      code: 'the-code',
      redirectUri: 'http://127.0.0.1:65535/callback',
      codeVerifier: 'the-verifier',
      fetch: fetchMock as unknown as typeof fetch,
    });
    expect(result.accessToken).toBe('a');
    expect(result.refreshToken).toBe('r');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://am.example/dwsso/oauth2/access_token');
    expect(init.body).toContain('grant_type=authorization_code');
    expect(init.body).toContain('code=the-code');
    expect(init.body).toContain('code_verifier=the-verifier');
    expect(init.body).toContain('redirect_uri=http%3A%2F%2F127.0.0.1%3A65535%2Fcallback');
  });

  it('includes Basic auth when client secret is provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'a', expires_in: 1800 }),
    });
    await exchangeAuthorizationCode({
      clientId: 'cid', clientSecret: 'sec', host: 'https://am.example',
      code: 'c', redirectUri: 'http://x/cb', codeVerifier: 'v',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toMatch(/^Basic /);
  });

  it('omits Basic auth and includes client_id in body for public clients', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'a', expires_in: 1800 }),
    });
    await exchangeAuthorizationCode({
      clientId: 'cid', host: 'https://am.example',
      code: 'c', redirectUri: 'http://x/cb', codeVerifier: 'v',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.body).toContain('client_id=cid');
  });

  it('throws with the server error text on non-2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '{"error":"invalid_grant"}',
    });
    await expect(
      exchangeAuthorizationCode({
        clientId: 'cid', clientSecret: 'sec', host: 'https://am.example',
        code: 'bad', redirectUri: 'http://x/cb', codeVerifier: 'v',
        fetch: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/invalid_grant/);
  });

  it('throws a CcamOAuthError with parsed error/description fields', async () => {
    const { CcamOAuthError } = await import('../../errors.js');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '{"error":"invalid_client","error_description":"Parameter client_assertion_type is missing"}',
    });
    try {
      await exchangeAuthorizationCode({
        clientId: 'cid', host: 'https://am.example',
        code: 'c', redirectUri: 'http://x/cb', codeVerifier: 'v',
        fetch: fetchMock as unknown as typeof fetch,
      });
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(CcamOAuthError);
      const e = err as InstanceType<typeof CcamOAuthError>;
      expect(e.oauthCode).toBe('invalid_client');
      expect(e.oauthDescription).toBe('Parameter client_assertion_type is missing');
      expect(e.status).toBe(400);
    }
  });

  it('does not embed the raw response body in the error message', async () => {
    // A pathological server that echoes a refresh token in its error body
    const echoed = '{"error":"invalid_grant","refresh_token":"REDACT_ME_PLEASE"}';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 400, text: async () => echoed,
    });
    try {
      await exchangeAuthorizationCode({
        clientId: 'cid', clientSecret: 'sec', host: 'https://am.example',
        code: 'c', redirectUri: 'http://x/cb', codeVerifier: 'v',
        fetch: fetchMock as unknown as typeof fetch,
      });
      throw new Error('expected throw');
    } catch (err) {
      const e = err as Error & { rawBody: string };
      expect(e.message).not.toContain('REDACT_ME_PLEASE');
      expect(e.rawBody).toContain('REDACT_ME_PLEASE');
    }
  });

  it('handles non-JSON server responses gracefully', async () => {
    const { CcamOAuthError } = await import('../../errors.js');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => '<html>Internal Server Error</html>',
    });
    try {
      await exchangeAuthorizationCode({
        clientId: 'cid', host: 'https://am.example',
        code: 'c', redirectUri: 'http://x/cb', codeVerifier: 'v',
        fetch: fetchMock as unknown as typeof fetch,
      });
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(CcamOAuthError);
      const e = err as InstanceType<typeof CcamOAuthError>;
      expect(e.oauthCode).toBeNull();
      expect(e.rawBody).toContain('Internal Server Error');
    }
  });
});

describe('buildAuthorizeUrl', () => {
  it('includes all required OAuth params', () => {
    const url = new URL(buildAuthorizeUrl({
      host: 'https://am.example',
      clientId: 'cid',
      redirectUri: 'http://127.0.0.1:65535/callback',
      codeChallenge: 'chal',
      state: 'xyz',
    }));
    expect(url.origin + url.pathname).toBe('https://am.example/dwsso/oauth2/authorize');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('cid');
    expect(url.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:65535/callback');
    expect(url.searchParams.get('code_challenge')).toBe('chal');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBe('xyz');
  });
});

describe('generateState', () => {
  it('returns a url-safe random string', () => {
    const s = generateState();
    expect(s).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(s.length).toBeGreaterThanOrEqual(22);
  });

  it('produces distinct values on successive calls', () => {
    expect(generateState()).not.toBe(generateState());
  });
});
