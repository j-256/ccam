#!/usr/bin/env node
// Runs in the npm `version` lifecycle (after npm bumps root version, before commit/tag).
// Syncs workspace versions and the CLI's ccam-sdk dep, refreshes the lockfile,
// and stages the resulting changes so npm's auto-commit picks them up.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const newVersion = rootPkg.version;

console.log(`==> Syncing workspace versions to ${newVersion}`);

for (const ws of ['packages/sdk', 'packages/cli']) {
  const pkgPath = join(ROOT, ws, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.version = newVersion;
  if (pkg.dependencies?.['ccam-sdk']) {
    pkg.dependencies['ccam-sdk'] = newVersion;
  }
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`    ${ws}: ${newVersion}`);
}

console.log('==> Refreshing lockfile');
execSync('npm install --package-lock-only', { cwd: ROOT, stdio: 'inherit' });

console.log('==> Staging changes for npm version commit');
execSync(
  'git add packages/sdk/package.json packages/cli/package.json package-lock.json',
  { cwd: ROOT, stdio: 'inherit' },
);
