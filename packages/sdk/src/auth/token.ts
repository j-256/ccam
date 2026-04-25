import { CcamOAuthError, CcamRefreshFailedError } from '../errors.js';

export interface TokenCache {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface TokenManagerOptions {
  clientId: string;
  clientSecret?: string;
  user?: string;
  userPassword?: string;
  host: string;
  fetch?: typeof fetch;
  initialCache?: TokenCache;
  onTokenRefresh?: (cache: TokenCache) => void | Promise<void>;
  profileName?: string;
}

const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

export class TokenManager {
  private readonly clientId: string;
  private readonly clientSecret: string | undefined;
  private readonly user?: string;
  private readonly userPassword?: string;
  private readonly host: string;
  private readonly fetch: typeof fetch;
  private readonly onTokenRefresh?: (cache: TokenCache) => void | Promise<void>;
  private readonly profileName?: string;
  private cache: TokenCache | null;

  constructor(options: TokenManagerOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.user = options.user;
    this.userPassword = options.userPassword;
    this.host = options.host;
    this.fetch = options.fetch ?? globalThis.fetch;
    this.onTokenRefresh = options.onTokenRefresh;
    this.profileName = options.profileName;
    this.cache = options.initialCache ?? null;
  }

  async getToken(): Promise<string> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.accessToken;
    }
    if (this.cache?.refreshToken) {
      return this.refreshAccessToken(this.cache.refreshToken);
    }
    // Public clients (no secret) cannot mint a token via client_credentials or password grants.
    // If we got here without a refresh token, the session is unrecoverable without re-login.
    if (!this.clientSecret) {
      throw new CcamRefreshFailedError(
        'Session expired and no refresh token available. Run `ccam auth login` to reauthenticate.',
        { profile: this.profileName, status: 401, rawBody: '' },
      );
    }
    return this.acquireInitialToken();
  }

  invalidate(): void {
    this.cache = null;
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const body = `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`;
    const response = await this.postToken(body);
    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 400 || response.status === 401) {
        throw new CcamRefreshFailedError(
          'Refresh token rejected',
          { profile: this.profileName, status: response.status, rawBody: errorText },
        );
      }
      throw new CcamOAuthError(
        'Token refresh failed',
        { status: response.status, resource: 'auth', operation: 'refresh_token', rawBody: errorText },
      );
    }
    const data = await response.json() as { access_token: string; expires_in: number; refresh_token?: string };
    const next: TokenCache = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: Date.now() + (data.expires_in - TOKEN_EXPIRY_BUFFER_SECONDS) * 1000,
    };
    this.cache = next;
    await this.onTokenRefresh?.(next);
    return next.accessToken;
  }

  private async acquireInitialToken(): Promise<string> {
    const body = this.user && this.userPassword
      ? `grant_type=password&username=${encodeURIComponent(this.user)}&password=${encodeURIComponent(this.userPassword)}`
      : 'grant_type=client_credentials';
    const response = await this.postToken(body);
    if (!response.ok) {
      const errorText = await response.text();
      const grant = this.user && this.userPassword ? 'password' : 'client_credentials';
      throw new CcamOAuthError(
        'Token acquisition failed',
        { status: response.status, resource: 'auth', operation: grant, rawBody: errorText },
      );
    }
    const data = await response.json() as { access_token: string; expires_in: number; refresh_token?: string };
    const next: TokenCache = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in - TOKEN_EXPIRY_BUFFER_SECONDS) * 1000,
    };
    this.cache = next;
    await this.onTokenRefresh?.(next);
    return next.accessToken;
  }

  private postToken(body: string): Promise<Response> {
    const url = `${this.host}/dwsso/oauth2/access_token`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    let finalBody = body;
    if (this.clientSecret) {
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      headers.Authorization = `Basic ${basicAuth}`;
    } else {
      finalBody = `${body}&client_id=${encodeURIComponent(this.clientId)}`;
    }
    return this.fetch(url, {
      method: 'POST',
      headers,
      body: finalBody,
    });
  }
}
