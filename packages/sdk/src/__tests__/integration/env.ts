import { config } from 'dotenv';
import path from 'node:path';

const testEnv = process.env.TEST_ENV ?? 'stg';
const envFile = `.env.integration.${testEnv}`;
const envPath = path.resolve(import.meta.dirname, '../../../../..', envFile);

config({ path: envPath });

export interface IntegrationConfig {
  clientId: string;
  clientSecret: string;
  host: string;
  userId: string;
  userLogin: string;
  orgId: string;
  orgName: string;
  apiClientId: string;
  roleId: string;
  realmId: string;
  permissionName: string;
  serviceTypeId: string;
  sfAccountId: string | undefined;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}. Check ${envFile}`);
  }
  return value;
}

function loadConfig(): IntegrationConfig | null {
  // If core credentials are missing, skip the entire suite
  if (!process.env.CCAM_CLIENT_ID || !process.env.CCAM_CLIENT_SECRET || !process.env.CCAM_HOST) {
    return null;
  }
  return {
    clientId: requireEnv('CCAM_CLIENT_ID'),
    clientSecret: requireEnv('CCAM_CLIENT_SECRET'),
    host: requireEnv('CCAM_HOST'),
    userId: requireEnv('TEST_USER_ID'),
    userLogin: requireEnv('TEST_USER_LOGIN'),
    orgId: requireEnv('TEST_ORG_ID'),
    orgName: requireEnv('TEST_ORG_NAME'),
    apiClientId: requireEnv('TEST_API_CLIENT_ID'),
    roleId: requireEnv('TEST_ROLE_ID'),
    realmId: requireEnv('TEST_REALM_ID'),
    permissionName: requireEnv('TEST_PERMISSION_NAME'),
    serviceTypeId: requireEnv('TEST_SERVICE_TYPE_ID'),
    sfAccountId: process.env.TEST_SF_ACCOUNT_ID || undefined,
  };
}

export const ENV = loadConfig();
