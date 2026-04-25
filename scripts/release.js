#!/usr/bin/env node
// Builds a zero-dependency tarball of the ccam CLI for distribution
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const RELEASE_DIR = join(ROOT, 'release');
const CLI_PKG = JSON.parse(readFileSync(join(ROOT, 'packages/cli/package.json'), 'utf8'));

// Clean
rmSync(RELEASE_DIR, { recursive: true, force: true });
mkdirSync(RELEASE_DIR, { recursive: true });

// Type-check and compile
execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' });

// Bundle CLI + all deps into a single file
execFileSync('npx', [
  'esbuild',
  'packages/cli/dist/bin.js',
  '--bundle',
  '--platform=node',
  '--format=cjs',
  '--outfile=release/bin.js',
], { cwd: ROOT, stdio: 'inherit' });

// Write minimal package.json (zero dependencies)
writeFileSync(join(RELEASE_DIR, 'package.json'), JSON.stringify({
  name: CLI_PKG.name,
  version: CLI_PKG.version,
  description: CLI_PKG.description,
  bin: { ccam: 'bin.js' },
  engines: CLI_PKG.engines,
  license: CLI_PKG.license,
}, null, 2) + '\n');

// Pack
execFileSync('npm', ['pack'], { cwd: RELEASE_DIR, stdio: 'inherit' });

console.log(`\nRelease tarball: release/ccam-${CLI_PKG.version}.tgz`);
