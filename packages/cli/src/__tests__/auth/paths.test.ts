import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getConfigDir, getProfilesPath, getCredentialsPath } from '../../auth/paths.js';
import path from 'node:path';
import os from 'node:os';

describe('config paths', () => {
  const originalXdg = process.env.XDG_CONFIG_HOME;
  beforeEach(() => { delete process.env.XDG_CONFIG_HOME; });
  afterEach(() => {
    if (originalXdg === undefined) delete process.env.XDG_CONFIG_HOME;
    else process.env.XDG_CONFIG_HOME = originalXdg;
  });

  it('defaults config dir to ~/.config/ccam', () => {
    expect(getConfigDir()).toBe(path.join(os.homedir(), '.config', 'ccam'));
  });

  it('honors XDG_CONFIG_HOME when set', () => {
    process.env.XDG_CONFIG_HOME = '/tmp/xdg';
    expect(getConfigDir()).toBe('/tmp/xdg/ccam');
  });

  it('profiles path is <dir>/profiles.yaml', () => {
    process.env.XDG_CONFIG_HOME = '/tmp/xdg';
    expect(getProfilesPath()).toBe('/tmp/xdg/ccam/profiles.yaml');
  });

  it('credentials path is <dir>/credentials', () => {
    process.env.XDG_CONFIG_HOME = '/tmp/xdg';
    expect(getCredentialsPath()).toBe('/tmp/xdg/ccam/credentials');
  });
});
