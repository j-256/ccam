import { useState, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useClient } from '../context/client.js';
import { useNav } from '../context/navigation.js';
import { useLocalCollection } from '../hooks/use-local-collection.js';
import { usePaginatedResource } from '../hooks/use-paginated-resource.js';
import { useScrollWindow } from '../hooks/use-scroll-window.js';
import { useTerminalSize } from '../context/terminal-size.js';
import { Table } from './Table.js';
import { getSortableColumns, type LocalTabConfig, type PaginatedTabConfig } from '../types.js';

const BORDER_INSET = 2;

export interface SubResourceTabProps {
  tab: LocalTabConfig | PaginatedTabConfig;
  parentId: string;
}

function LocalSubResource({ tab, parentId }: { tab: LocalTabConfig; parentId: string }) {
  const client = useClient();
  const nav = useNav();
  const { cols } = useTerminalSize();
  const [highlight, setHighlight] = useState(0);

  const fetchFn = useCallback(
    () => tab.fetchFn(client, parentId),
    [client, parentId, tab],
  );

  const { data, loading, error, retry } = useLocalCollection(fetchFn);
  const sortableColumns = getSortableColumns(tab.columns, 'local');

  // Client-side sort state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const sorted = [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      return String(aVal ?? '').localeCompare(String(bVal ?? ''));
    });
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [data, sortKey, sortDir]);

  const scroll = useScrollWindow(highlight, sortedData.length);

  useInput((input, key) => {
    if (loading) return;

    if (error) {
      if (input === 'r') retry();
      return;
    }

    // Vertical movement
    if (input === 'j' || key.downArrow) {
      setHighlight((i) => Math.min(i + 1, sortedData.length - 1));
    }
    if (input === 'k' || key.upArrow) {
      setHighlight((i) => Math.max(i - 1, 0));
    }

    // Jump to first/last
    if (input === 'g') setHighlight(0);
    if (input === 'G') setHighlight(Math.max(0, sortedData.length - 1));

    // Client-side sort cycling
    if (input === 's' && sortableColumns.length > 0) {
      if (!sortKey) {
        setSortKey(sortableColumns[0].field);
        setSortDir('asc');
      } else {
        const idx = sortableColumns.findIndex((c) => c.field === sortKey);
        const nextIdx = (idx + 1) % sortableColumns.length;
        setSortKey(sortableColumns[nextIdx].field);
        setSortDir('asc');
      }
      setHighlight(0);
    }
    if (input === 'S' && sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      setHighlight(0);
    }

    // Enter: follow cross-link
    if (key.return && sortedData.length > 0 && tab.crossLinkTo) {
      const item = sortedData[highlight] as Record<string, unknown>;
      if (item) {
        const id = String(item.id ?? '');
        nav.push({
          view: tab.crossLinkTo,
          label: String(item.id ?? item.name ?? item.description ?? ''),
          params: { id },
        });
      }
    }

    // Scroll
    if (input === 'n') {
      setHighlight((i) => Math.min(i + scroll.visibleRows, sortedData.length - 1));
    }
    if (input === 'p') {
      setHighlight((i) => Math.max(i - scroll.visibleRows, 0));
    }

    // Refresh
    if (input === 'r') retry();
  });

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error.message}</Text>
        <Text dimColor>r:retry</Text>
      </Box>
    );
  }

  if (loading && data.length === 0) {
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Loading...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Table
        columns={tab.columns}
        data={sortedData as Record<string, unknown>[]}
        highlightIndex={highlight}
        visibleRows={scroll.visibleRows}
        scrollOffset={scroll.scrollOffset}
        contentWidth={cols - BORDER_INSET}
      />
      <Text dimColor>
        {sortedData.length} items
        {sortKey
          ? ` | Sort: ${sortableColumns.find((column) => column.field === sortKey)?.label ?? sortKey} ${sortDir}`
          : ''}
        {sortableColumns.length > 0 ? ' | [s:sort] [S:reverse]' : ''}
      </Text>
    </Box>
  );
}

function PaginatedSubResource({ tab, parentId }: { tab: PaginatedTabConfig; parentId: string }) {
  const client = useClient();
  const nav = useNav();
  const { cols } = useTerminalSize();
  const [highlight, setHighlight] = useState(0);

  const fetchFn = useCallback(
    (page: number, size: number) => tab.fetchFn(client, parentId, page, size),
    [client, parentId, tab],
  );

  const {
    data,
    page,
    totalPages,
    totalElements,
    loading,
    error,
    paginated,
    nextPage,
    prevPage,
    retry,
  } = usePaginatedResource(fetchFn);

  const scroll = useScrollWindow(highlight, data.length);

  useInput((input, key) => {
    if (loading) return;

    if (error) {
      if (input === 'r') retry();
      return;
    }

    // Vertical movement
    if (input === 'j' || key.downArrow) {
      setHighlight((i) => Math.min(i + 1, data.length - 1));
    }
    if (input === 'k' || key.upArrow) {
      setHighlight((i) => Math.max(i - 1, 0));
    }

    // Jump to first/last
    if (input === 'g') setHighlight(0);
    if (input === 'G') setHighlight(Math.max(0, data.length - 1));

    // Enter: follow cross-link
    if (key.return && data.length > 0 && tab.crossLinkTo) {
      const item = data[highlight] as Record<string, unknown>;
      if (item) {
        const id = String(item.id ?? '');
        nav.push({
          view: tab.crossLinkTo,
          label: String(item.id ?? item.name ?? item.description ?? ''),
          params: { id },
        });
      }
    }

    // Pagination
    if (input === 'n') {
      if (paginated) {
        nextPage();
        setHighlight(0);
      } else {
        setHighlight((i) => Math.min(i + scroll.visibleRows, data.length - 1));
      }
    }
    if (input === 'p') {
      if (paginated) {
        prevPage();
        setHighlight(0);
      } else {
        setHighlight((i) => Math.max(i - scroll.visibleRows, 0));
      }
    }

    // Refresh
    if (input === 'r') retry();
  });

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error.message}</Text>
        <Text dimColor>r:retry</Text>
      </Box>
    );
  }

  if (loading && data.length === 0) {
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Loading...</Text>
      </Box>
    );
  }

  let pageInfo: string;
  if (paginated) {
    const start = page * 25 + 1;
    const end = Math.min(start + data.length - 1, totalElements);
    pageInfo = `${start}-${end} of ${totalElements} | Page ${page + 1}/${totalPages}`;
  } else {
    pageInfo = `${totalElements} items`;
  }

  return (
    <Box flexDirection="column">
      <Table
        columns={tab.columns}
        data={data as Record<string, unknown>[]}
        highlightIndex={highlight}
        visibleRows={scroll.visibleRows}
        scrollOffset={scroll.scrollOffset}
        contentWidth={cols - BORDER_INSET}
      />
      <Text dimColor>{pageInfo}</Text>
    </Box>
  );
}

export function SubResourceTab({ tab, parentId }: SubResourceTabProps) {
  if (tab.type === 'local') {
    return <LocalSubResource tab={tab} parentId={parentId} />;
  }
  return <PaginatedSubResource tab={tab} parentId={parentId} />;
}
