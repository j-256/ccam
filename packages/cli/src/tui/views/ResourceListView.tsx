import { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useClient } from '../context/client.js';
import { useNav } from '../context/navigation.js';
import { usePaginatedResource } from '../hooks/use-paginated-resource.js';
import { useScrollWindow } from '../hooks/use-scroll-window.js';
import { useTerminalSize } from '../context/terminal-size.js';
import { Table } from '../components/Table.js';
import { FooterBar } from '../components/FooterBar.js';
import { getSortableColumns, type ResourceConfig, type ViewType } from '../types.js';

const BORDER_INSET = 2;

export interface ResourceListViewProps {
  config: ResourceConfig;
}

export function ResourceListView({ config }: ResourceListViewProps) {
  const client = useClient();
  const nav = useNav();
  const { cols } = useTerminalSize();
  const [highlight, setHighlight] = useState(0);
  const sortableColumns = getSortableColumns(config.columns, 'remote');

  const fetchFn = useCallback(
    (page: number, size: number, sort?: { field: string; direction: 'asc' | 'desc' }) =>
      config.listFn(client, { page, size, sort }),
    [client, config],
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
    currentSort,
    cycleSort,
    reverseSort,
  } = usePaginatedResource(fetchFn);

  const scroll = useScrollWindow(highlight, data.length);

  useInput((input, key) => {
    if (loading) return;

    // Error state: only retry and back
    if (error) {
      if (input === 'r') retry();
      if (key.escape) nav.pop();
      return;
    }

    // Navigation
    if (key.escape) {
      nav.pop();
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
    if (input === 'g') {
      setHighlight(0);
    }
    if (input === 'G') {
      setHighlight(Math.max(0, data.length - 1));
    }

    // Enter: drill into detail
    if (key.return && data.length > 0) {
      const item = data[highlight];
      if (item) {
        const detailView = `${config.name}-detail` as ViewType;
        nav.push({
          view: detailView,
          label: config.labelFn(item),
          params: { id: String(item[config.idField]) },
        });
      }
    }

    // Pagination / scroll
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

    // Sort
    if (input === 's' && sortableColumns.length > 0) {
      cycleSort(sortableColumns);
      setHighlight(0);
    }
    if (input === 'S') {
      reverseSort();
      setHighlight(0);
    }

    // Refresh
    if (input === 'r') {
      retry();
    }
  });

  // -- Error state --
  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error.message}</Text>
        <Text dimColor>r:retry Esc:back</Text>
      </Box>
    );
  }

  // -- Loading state --
  if (loading && data.length === 0) {
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Loading {config.displayName}...</Text>
      </Box>
    );
  }


  // -- Footer hints --
  const hintParts: string[] = ['[j/k:nav]', '[Enter:open]', '[Esc:back]'];
  if (paginated) {
    hintParts.splice(2, 0, '[n/p:page]');
  } else if (scroll.scrollInfo) {
    hintParts.splice(2, 0, '[n/p:scroll]');
  }
  if (sortableColumns.length > 0) {
    hintParts.splice(paginated || scroll.scrollInfo ? 3 : 2, 0, '[s:sort]', '[S:reverse]');
  }
  const hints = hintParts.join(' ');

  // -- Sort label --
  const sortLabel = (() => {
    if (!currentSort) return undefined;
    const match = sortableColumns.find((sf) => sf.field === currentSort.field);
    const label = match ? match.label : currentSort.field;
    return `Sort: ${label} ${currentSort.direction}`;
  })();

  // -- Stats label --
  const statsLabel = `${totalElements.toLocaleString()} ${config.displayName}`;

  // -- Page info --
  let pageInfo: string;
  if (paginated) {
    const start = page * 25 + 1;
    const end = Math.min(start + data.length - 1, totalElements);
    pageInfo = `${start}-${end} of ${totalElements} | Page ${page + 1}/${totalPages}`;
  } else {
    pageInfo = `${totalElements} results`;
  }

  return (
    <Box flexDirection="column">
      {/* Data area */}
      <Box flexDirection="column" borderStyle="single" borderColor="gray">
        {/* Section header */}
        <Box gap={2}>
          <Text color="cyan" bold>
            {config.displayName}
          </Text>
          <Text dimColor>({totalElements})</Text>
          {loading && (
            <Text color="cyan">
              <Spinner type="dots" />
            </Text>
          )}
        </Box>

        {/* Table */}
        <Table
          columns={config.columns}
          data={data}
          highlightIndex={highlight}
          visibleRows={scroll.visibleRows}
          scrollOffset={scroll.scrollOffset}
          sortKey={currentSort?.field}
          sortDirection={currentSort?.direction}
          contentWidth={cols - BORDER_INSET}
        />
      </Box>

      {/* Footer */}
      <FooterBar
        hints={hints}
        pageInfo={pageInfo}
        loading={loading}
        sortLabel={sortLabel}
        statsLabel={statsLabel}
      />
    </Box>
  );
}
