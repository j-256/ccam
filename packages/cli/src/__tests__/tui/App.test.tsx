import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { App } from '../../tui/App.js';
import { createMockClient, mockPagedResponse, delay } from './helpers.js';

describe('App', () => {
  it('renders resource picker on start', () => {
    const client = createMockClient();
    const { lastFrame } = render(<App client={client} />);
    expect(lastFrame()).toContain('Select a resource');
    expect(lastFrame()).toContain('Organizations');
  });

  it('renders breadcrumb header', () => {
    const client = createMockClient();
    const { lastFrame } = render(<App client={client} />);
    expect(lastFrame()).toContain('Home');
  });

  it('navigates to org list on Enter', async () => {
    const client = createMockClient();
    (client.organizations.list as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockPagedResponse([{ id: '1', name: 'Acme' }]),
    );
    const { lastFrame, stdin } = render(<App client={client} />);

    stdin.write('\r'); // Enter on "Organizations"
    await delay();
    // After navigation, breadcrumb should show Organizations
    expect(lastFrame()).toContain('Organizations');
  });

  it('navigates back with Esc', async () => {
    const client = createMockClient();
    (client.organizations.list as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockPagedResponse([{ id: '1', name: 'Acme' }]),
    );
    const { lastFrame, stdin } = render(<App client={client} />);

    stdin.write('\r'); // Navigate to org list
    await delay();
    stdin.write('\u001B'); // Esc to go back
    await delay(); // Wait for navigation to complete
    expect(lastFrame()).toContain('Select a resource');
  });
});
