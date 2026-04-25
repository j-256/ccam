import { randomBytes } from 'node:crypto';
import { CcamOAuthError } from '../errors.js';

export interface AuthCodeExchangeOptions {
  clientId: string;
  clientSecret?: string;
  host: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
  fetch?: typeof fetch;
}

export interface AuthCodeExchangeResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export async function exchangeAuthorizationCode(
  options: AuthCodeExchangeOptions,
): Promise<AuthCodeExchangeResult> {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: options.code,
    redirect_uri: options.redirectUri,
    code_verifier: options.codeVerifier,
  });
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (options.clientSecret) {
    const basic = Buffer.from(`${options.clientId}:${options.clientSecret}`).toString('base64');
    headers.Authorization = `Basic ${basic}`;
  } else {
    params.set('client_id', options.clientId);
  }
  const response = await fetchImpl(`${options.host}/dwsso/oauth2/access_token`, {
    method: 'POST',
    headers,
    body: params.toString(),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new CcamOAuthError(
      'Code exchange failed',
      { status: response.status, resource: 'auth', operation: 'authorization_code', rawBody: text },
    );
  }
  const data = await response.json() as { access_token: string; refresh_token?: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export interface AuthorizeUrlOptions {
  host: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}

export function buildAuthorizeUrl(opts: AuthorizeUrlOptions): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    code_challenge: opts.codeChallenge,
    code_challenge_method: 'S256',
    state: opts.state,
  });
  return `${opts.host}/dwsso/oauth2/authorize?${params.toString()}`;
}

export function generateState(): string {
  return randomBytes(16).toString('base64url');
}
