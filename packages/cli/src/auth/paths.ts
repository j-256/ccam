import os from 'node:os';
import path from 'node:path';

export function getConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg && xdg.length > 0) return path.join(xdg, 'ccam');
  return path.join(os.homedir(), '.config', 'ccam');
}

export function getProfilesPath(): string {
  return path.join(getConfigDir(), 'profiles.yaml');
}

export function getCredentialsPath(): string {
  return path.join(getConfigDir(), 'credentials');
}
