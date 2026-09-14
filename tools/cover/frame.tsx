import React from 'react';
import { render } from 'ink-testing-library';
import { setTimeout as delay } from 'node:timers/promises';
import { App } from '../../packages/cli/src/tui/App.js';
import type { CcamClient } from 'ccam-sdk';

const organizations = ['Acme Commerce', 'Example Retail', 'Northstar Outfitters', 'Sandbox Development'].map((name, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, name,
}));
const client = { organizations: { async list() {
  return { content: organizations, page: { number: 0, size: 25, totalElements: organizations.length, totalPages: 1 }, links: [] };
} } } as unknown as CcamClient;
const app = render(<App client={client} />);
try {
  app.stdin.write('\r');
  const deadline = Date.now() + 10_000;
  while (!app.lastFrame()?.includes('Sandbox Development')) {
    if (Date.now() > deadline) throw new Error('Organization list did not render');
    await delay(50);
  }
  process.stdout.write(app.lastFrame()!);
} finally { app.unmount(); app.cleanup(); }
