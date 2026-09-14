import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { capture, outputPath, terminalHtml } from './browser.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = outputPath(root, 'Capture the actual CCAM TUI with a synthetic organization client.');
const { build } = await import('esbuild');
const scratch = await mkdtemp(join(root, 'tools/cover/.frame-'));
try {
  const framePath = join(scratch, 'frame.mjs');
  await build({ entryPoints: [join(root, 'tools/cover/frame.tsx')], outfile: framePath,
    bundle: true, platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic' });
  const frame = execFileSync(process.execPath, [framePath], {
    cwd: root, encoding: 'utf8', timeout: 20_000,
    env: { ...process.env, FORCE_COLOR: '0', COLUMNS: '110', LINES: '30' },
  });
  assert.ok(frame.includes('Acme Commerce') && frame.includes('Sandbox Development'));
  await capture({ output, html: terminalHtml('CCAM', 'ccam --interactive', frame), viewport: { width: 1440, height: 900 },
    async ready(page) { await page.getByText('Sandbox Development', { exact: false }).waitFor(); },
  });
} finally { await rm(scratch, { recursive: true, force: true }); }
