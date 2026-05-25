import { CcamClient, TokenManager } from 'ccam-sdk';
import type { ResolvedProfile } from './auth/profile-resolver.js';
import { ProfileStore } from './auth/profile-store.js';

export async function createClientFromResolved(
  resolved: ResolvedProfile,
  options: { fetch?: typeof fetch } = {},
): Promise<CcamClient> {
  if (!resolved.clientId) {
    throw new Error(
      'No client ID resolved. Provide --client-id, set CCAM_CLIENT_ID, or run `ccam auth login`.',
    );
  }
  // A public client (no secret) must rely on a cached token; it can't mint one on demand.
  if (!resolved.clientSecret && !resolved.cachedToken) {
    throw new Error(
      'No client secret and no cached token. Run `ccam auth login` to create a session.',
    );
  }
  const profileName = resolved.profileName;
  const store = new ProfileStore();
  const tokenManager = new TokenManager({
    clientId: resolved.clientId,
    clientSecret: resolved.clientSecret,
    user: resolved.user,
    userPassword: resolved.userPassword,
    host: resolved.host,
    fetch: options.fetch,
    initialCache: resolved.cachedToken
      ? {
          accessToken: resolved.cachedToken.accessToken,
          refreshToken: resolved.cachedToken.refreshToken,
          expiresAt: resolved.cachedToken.expiresAt,
        }
      : undefined,
    profileName: resolved.profileName,
    onTokenRefresh: profileName
      ? async (cache) => {
          await store.updateCredentials(profileName, {
            accessToken: cache.accessToken,
            refreshToken: cache.refreshToken,
            expiresAt: cache.expiresAt,
          });
        }
      : undefined,
  });
  return new CcamClient({ host: resolved.host, tokenManager, fetch: options.fetch });
}
