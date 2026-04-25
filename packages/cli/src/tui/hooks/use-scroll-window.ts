import { useRef } from 'react';
import { useTerminalSize } from '../context/terminal-size.js';

const CHROME_LINES = 12; // header bar (3) + data-area borders (2) + section title (1) + table header+sep (2) + footer bar (4)
const MIN_VISIBLE = 5;

export interface ScrollWindow {
  scrollOffset: number;
  visibleRows: number;
  scrollInfo: string | undefined;
}

export function useScrollWindow(
  highlightIndex: number,
  totalRows: number,
  visibleRows?: number,
): ScrollWindow {
  const offsetRef = useRef(0);
  const termSize = useTerminalSize();

  const rows = visibleRows ?? Math.max(
    MIN_VISIBLE,
    termSize.rows - CHROME_LINES,
  );

  if (totalRows <= rows) {
    offsetRef.current = 0;
    return { scrollOffset: 0, visibleRows: rows, scrollInfo: undefined };
  }

  let offset = offsetRef.current;

  if (highlightIndex < offset) {
    offset = highlightIndex;
  } else if (highlightIndex >= offset + rows) {
    offset = highlightIndex - rows + 1;
  }

  offset = Math.max(0, Math.min(offset, totalRows - rows));
  offsetRef.current = offset;

  const end = Math.min(offset + rows, totalRows);

  return {
    scrollOffset: offset,
    visibleRows: rows,
    scrollInfo: `Rows ${offset + 1}-${end} of ${totalRows}`,
  };
}
