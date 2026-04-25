import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import YAML from 'yaml';
import { getProfilesPath, getCredentialsPath, getConfigDir } from './paths.js';

export interface ProfileConfig {
  host: string;
  clientId: string;
  userEmail?: string;
}

export interface ProfileCredentials {
  refreshToken?: string;
  clientSecret?: string;
  userPassword?: string;
  accessToken?: string;
  expiresAt?: number;
}

export interface ProfileStoreState {
  activeProfile?: string;
  profiles: Record<string, ProfileConfig>;
  credentials: Record<string, ProfileCredentials>;
}

export interface SaveProfileInput {
  config: ProfileConfig;
  credentials: ProfileCredentials;
}

export type ProfileState = 'ok' | 'missing-credentials' | 'missing-config';

export interface ProfileSummary {
  name: string;
  state: ProfileState;
  config?: ProfileConfig;
}

export class ProfileStore {
  async read(): Promise<ProfileStoreState> {
    const profilesText = await readIfExists(getProfilesPath());
    const credentialsText = await readIfExists(getCredentialsPath());
    const profilesDoc = profilesText ? YAML.parse(profilesText) : {};
    const credentialsDoc = credentialsText ? YAML.parse(credentialsText) : {};
    return {
      activeProfile: profilesDoc?.activeProfile,
      profiles: profilesDoc?.profiles ?? {},
      credentials: credentialsDoc ?? {},
    };
  }

  async saveProfile(name: string, input: SaveProfileInput): Promise<void> {
    await ensureConfigDir();
    const state = await this.read();
    state.profiles[name] = input.config;
    state.credentials[name] = input.credentials;
    await this.writeState(state);
  }

  async setActiveProfile(name: string): Promise<void> {
    const state = await this.read();
    if (!state.profiles[name]) {
      if (state.credentials[name]) {
        throw new Error(`Profile '${name}' is incomplete: credentials present but config is missing. Run \`ccam auth login --profile ${name}\` to repair.`);
      }
      throw new Error(`Profile '${name}' not found`);
    }
    state.activeProfile = name;
    await this.writeState(state);
  }

  async deleteProfile(name: string): Promise<void> {
    const state = await this.read();
    delete state.profiles[name];
    delete state.credentials[name];
    if (state.activeProfile === name) {
      state.activeProfile = undefined;
    }
    await this.writeState(state);
  }

  async renameProfile(oldName: string, newName: string): Promise<void> {
    const state = await this.read();
    if (!state.profiles[oldName]) {
      throw new Error(`Profile '${oldName}' not found`);
    }
    if (state.profiles[newName]) {
      throw new Error(`Profile '${newName}' already exists`);
    }
    state.profiles[newName] = state.profiles[oldName];
    delete state.profiles[oldName];
    if (state.credentials[oldName]) {
      state.credentials[newName] = state.credentials[oldName];
      delete state.credentials[oldName];
    }
    if (state.activeProfile === oldName) {
      state.activeProfile = newName;
    }
    await this.writeState(state);
  }

  async updateCredentials(name: string, patch: Partial<ProfileCredentials>): Promise<void> {
    await ensureConfigDir();
    const credentialsText = await readIfExists(getCredentialsPath());
    const credentialsDoc: Record<string, ProfileCredentials> = credentialsText
      ? (YAML.parse(credentialsText) ?? {})
      : {};
    credentialsDoc[name] = { ...(credentialsDoc[name] ?? {}), ...patch };
    await atomicWrite(getCredentialsPath(), YAML.stringify(credentialsDoc), 0o600);
  }

  async listProfiles(): Promise<ProfileSummary[]> {
    const state = await this.read();
    const names = new Set([
      ...Object.keys(state.profiles),
      ...Object.keys(state.credentials),
    ]);
    return Array.from(names).sort().map((name) => {
      const hasConfig = Boolean(state.profiles[name]);
      const hasCreds = Boolean(state.credentials[name]);
      let s: ProfileState;
      if (hasConfig && hasCreds) s = 'ok';
      else if (!hasConfig) s = 'missing-config';
      else s = 'missing-credentials';
      return { name, state: s, config: state.profiles[name] };
    });
  }

  private async writeState(state: ProfileStoreState): Promise<void> {
    const profilesDoc = {
      activeProfile: state.activeProfile,
      profiles: state.profiles,
    };
    await atomicWrite(getProfilesPath(), YAML.stringify(profilesDoc), 0o644);
    await atomicWrite(getCredentialsPath(), YAML.stringify(state.credentials), 0o600);
  }
}

async function readIfExists(path: string): Promise<string | null> {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

async function ensureConfigDir(): Promise<void> {
  const dir = getConfigDir();
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  // mkdir with `recursive: true` will not re-chmod an existing directory, so
  // enforce 0o700 explicitly to close the loophole where a pre-existing dir
  // (e.g. created by hand or by an older ccam version) has looser perms.
  if (process.platform !== 'win32') {
    await fs.chmod(dir, 0o700);
  }
}

async function atomicWrite(target: string, content: string, mode: number): Promise<void> {
  const tmp = `${target}.tmp-${randomBytes(4).toString('hex')}`;
  await fs.writeFile(tmp, content, { mode });
  await fs.rename(tmp, target);
}
