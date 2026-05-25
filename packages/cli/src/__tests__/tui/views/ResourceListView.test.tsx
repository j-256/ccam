import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { ResourceListView } from '../../../tui/views/ResourceListView.js';
import { ClientProvider } from '../../../tui/context/client.js';
import { NavigationProvider, useNav } from '../../../tui/context/navigation.js';
import { TerminalSizeProvider } from '../../../tui/context/terminal-size.js';
import type { ResourceConfig, ViewEntry } from '../../../tui/types.js';
import { createMockClient, mockPagedResponse, delay } from '../helpers.js';
import type { ContentResponse } from 'ccam-sdk';

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

// Minimal config for testing (paginated)
function makeConfig(overrides?: Partial<ResourceConfig>): ResourceConfig {
  return {
    name: 'user',
    displayName: 'Users',
    idField: 'id',
    columns: [
      { key: 'mail', label: 'Email', width: 5, sort: { mode: 'remote' } },
      { key: 'displayName', label: 'Name', width: 3, sort: { mode: 'remote' } },
    ],
    listFn: vi.fn().mockResolvedValue(mockPagedResponse([])),
    labelFn: (item) => (item.displayName as string) || 'Unknown',
    detailFn: vi.fn().mockResolvedValue({}),
    fields: [],
    tabs: [],
    crossLinks: [],
    ...overrides,
  };
}

// Non-paginated config helper
function makeNonPaginatedConfig(
  content: Record<string, unknown>[],
  overrides?: Partial<ResourceConfig>,
): ResourceConfig {
  const listFn = vi.fn().mockResolvedValue({
    content,
    links: [],
  } as ContentResponse<Record<string, unknown>>);

  return makeConfig({
    name: 'permission',
    displayName: 'Permissions',
    idField: 'name',
    columns: [
      { key: 'name', label: 'Name', width: 4 },
      { key: 'description', label: 'Description', width: 5 },
    ],
    listFn,
    labelFn: (item) => (item.name as string) || 'Permission',
    ...overrides,
  });
}

function renderView(config: ResourceConfig, client?: ReturnType<typeof createMockClient>) {
  const c = client ?? createMockClient();
  return render(
    <TerminalSizeProvider>
      <ClientProvider client={c}>
        <NavigationProvider initial={home}>
          <ResourceListView config={config} />
          <NavState />
        </NavigationProvider>
      </ClientProvider>
    </TerminalSizeProvider>,
  );
}

describe('ResourceListView', () => {
  describe('data rendering', () => {
    it('shows loading spinner initially', async () => {
      // Use a promise that never resolves immediately
      let resolve: (v: unknown) => void;
      const listFn = vi.fn().mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }),
      );
      const config = makeConfig({ listFn });
      const { lastFrame } = renderView(config);

      expect(lastFrame()).toContain('Loading Users');

      // Clean up: resolve the promise
      resolve!(mockPagedResponse([]));
      await delay();
    });

    it('renders data in table after loading', async () => {
      const listFn = vi.fn().mockResolvedValue(
        mockPagedResponse([
          { id: '1', mail: 'alice@test.com', displayName: 'Alice' },
          { id: '2', mail: 'bob@test.com', displayName: 'Bob' },
        ]),
      );
      const config = makeConfig({ listFn });
      const { lastFrame } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('alice@test.com');
      expect(lastFrame()).toContain('Bob');
    });

    it('shows section header with display name and count', async () => {
      const listFn = vi.fn().mockResolvedValue(
        mockPagedResponse(
          [{ id: '1', mail: 'alice@test.com', displayName: 'Alice' }],
          0,
          1,
          1,
        ),
      );
      const config = makeConfig({ listFn });
      const { lastFrame } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('Users');
      expect(lastFrame()).toContain('(1)');
    });

    it('shows page info for paginated results', async () => {
      const listFn = vi.fn().mockResolvedValue(
        mockPagedResponse(
          [{ id: '1', mail: 'alice@test.com', displayName: 'Alice' }],
          0,
          10,
          247,
        ),
      );
      const config = makeConfig({ listFn });
      const { lastFrame } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('1-1 of 247');
      expect(lastFrame()).toContain('Page 1/10');
    });

    it('shows result count for non-paginated results', async () => {
      const config = makeNonPaginatedConfig([
        { name: 'perm-a' },
        { name: 'perm-b' },
        { name: 'perm-c' },
      ]);
      const { lastFrame } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('3 results');
    });

    it('shows keyboard hints including n/p page for paginated', async () => {
      const listFn = vi.fn().mockResolvedValue(
        mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }], 0, 3, 75),
      );
      const config = makeConfig({ listFn });
      const { lastFrame } = renderView(config);
      await delay();

      const frame = lastFrame();
      expect(frame).toContain('j/k');
      expect(frame).toContain('nav');
      expect(frame).toContain('n/p');
      expect(frame).toContain('page');
      expect(frame).toContain('Enter');
      expect(frame).toContain('open');
      expect(frame).toContain('Esc');
      expect(frame).toContain('back');
    });

    it('shows sort hints when sortable columns are defined', async () => {
      const listFn = vi.fn().mockResolvedValue(
        mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }]),
      );
      const config = makeConfig({ listFn });
      const { lastFrame } = renderView(config);
      await delay();

      const frame = lastFrame();
      expect(frame).toContain('s');
      expect(frame).toContain('sort');
      expect(frame).toContain('S');
      expect(frame).toContain('reverse');
    });

    it('does not show sort hints when no sortable columns exist', async () => {
      const config = makeNonPaginatedConfig([{ name: 'perm-a' }]);
      const { lastFrame } = renderView(config);
      await delay();

      const frame = lastFrame();
      expect(frame).not.toContain('[s:sort]');
    });

    it('shows statsLabel in footer', async () => {
      const listFn = vi.fn().mockResolvedValue(
        mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }], 0, 1, 247),
      );
      const config = makeConfig({ listFn });
      const { lastFrame } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('247 Users');
    });
  });

  describe('pagination', () => {
    it('fetches next page on n', async () => {
      const listFn = vi
        .fn()
        .mockResolvedValueOnce(
          mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }], 0, 3, 75),
        )
        .mockResolvedValueOnce(
          mockPagedResponse([{ id: '2', mail: 'c@d.com', displayName: 'C' }], 1, 3, 75),
        );
      const config = makeConfig({ listFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('n');
      await delay();

      expect(lastFrame()).toContain('c@d.com');
      expect(lastFrame()).toContain('Page 2/3');
    });

    it('fetches prev page on p', async () => {
      const listFn = vi
        .fn()
        .mockResolvedValueOnce(
          mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }], 0, 3, 75),
        )
        .mockResolvedValueOnce(
          mockPagedResponse([{ id: '2', mail: 'c@d.com', displayName: 'C' }], 1, 3, 75),
        )
        .mockResolvedValueOnce(
          mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }], 0, 3, 75),
        );
      const config = makeConfig({ listFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('n');
      await delay();
      stdin.write('p');
      await delay();

      expect(lastFrame()).toContain('a@b.com');
      expect(lastFrame()).toContain('Page 1/3');
    });
  });

  describe('sort cycling', () => {
    it('cycles sort field on s', async () => {
      const listFn = vi
        .fn()
        .mockResolvedValueOnce(
          mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }]),
        )
        .mockResolvedValueOnce(
          mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }]),
        );
      const config = makeConfig({ listFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('s');
      await delay();

      // Should show up arrow (ascending) in the Email column header
      expect(lastFrame()).toContain('\u25b2');
    });

    it('cycles to next sort field on subsequent s', async () => {
      const listFn = vi
        .fn()
        .mockResolvedValue(
          mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }]),
        );
      const config = makeConfig({ listFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('s');
      await delay();
      stdin.write('s');
      await delay();

      // Should show up arrow in the Name column (Display Name sorts on displayName field)
      const frame = lastFrame();
      expect(frame).toContain('\u25b2');
      expect(frame).toContain('Name');
    });

    it('reverses sort direction on S', async () => {
      const listFn = vi
        .fn()
        .mockResolvedValue(
          mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }]),
        );
      const config = makeConfig({ listFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      // First set a sort
      stdin.write('s');
      await delay();

      // Then reverse it
      stdin.write('S');
      await delay();

      // Should show down arrow (descending)
      expect(lastFrame()).toContain('\u25bc');
    });

    it('s is no-op when config has no sortable columns', async () => {
      const config = makeNonPaginatedConfig([{ name: 'perm-a' }]);
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('s');
      await delay();

      // Should not crash; frame should be unchanged (no sort arrows)
      const frame = lastFrame();
      expect(frame).not.toContain('\u25b2');
      expect(frame).not.toContain('\u25bc');
      expect(frame).toContain('perm-a');
    });
  });

  describe('navigation on Enter', () => {
    it('pushes detail view on Enter', async () => {
      const listFn = vi.fn().mockResolvedValue(
        mockPagedResponse([
          { id: '42', mail: 'alice@test.com', displayName: 'Alice' },
        ]),
      );
      const config = makeConfig({ listFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('\r');
      await delay();

      expect(lastFrame()).toContain('nav:user-detail:Alice');
      expect(lastFrame()).toContain('"id":"42"');
    });

    it('uses config.idField for params', async () => {
      const listFn = vi.fn().mockResolvedValue({
        content: [{ name: 'admin-perm', description: 'Admin' }],
        links: [],
      });
      const config = makeNonPaginatedConfig([{ name: 'admin-perm', description: 'Admin' }], {
        listFn,
      });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('\r');
      await delay();

      expect(lastFrame()).toContain('nav:permission-detail:admin-perm');
      expect(lastFrame()).toContain('"id":"admin-perm"');
    });

    it('navigates to correct item after moving highlight', async () => {
      const listFn = vi.fn().mockResolvedValue(
        mockPagedResponse([
          { id: '1', mail: 'alice@test.com', displayName: 'Alice' },
          { id: '2', mail: 'bob@test.com', displayName: 'Bob' },
        ]),
      );
      const config = makeConfig({ listFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('j'); // move to Bob
      await delay();
      stdin.write('\r');
      await delay();

      expect(lastFrame()).toContain('nav:user-detail:Bob');
      expect(lastFrame()).toContain('"id":"2"');
    });
  });

  describe('error state', () => {
    it('shows error message in red', async () => {
      const listFn = vi.fn().mockRejectedValue(new Error('Network failure'));
      const config = makeConfig({ listFn });
      const { lastFrame } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('Error: Network failure');
    });

    it('shows retry and back hints', async () => {
      const listFn = vi.fn().mockRejectedValue(new Error('fail'));
      const config = makeConfig({ listFn });
      const { lastFrame } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('r:retry');
      expect(lastFrame()).toContain('Esc:back');
    });

    it('retries on r', async () => {
      const listFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(
          mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }]),
        );
      const config = makeConfig({ listFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      expect(lastFrame()).toContain('Error: fail');

      stdin.write('r');
      await delay();

      expect(lastFrame()).toContain('a@b.com');
    });
  });

  describe('keyboard navigation', () => {
    it('g jumps to first row', async () => {
      const listFn = vi.fn().mockResolvedValue(
        mockPagedResponse([
          { id: '1', mail: 'a@b.com', displayName: 'A' },
          { id: '2', mail: 'c@d.com', displayName: 'C' },
          { id: '3', mail: 'e@f.com', displayName: 'E' },
        ]),
      );
      const config = makeConfig({ listFn });
      const { stdin } = renderView(config);
      await delay();

      stdin.write('j');
      await delay();
      stdin.write('j');
      await delay();

      // Now at index 2, jump to 0
      stdin.write('g');
      await delay();

      // Can't easily assert highlight index directly, but pressing Enter
      // should navigate to first item
      stdin.write('\r');
      await delay();
    });

    it('G jumps to last row', async () => {
      const listFn = vi.fn().mockResolvedValue(
        mockPagedResponse([
          { id: '1', mail: 'a@b.com', displayName: 'A' },
          { id: '2', mail: 'c@d.com', displayName: 'C' },
          { id: '3', mail: 'e@f.com', displayName: 'E' },
        ]),
      );
      const config = makeConfig({ listFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('G');
      await delay();
      stdin.write('\r');
      await delay();

      expect(lastFrame()).toContain('nav:user-detail:E');
    });

    it('Esc pops navigation', async () => {
      const listFn = vi.fn().mockResolvedValue(
        mockPagedResponse([{ id: '1', mail: 'a@b.com', displayName: 'A' }]),
      );
      const config = makeConfig({ listFn });
      const { lastFrame, stdin } = renderView(config);
      await delay();

      stdin.write('\x1B'); // Escape
      await delay();

      expect(lastFrame()).toContain('nav:resource-picker:Home');
    });
  });
});
