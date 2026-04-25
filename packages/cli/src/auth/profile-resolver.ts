// packages/cli/src/auth/profile-resolver.ts
import { ProfileStore } from './profile-store.js';
import type { ProfileConfig, ProfileCredentials } from './profile-store.js';

const DEFAULT_HOST = 'https://account.demandware.com';

export interface ResolveFlags {
  profile?: string;
  host?: string;
  clientId?: string;
  clientSecret?: string;
  user?: string;
  userPassword?: string;
}

export interface ResolvedProfile {
  profileName?: string;
  host: string;
  clientId?: string;
  clientSecret?: string;
  user?: string;
  userPassword?: string;
  cachedToken?: { accessToken: string; expiresAt: number; refreshToken?: string };
  source: 'flags' | 'env' | 'profile' | 'defaults' | 'mixed';
}

export async function resolveProfile(input: { flags: ResolveFlags }): Promise<ResolvedProfile> {
  const store = new ProfileStore();
  const state = await store.read();
  const profileName = input.flags.profile ?? process.env.CCAM_PROFILE ?? state.activeProfile;
  const profile: ProfileConfig | undefined = profileName ? state.profiles[profileName] : undefined;
  const creds: ProfileCredentials | undefined = profileName ? state.credentials[profileName] : undefined;

  const pick = (flag: string | undefined, env: string | undefined, profileVal: string | undefined): string | undefined => {
    return flag ?? env ?? profileVal;
  };

  const host = pick(input.flags.host, process.env.CCAM_HOST, profile?.host) ?? DEFAULT_HOST;
  const clientId = pick(input.flags.clientId, process.env.CCAM_CLIENT_ID, profile?.clientId);
  const clientSecret = pick(input.flags.clientSecret, process.env.CCAM_CLIENT_SECRET, creds?.clientSecret);
  const user = pick(input.flags.user, process.env.CCAM_USER, undefined);
  const userPassword = pick(input.flags.userPassword, process.env.CCAM_USER_PASSWORD, creds?.userPassword);

  const credentialOverride = (
    input.flags.host !== undefined ||
    input.flags.clientId !== undefined ||
    input.flags.clientSecret !== undefined ||
    input.flags.user !== undefined ||
    input.flags.userPassword !== undefined ||
    process.env.CCAM_HOST !== undefined ||
    process.env.CCAM_CLIENT_ID !== undefined ||
    process.env.CCAM_CLIENT_SECRET !== undefined ||
    process.env.CCAM_USER !== undefined ||
    process.env.CCAM_USER_PASSWORD !== undefined
  );

  const cachedToken = !credentialOverride && creds?.accessToken && creds.expiresAt
    ? { accessToken: creds.accessToken, expiresAt: creds.expiresAt, refreshToken: creds.refreshToken }
    : undefined;

  let source: ResolvedProfile['source'];
  if (input.flags.host || input.flags.clientId || input.flags.clientSecret || input.flags.user || input.flags.userPassword) source = 'flags';
  else if (process.env.CCAM_HOST || process.env.CCAM_CLIENT_ID || process.env.CCAM_CLIENT_SECRET || process.env.CCAM_USER || process.env.CCAM_USER_PASSWORD) source = 'env';
  else if (profile) source = 'profile';
  else source = 'defaults';

  return { profileName, host, clientId, clientSecret, user, userPassword, cachedToken, source };
}
