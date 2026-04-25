import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { SubResourceTab } from '../../../tui/components/SubResourceTab.js';
import { ClientProvider } from '../../../tui/context/client.js';
import { NavigationProvider, useNav } from '../../../tui/context/navigation.js';
import { TerminalSizeProvider } from '../../../tui/context/terminal-size.js';
import type { TabConfig, ViewEntry } from '../../../tui/types.js';
import { createMockClient, delay } from '../helpers.js';

const home: ViewEntry = { view: 'resource-picker', label: 'Home' };

let originalColumns: number | undefined;
let originalRows: number | undefined;

beforeEach(() => {
  originalColumns = process.stdout.columns;
  originalRows = process.stdout.rows;
  Object.defineProperty(process.stdout, 'columns', { value: 100, writable: true, configurable: true });
  Object.defineProperty(process.stdout, 'rows', { value: 24, writable: true, configurable: true });
});

afterEach(() => {
  Object.defineProperty(process.stdout, 'columns', { value: originalColumns, writable: true, configurable: true });
  Object.defineProperty(process.stdout, 'rows', { value: originalRows, writable: true, configurable: true });
});

function NavState() {
  const { current } = useNav();
  return (
    <Text>
      nav:{current.view}:{current.label}
      {current.params ? `:${JSON.stringify(current.params)}` : ''}
    </Text>
  );
}

function renderSubResourceTab(
  tab: TabConfig,
  parentId: string,
  client?: ReturnType<typeof createMockClient>,
) {
  const c = client ?? createMockClient();
  return render(
    <TerminalSizeProvider>
      <ClientProvider client={c}>
        <NavigationProvider initial={home}>
          <SubResourceTab tab={tab} parentId={parentId} />
          <NavState />
        </NavigationProvider>
      </ClientProvider>
    </TerminalSizeProvider>,
  );
}

function makeLocalTab(overrides?: Partial<TabConfig>): TabConfig {
  return {
    key: 'roles',
    label: 'Roles',
    type: 'local',
    fetchFn: vi.fn().mockResolvedValue({
      content: [
        { id: 'role-1', description: 'Admin Role', scope: 'global' },
        { id: 'role-2', description: 'User Role', scope: 'org' },
      ],
      links: [],
    }),
    columns: [
      { key: 'id', label: 'ID', width: 2 },
      { key: 'description', label: 'Description', width: 4 },
      { key: 'scope', label: 'Scope', width: 1 },
    ],
    crossLinkTo: 'role-detail',
    ...overrides,
  };
}

describe('SubResourceTab', () => {
  describe('local type', () => {
    it('shows loading state initially', async () => {
      let resolveFn: (v: unknown) => void;
      const tab = makeLocalTab({
        fetchFn: vi.fn().mockReturnValue(
          new Promise((r) => { resolveFn = r; }),
        ),
      });
      const { lastFrame } = renderSubResourceTab(tab, 'user-1');
      expect(lastFrame()).toContain('Loading');

      resolveFn!({ content: [], links: [] });
      await delay();
    });

    it('renders data after loading', async () => {
      const tab = makeLocalTab();
      const { lastFrame } = renderSubResourceTab(tab, 'user-1');
      await delay();

      expect(lastFrame()).toContain('Admin Role');
      expect(lastFrame()).toContain('User Role');
    });

    it('shows item count', async () => {
      const tab = makeLocalTab();
      const { lastFrame } = renderSubResourceTab(tab, 'user-1');
      await delay();

      expect(lastFrame()).toContain('2 items');
    });

    it('navigates rows with j/k', async () => {
      const tab = makeLocalTab();
      const { lastFrame, stdin } = renderSubResourceTab(tab, 'user-1');
      await delay();

      // Move down and press Enter to verify highlight moved
      stdin.write('j');
      await delay();
      stdin.write('\r');
      await delay();

      expect(lastFrame()).toContain('nav:role-detail:role-2');
    });

    it('follows cross-link on Enter', async () => {
      const tab = makeLocalTab();
      const { lastFrame, stdin } = renderSubResourceTab(tab, 'user-1');
      await delay();

      stdin.write('\r');
      await delay();

      expect(lastFrame()).toContain('nav:role-detail:role-1');
      expect(lastFrame()).toContain('"id":"role-1"');
    });

    it('does not navigate on Enter when no crossLinkTo', async () => {
      const tab = makeLocalTab({ crossLinkTo: undefined });
      const { lastFrame, stdin } = renderSubResourceTab(tab, 'user-1');
      await delay();

      stdin.write('\r');
      await delay();

      // Should still be on home view
      expect(lastFrame()).toContain('nav:resource-picker:Home');
    });

    it('shows error state', async () => {
      const tab = makeLocalTab({
        fetchFn: vi.fn().mockRejectedValue(new Error('Network error')),
      });
      const { lastFrame } = renderSubResourceTab(tab, 'user-1');
      await delay();

      expect(lastFrame()).toContain('Error: Network error');
      expect(lastFrame()).toContain('r:retry');
    });

    it('retries on r from error state', async () => {
      const tab = makeLocalTab({
        fetchFn: vi.fn()
          .mockRejectedValueOnce(new Error('fail'))
          .mockResolvedValueOnce({
            content: [{ id: 'r1', description: 'Recovered', scope: 'x' }],
            links: [],
          }),
      });
      const { lastFrame, stdin } = renderSubResourceTab(tab, 'user-1');
      await delay();

      expect(lastFrame()).toContain('Error: fail');

      stdin.write('r');
      await delay();

      expect(lastFrame()).toContain('Recovered');
    });

    it('supports client-side sort with s', async () => {
      const tab = makeLocalTab({
        fetchFn: vi.fn().mockResolvedValue({
          content: [
            { id: 'b-role', description: 'Beta', scope: 'org' },
            { id: 'a-role', description: 'Alpha', scope: 'global' },
          ],
          links: [],
        }),
      });
      const { lastFrame, stdin } = renderSubResourceTab(tab, 'user-1');
      await delay();

      // Sort by first column (id)
      stdin.write('s');
      await delay();

      expect(lastFrame()).toContain('Sort: ID asc');
    });

    it('reverses sort with S', async () => {
      const tab = makeLocalTab();
      const { lastFrame, stdin } = renderSubResourceTab(tab, 'user-1');
      await delay();

      stdin.write('s');
      await delay();
      stdin.write('S');
      await delay();

      expect(lastFrame()).toContain('Sort: ID desc');
    });
  });

  describe('paginated type', () => {
    function makePaginatedTab(overrides?: Partial<TabConfig>): TabConfig {
      return {
        key: 'instances',
        label: 'Instances',
        type: 'paginated',
        fetchFn: vi.fn().mockResolvedValue({
          content: [
            { id: 'inst-1', description: 'Production' },
            { id: 'inst-2', description: 'Staging' },
          ],
          page: { number: 0, size: 25, totalElements: 2, totalPages: 1 },
          links: [],
        }),
        columns: [
          { key: 'id', label: 'ID', width: 2 },
          { key: 'description', label: 'Description', width: 4 },
        ],
        crossLinkTo: 'instance-detail',
        ...overrides,
      };
    }

    it('renders paginated data', async () => {
      const tab = makePaginatedTab();
      const { lastFrame } = renderSubResourceTab(tab, 'org-1');
      await delay();

      expect(lastFrame()).toContain('Production');
      expect(lastFrame()).toContain('Staging');
    });

    it('shows item count for non-paged response', async () => {
      const tab = makePaginatedTab({
        fetchFn: vi.fn().mockResolvedValue({
          content: [{ id: 'x', description: 'Only' }],
          links: [],
        }),
      });
      const { lastFrame } = renderSubResourceTab(tab, 'org-1');
      await delay();

      expect(lastFrame()).toContain('1 items');
    });

    it('follows cross-link on Enter', async () => {
      const tab = makePaginatedTab();
      const { lastFrame, stdin } = renderSubResourceTab(tab, 'org-1');
      await delay();

      stdin.write('\r');
      await delay();

      expect(lastFrame()).toContain('nav:instance-detail:inst-1');
    });
  });
});
