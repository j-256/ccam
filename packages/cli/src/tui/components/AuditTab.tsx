import { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useAuditLog } from '../hooks/use-audit-log.js';
import { useScrollWindow } from '../hooks/use-scroll-window.js';
import { useTerminalSize } from '../context/terminal-size.js';
import { Table } from './Table.js';
import { HintText } from './FooterBar.js';
import type { ColumnDef } from '../types.js';
import type { AuditLogRecord, ContentResponse } from 'ccam-sdk';

const BORDER_INSET = 2;

export interface AuditTabProps {
  fetchFn: (querySize?: number) => Promise<ContentResponse<AuditLogRecord>>;
  columns?: ColumnDef[];
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: 'timestamp', label: 'Time', width: 2 },
  { key: 'authorDisplayName', label: 'Author', width: 2 },
  { key: 'eventType', label: 'Event', width: 2 },
  { key: 'eventMessage', label: 'Message', width: 4 },
];

export function AuditTab({ fetchFn, columns }: AuditTabProps) {
  const { cols } = useTerminalSize();
  const [highlight, setHighlight] = useState(0);

  const {
    data,
    loading,
    error,
    canLoadMore,
    needsConfirmation,
    loadMore,
    confirmLoadAll,
    retry,
  } = useAuditLog(fetchFn);

  const scroll = useScrollWindow(highlight, data.length);

  const handleLoadMore = useCallback(() => {
    if (needsConfirmation) {
      confirmLoadAll();
    } else {
      loadMore();
    }
  }, [needsConfirmation, confirmLoadAll, loadMore]);

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

    // Load more
    if (input === 'm' && canLoadMore) {
      handleLoadMore();
    }

    // Scroll
    if (input === 'n') {
      setHighlight((i) => Math.min(i + scroll.visibleRows, data.length - 1));
    }
    if (input === 'p') {
      setHighlight((i) => Math.max(i - scroll.visibleRows, 0));
    }

    // Refresh (resets to initial querySize)
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
        <Text> Loading audit log...</Text>
      </Box>
    );
  }

  // Footer hints
  const hintParts: string[] = ['[j/k:nav]'];
  if (canLoadMore) {
    hintParts.push(needsConfirmation ? '[m:load all]' : '[m:more]');
  }
  hintParts.push('[r:refresh]');
  const hints = hintParts.join(' ');

  return (
    <Box flexDirection="column">
      <Table
        columns={columns ?? DEFAULT_COLUMNS}
        data={data as unknown as Record<string, unknown>[]}
        highlightIndex={highlight}
        visibleRows={scroll.visibleRows}
        scrollOffset={scroll.scrollOffset}
        contentWidth={cols - BORDER_INSET}
      />
      <Box justifyContent="space-between">
        <HintText hints={hints} />
        <Text dimColor>
          {data.length} records{loading ? ' (loading...)' : ''}
        </Text>
      </Box>
    </Box>
  );
}
