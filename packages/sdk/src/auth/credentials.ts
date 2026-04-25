export interface CredentialOptions {
  clientId?: string;
  clientSecret?: string;
  user?: string;
  userPassword?: string;
  host?: string;
}

export interface ResolvedCredentials {
  clientId: string;
  clientSecret: string;
  user?: string;
  userPassword?: string;
  host: string;
}

const DEFAULT_HOST = 'https://account.demandware.com';

export function resolveCredentials(options: CredentialOptions): ResolvedCredentials {
  const clientId = options.clientId ?? process.env.CCAM_CLIENT_ID;
  const clientSecret = options.clientSecret ?? process.env.CCAM_CLIENT_SECRET;
  const user = options.user ?? process.env.CCAM_USER;
  const userPassword = options.userPassword ?? process.env.CCAM_USER_PASSWORD;
  const host = options.host ?? process.env.CCAM_HOST ?? DEFAULT_HOST;

  if (options.clientId && !options.clientSecret) {
    throw new Error('Both clientId and clientSecret must be provided');
  }

  if (!options.clientId && options.clientSecret) {
    throw new Error('Both clientId and clientSecret must be provided');
  }

  if (!clientId || !clientSecret) {
    throw new Error('No client credentials found. Provide clientId and clientSecret or set CCAM_CLIENT_ID and CCAM_CLIENT_SECRET env vars.');
  }

  return {
    clientId,
    clientSecret,
    user,
    userPassword,
    host,
  };
}
