import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { ResourceDetailView } from '../../../tui/views/ResourceDetailView.js';
import { ClientProvider } from '../../../tui/context/client.js';
import { NavigationProvider, useNav } from '../../../tui/context/navigation.js';
import { TerminalSizeProvider } from '../../../tui/context/terminal-size.js';
import type { ResourceConfig, ViewEntry, TabConfig } from '../../../tui/types.js';
import { createMockClient, delay } from '../helpers.js';

const home: ViewEntry = { view: 'resource-picker', label: 'Home' };


// Helper to show current navigation state
function NavState() {
  const { current } = useNav();
  return (
    <Text>
      nav:{current.view}:{current.label}
      {current.params ? `:${JSON.stringify(current.params)}` : ''}
    </Text>
  );
}

function makeConfig(overrides?: Partial<ResourceConfig>): ResourceConfig {
  return {
    name: 'user',
    displayName: 'Users',
    idField: 'id',
    columns: [
      { key: 'mail', label: 'Email', width: 5 },
      { key: 'displayName', label: 'Name', width: 3 },
    ],
    listFn: vi.fn().mockResolvedValue({ content: [], links: [] }),
    labelFn: (item) => (item.displayName as string) || 'Unknown',
    detailFn: vi.fn().mockResolvedValue({
      id: '42',
      displayName: 'Alice',
      mail: 'alice@test.com',
      primaryOrganization: 'org-1',
    }),
    fields: [
      { key: 'displayName', label: 'Display Name' },
      { key: 'mail', label: 'Email' },
      {
        key: 'primaryOrganization',
        label: 'Primary Org',
        crossLink: { field: 'primaryOrganization', targetView: 'org-detail' },
      },
    ],
    tabs: [],
    crossLinks: [{ field: 'primaryOrganization', targetView: 'org-detail' }],
    ...overrides,
  };
}

function makeSubResourceTab(overrides?: Partial<TabConfig>): TabConfig {
  return {
    key: 'roles',
    label: 'Roles',
    type: 'local',
    fetchFn: vi.fn().mockResolvedValue({
      content: [
        { id: 'role-1', description: 'Admin Role' },
        { id: 'role-2', description: 'User Role' },
      ],
      links: [],
    }),
    columns: [
      { key: 'id', label: 'ID', width: 3 },
      { key: 'description', label: 'Description', width: 5 },
    ],
    crossLinkTo: 'role-detail',
    ...overrides,
  };
}

function makeAuditTab(overrides?: Partial<TabConfig>): TabConfig {
  return {
    key: 'audit',
    label: 'Audit',
    type: 'audit',
    fetchFn: vi.fn().mockResolvedValue({
      content: [
        { timestamp: '2024-01-01', eventType: 'LOGIN', eventMessage: 'User logged in', authorDisplayName: 'System' },
      ],
      links: [],
    }),
    columns: [
      { key: 'timestamp', label: 'Time', width: 2 },
      { key: 'eventType', label: 'Event', width: 2 },
      { key: 'eventMessage', label: 'Message', width: 4 },
      { key: 'authorDisplayName', label: 'Author', width: 2 },
    ],
    ...overrides,
  };
}

function renderView(
  config: ResourceConfig,
  id = '42',
  client?: ReturnType<typeof createMockClient>,
) {
  const c = client ?? createMockClient();
  return render(
    <TerminalSizeProvider>
      <ClientProvider client={c}>
        <NavigationProvider initial={home}>
          <ResourceDetailView config={config} id={id} />
          <NavState />
        </NavigationProvider>
      </ClientProvider>
    </TerminalSizeProvider>,
  );
}

describe('ResourceDetailView', () => {
  describe('loading and error states', () => {
    it('shows loading spinner initially', async () => {
      let resolve: (v: unknown) => void;
      const detailFn = vi.fn().mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }),
      );
      const config = makeConfig({ detailFn });
      const { lastFrame } = renderView(config);

      expect(lastFrame()).toContain('Loading Users');

      resolve!({ id: '42', displayName: 'Alice' });
      await delay();
    });

    it('shows error message with retry/back hints', async () => {
      const detailFn = vi.fn().mockRejectedValue(new Error('Not found'));
      const config = makeConfig({ detailFn });
      const { lastFrame } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('Error: Not found');
      expect(lastFrame()).toContain('r:retry');
      expect(lastFrame()).toContain('Esc:back');
    });

    it('retries on r after error', async () => {
      const detailFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ id: '42', displayName: 'Alice', mail: 'alice@test.com' });
      const config = makeConfig({ detailFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('Error: fail');

      stdin.write('r');
      await delay();

      expect(lastFrame()).toContain('Alice');
    });

    it('navigates back on Esc from error state', async () => {
      const detailFn = vi.fn().mockRejectedValue(new Error('fail'));
      const config = makeConfig({ detailFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('\x1B');
      await delay();

      expect(lastFrame()).toContain('nav:resource-picker:Home');
    });
  });

  describe('info tab rendering', () => {
    it('renders field labels and values', async () => {
      const config = makeConfig();
      const { lastFrame } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('Display Name');
      expect(lastFrame()).toContain('Alice');
      expect(lastFrame()).toContain('Email');
      expect(lastFrame()).toContain('alice@test.com');
    });

    it('shows tab bar with Info tab active', async () => {
      const config = makeConfig();
      const { lastFrame } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('Info');
    });

    it('shows info tab footer hints', async () => {
      const config = makeConfig();
      const { lastFrame } = renderView(config);
      await delay();

      const frame = lastFrame();
      expect(frame).toContain('Tab');
      expect(frame).toContain('next');
      expect(frame).toContain('j/k');
      expect(frame).toContain('nav');
      expect(frame).toContain('Enter');
      expect(frame).toContain('link');
      expect(frame).toContain('Esc');
      expect(frame).toContain('back');
    });
  });

  describe('tab switching', () => {
    it('switches to sub-resource tab on Tab key', async () => {
      const rolesTab = makeSubResourceTab();
      const config = makeConfig({ tabs: [rolesTab] });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      // Press Tab to switch to Roles tab
      stdin.write('\t');
      await delay();

      expect(lastFrame()).toContain('Roles');
      // Should show sub-resource content after loading
      expect(lastFrame()).toContain('Admin Role');
    });

    it('switches back with Shift-Tab', async () => {
      const rolesTab = makeSubResourceTab();
      const config = makeConfig({ tabs: [rolesTab] });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      // Tab to Roles
      stdin.write('\t');
      await delay();
      expect(lastFrame()).toContain('Admin Role');

      // Shift-Tab back to Info
      stdin.write('\x1B[Z'); // Shift-Tab escape sequence
      await delay();

      expect(lastFrame()).toContain('Display Name');
      expect(lastFrame()).toContain('Alice');
    });

    it('wraps around from last tab to first on Tab', async () => {
      const rolesTab = makeSubResourceTab();
      const config = makeConfig({ tabs: [rolesTab] });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      // Tab to Roles (tab 2 of 2)
      stdin.write('\t');
      await delay();
      // Tab again should wrap to Info (tab 1 of 2)
      stdin.write('\t');
      await delay();

      expect(lastFrame()).toContain('Display Name');
      expect(lastFrame()).toContain('Alice');
    });

    it('switches to tab by number key', async () => {
      const rolesTab = makeSubResourceTab();
      const auditTab = makeAuditTab();
      const config = makeConfig({ tabs: [rolesTab, auditTab] });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      // Press 2 to go to Roles (1=Info, 2=Roles, 3=Audit)
      stdin.write('2');
      await delay();

      expect(lastFrame()).toContain('Admin Role');
    });

    it('ignores number keys beyond tab count', async () => {
      const config = makeConfig({ tabs: [] });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('5');
      await delay();

      // Should still be on Info tab
      expect(lastFrame()).toContain('Display Name');
    });
  });

  describe('lazy loading', () => {
    it('does not fetch sub-resource tab data until activated', async () => {
      const fetchFn = vi.fn().mockResolvedValue({
        content: [{ id: 'role-1', description: 'Admin' }],
        links: [],
      });
      const rolesTab = makeSubResourceTab({ fetchFn });
      const config = makeConfig({ tabs: [rolesTab] });
      renderView(config);
      await delay();

      // Tab fetchFn should not have been called yet (only info is loaded)
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('fetches sub-resource data when tab is first activated', async () => {
      const fetchFn = vi.fn().mockResolvedValue({
        content: [{ id: 'role-1', description: 'Admin' }],
        links: [],
      });
      const rolesTab = makeSubResourceTab({ fetchFn });
      const config = makeConfig({ tabs: [rolesTab] });
      const { stdin } = renderView(config);
      await delay();

      // Switch to Roles tab
      stdin.write('\t');
      await delay();

      expect(fetchFn).toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('navigates back on Esc', async () => {
      const config = makeConfig();
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('\x1B');
      await delay();

      expect(lastFrame()).toContain('nav:resource-picker:Home');
    });

    it('navigates back on q', async () => {
      const config = makeConfig();
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('q');
      await delay();

      expect(lastFrame()).toContain('nav:resource-picker:Home');
    });
  });

  describe('footer hints per tab type', () => {
    it('shows info tab hints on Info tab', async () => {
      const config = makeConfig();
      const { lastFrame } = renderView(config);
      await delay();

      const frame = lastFrame();
      expect(frame).toContain('Tab');
      expect(frame).toContain('next');
      expect(frame).toContain('Enter');
      expect(frame).toContain('link');
    });

    it('shows sub-resource hints on sub-resource tab', async () => {
      const rolesTab = makeSubResourceTab();
      const config = makeConfig({ tabs: [rolesTab] });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('\t');
      await delay();

      const frame = lastFrame();
      expect(frame).toContain('Tab');
      expect(frame).toContain('next');
      expect(frame).toContain('j/k');
      expect(frame).toContain('nav');
      expect(frame).toContain('Enter');
      expect(frame).toContain('open');
      expect(frame).toContain('Esc');
      expect(frame).toContain('back');
    });

    it('shows audit hints on audit tab', async () => {
      const auditTab = makeAuditTab();
      const config = makeConfig({ tabs: [auditTab] });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('\t');
      await delay();

      const frame = lastFrame();
      expect(frame).toContain('Tab');
      expect(frame).toContain('next');
      expect(frame).toContain('j/k');
      expect(frame).toContain('scroll');
      expect(frame).toContain('m');
      expect(frame).toContain('more');
      expect(frame).toContain('Esc');
      expect(frame).toContain('back');
    });
  });

  describe('audit tab integration', () => {
    it('renders audit tab with data', async () => {
      const auditTab = makeAuditTab();
      const config = makeConfig({ tabs: [auditTab] });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('\t');
      await delay();

      expect(lastFrame()).toContain('LOGIN');
      expect(lastFrame()).toContain('User logged in');
    });
  });
});
