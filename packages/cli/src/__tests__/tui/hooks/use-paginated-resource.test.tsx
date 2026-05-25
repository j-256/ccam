import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { usePaginatedResource } from '../../../tui/hooks/use-paginated-resource.js';
import type { SortState } from '../../../tui/hooks/use-paginated-resource.js';
import { mockPagedResponse, delay } from '../helpers.js';
import type { PagedResponse } from 'ccam-sdk';
import type { SortFieldDef } from '../../../tui/types.js';

function Harness<T>({
  fetchFn,
  initialSort,
}: {
  fetchFn: (page: number, size: number, sort?: SortState) => Promise<PagedResponse<T>>;
  initialSort?: SortState;
}) {
  const state = usePaginatedResource(fetchFn, 25, initialSort);
  if (state.loading) return <Text>LOADING</Text>;
  if (state.error) return <Text>ERROR:{state.error.message}</Text>;
  return (
    <Text>
      DATA:{state.data.length}|PAGE:{state.page}/{state.totalPages}|SORT:
      {state.currentSort ? `${state.currentSort.field},${state.currentSort.direction}` : 'none'}
    </Text>
  );
}

// Harness that exposes sort actions via ref-style callbacks
let _sortActions: {
  setSort: (sort: SortState) => void;
  cycleSort: (fields: SortFieldDef[]) => void;
  reverseSort: () => void;
} | null = null;

function SortHarness<T>({
  fetchFn,
  initialSort,
}: {
  fetchFn: (page: number, size: number, sort?: SortState) => Promise<PagedResponse<T>>;
  initialSort?: SortState;
}) {
  const state = usePaginatedResource(fetchFn, 25, initialSort);
  _sortActions = {
    setSort: state.setSort,
    cycleSort: state.cycleSort,
    reverseSort: state.reverseSort,
  };
  if (state.loading) return <Text>LOADING</Text>;
  if (state.error) return <Text>ERROR:{state.error.message}</Text>;
  return (
    <Text>
      DATA:{state.data.length}|SORT:
      {state.currentSort ? `${state.currentSort.field},${state.currentSort.direction}` : 'none'}
    </Text>
  );
}

describe('usePaginatedResource', () => {
  it('shows loading then data', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      mockPagedResponse([{ id: '1' }, { id: '2' }], 0, 3, 75),
    );
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);

    expect(lastFrame()).toContain('LOADING');
    await delay();
    expect(lastFrame()).toContain('DATA:2');
    expect(lastFrame()).toContain('PAGE:0/3');
  });

  it('shows error on fetch failure', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('auth failed'));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);

    await delay();
    expect(lastFrame()).toContain('ERROR:auth failed');
  });

  it('fetches page 0 with default size 25 and no sort', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockPagedResponse([]));
    render(<Harness fetchFn={fetchFn} />);

    await delay();
    expect(fetchFn).toHaveBeenCalledWith(0, 25, undefined);
  });

  it('passes initial sort to first fetch', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockPagedResponse([]));
    const sort: SortState = { field: 'login', direction: 'asc' };
    render(<Harness fetchFn={fetchFn} initialSort={sort} />);

    await delay();
    expect(fetchFn).toHaveBeenCalledWith(0, 25, sort);
  });

  it('displays current sort state', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockPagedResponse([{ id: '1' }]));
    const sort: SortState = { field: 'login', direction: 'desc' };
    const { lastFrame } = render(<Harness fetchFn={fetchFn} initialSort={sort} />);

    await delay();
    expect(lastFrame()).toContain('SORT:login,desc');
  });

  it('shows SORT:none when no sort provided', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockPagedResponse([{ id: '1' }]));
    const { lastFrame } = render(<Harness fetchFn={fetchFn} />);

    await delay();
    expect(lastFrame()).toContain('SORT:none');
  });

  it('setSort resets to page 0 with new sort', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockPagedResponse([{ id: '1' }]));
    const { lastFrame } = render(<SortHarness fetchFn={fetchFn} />);
    await delay();

    fetchFn.mockClear();
    const newSort: SortState = { field: 'email', direction: 'desc' };
    _sortActions!.setSort(newSort);
    await delay();

    expect(fetchFn).toHaveBeenCalledWith(0, 25, newSort);
    expect(lastFrame()).toContain('SORT:email,desc');
  });

  it('cycleSort starts with first field ascending when no current sort', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockPagedResponse([{ id: '1' }]));
    render(<SortHarness fetchFn={fetchFn} />);
    await delay();

    fetchFn.mockClear();
    const fields: SortFieldDef[] = [
      { key: 'login', field: 'login', label: 'Login' },
      { key: 'email', field: 'email', label: 'Email' },
    ];
    _sortActions!.cycleSort(fields);
    await delay();

    expect(fetchFn).toHaveBeenCalledWith(0, 25, { field: 'login', direction: 'asc' });
  });

  it('cycleSort advances to next field', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockPagedResponse([{ id: '1' }]));
    const initial: SortState = { field: 'login', direction: 'asc' };
    render(<SortHarness fetchFn={fetchFn} initialSort={initial} />);
    await delay();

    fetchFn.mockClear();
    const fields: SortFieldDef[] = [
      { key: 'login', field: 'login', label: 'Login' },
      { key: 'email', field: 'email', label: 'Email' },
      { key: 'name', field: 'name', label: 'Name' },
    ];
    _sortActions!.cycleSort(fields);
    await delay();

    expect(fetchFn).toHaveBeenCalledWith(0, 25, { field: 'email', direction: 'asc' });
  });

  it('cycleSort wraps around to first field', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockPagedResponse([{ id: '1' }]));
    const initial: SortState = { field: 'name', direction: 'desc' };
    render(<SortHarness fetchFn={fetchFn} initialSort={initial} />);
    await delay();

    fetchFn.mockClear();
    const fields: SortFieldDef[] = [
      { key: 'login', field: 'login', label: 'Login' },
      { key: 'email', field: 'email', label: 'Email' },
      { key: 'name', field: 'name', label: 'Name' },
    ];
    _sortActions!.cycleSort(fields);
    await delay();

    expect(fetchFn).toHaveBeenCalledWith(0, 25, { field: 'login', direction: 'asc' });
  });

  it('cycleSort is no-op with empty fields array', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockPagedResponse([{ id: '1' }]));
    render(<SortHarness fetchFn={fetchFn} />);
    await delay();

    fetchFn.mockClear();
    _sortActions!.cycleSort([]);
    await delay();

    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('reverseSort flips direction', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockPagedResponse([{ id: '1' }]));
    const initial: SortState = { field: 'login', direction: 'asc' };
    const { lastFrame } = render(<SortHarness fetchFn={fetchFn} initialSort={initial} />);
    await delay();

    fetchFn.mockClear();
    _sortActions!.reverseSort();
    await delay();

    expect(fetchFn).toHaveBeenCalledWith(0, 25, { field: 'login', direction: 'desc' });
    expect(lastFrame()).toContain('SORT:login,desc');
  });

  it('reverseSort is no-op when no current sort', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockPagedResponse([{ id: '1' }]));
    render(<SortHarness fetchFn={fetchFn} />);
    await delay();

    fetchFn.mockClear();
    _sortActions!.reverseSort();
    await delay();

    expect(fetchFn).not.toHaveBeenCalled();
  });
});
