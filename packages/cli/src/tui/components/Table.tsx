import { Box, Text } from 'ink';
import { useTerminalSize } from '../context/terminal-size.js';
import type { ColumnDef } from '../types.js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TableProps {
  columns: ColumnDef[];
  data: Record<string, unknown>[];
  highlightIndex: number;
  visibleRows?: number;
  scrollOffset?: number;
  /** Hide the cursor marker column (used in sub-resource tabs where Enter isn't available) */
  hideCursor?: boolean;
  /** Key of currently sorted column */
  sortKey?: string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Override terminal width (e.g. when rendered inside a bordered box) */
  contentWidth?: number;
}

// ---------------------------------------------------------------------------
// ANSI-aware string helpers (exported for testing)
// ---------------------------------------------------------------------------

/** Strip ANSI escape codes to get visible length */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/** Truncate a string by visible characters while preserving ANSI styling */
export function truncateVisible(str: string, width: number): string {
  if (width < 4 || stripAnsi(str).length <= width) return str;

  const target = width - 3;
  let visible = 0;
  let i = 0;
  let out = '';
  let sawAnsi = false;

  while (i < str.length && visible < target) {
    if (str[i] === '\x1b') {
      // eslint-disable-next-line no-control-regex
      const match = /^\x1b\[[0-9;]*m/.exec(str.slice(i));
      if (match) {
        out += match[0];
        i += match[0].length;
        sawAnsi = true;
        continue;
      }
    }

    out += str[i];
    i += 1;
    visible += 1;
  }

  out += '...';

  // Close any active style so it does not bleed into the rest of the row.
  if (sawAnsi) {
    out += '\x1b[0m';
  }

  return out;
}

/** Pad string to target width based on visible characters (left-align: append spaces) */
export function padVisible(str: string, width: number): string {
  const visible = stripAnsi(str).length;
  if (visible >= width) return str;
  return str + ' '.repeat(width - visible);
}

/** Pad string to target width based on visible characters (right-align: prepend spaces) */
export function padVisibleRight(str: string, width: number): string {
  const visible = stripAnsi(str).length;
  if (visible >= width) return str;
  return ' '.repeat(width - visible) + str;
}

// ---------------------------------------------------------------------------
// Column allocation helpers (exported for testing)
// ---------------------------------------------------------------------------

const DEFAULT_MIN_WIDTH = 4;
const DEFAULT_PRIORITY = 10;

const BASE_FG = '#e6edf3';
const ROW_BG = '#0a0d12';
const ZEBRA_BG = '#10151b';

/** Pick which columns to show and compute their character widths */
export function allocateColumns(
  columns: ColumnDef[],
  terminalWidth: number,
  colGap: number = 2,
): { col: ColumnDef; charWidth: number }[] {
  if (columns.length === 0) return [];

  // Sort candidates by priority ascending (lower = hidden first)
  const candidates = columns.map((col) => ({
    col,
    minWidth: col.minWidth ?? DEFAULT_MIN_WIDTH,
    priority: col.priority ?? DEFAULT_PRIORITY,
  }));

  // Iteratively remove lowest-priority columns until the remaining fit
  const visible = [...candidates];

  while (visible.length > 0) {
    const totalGap = colGap * (visible.length - 1);
    const totalMinWidth = visible.reduce((s, c) => s + c.minWidth, 0);
    if (totalMinWidth + totalGap <= terminalWidth) break;

    // Remove the column with the lowest priority (ties: last in array)
    let worstIdx = 0;
    let worstPriority = visible[0].priority;
    for (let i = 1; i < visible.length; i++) {
      if (visible[i].priority < worstPriority) {
        worstPriority = visible[i].priority;
        worstIdx = i;
      }
    }
    visible.splice(worstIdx, 1);
  }

  if (visible.length === 0) return [];

  // Proportional allocation of remaining width
  const totalGap = colGap * (visible.length - 1);
  const availableWidth = terminalWidth - totalGap;
  const totalProportion = visible.reduce((s, c) => s + c.col.width, 0);

  return visible.map((c) => {
    const raw = Math.floor((c.col.width / totalProportion) * availableWidth);
    const charWidth = Math.max(raw, c.minWidth);
    return { col: c.col, charWidth };
  });
}

// ---------------------------------------------------------------------------
// Cell formatting
// ---------------------------------------------------------------------------

export function formatCell(
  value: unknown,
  maxWidth: number,
  formatter?: (v: unknown) => string,
): string {
  let str: string;

  if (formatter) {
    str = formatter(value);
  } else if (value === null || value === undefined) {
    str = '-';
  } else if (Array.isArray(value)) {
    str = value.join(', ');
  } else if (typeof value === 'object') {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  return truncateVisible(str, maxWidth);
}

// ---------------------------------------------------------------------------
// Table component
// ---------------------------------------------------------------------------

const CURSOR_WIDTH = 2; // "▸ " or "  "

export function Table({
  columns,
  data,
  highlightIndex,
  visibleRows,
  scrollOffset,
  hideCursor,
  sortKey,
  sortDirection,
  contentWidth,
}: TableProps) {
  const { cols } = useTerminalSize();
  const effectiveWidth = contentWidth ?? cols;

  if (data.length === 0) {
    return <Text dimColor>No data</Text>;
  }

  const showCursor = !hideCursor;
  const colGap = 1;
  const tableWidth = showCursor ? effectiveWidth - CURSOR_WIDTH : effectiveWidth;
  const allocated = allocateColumns(columns, tableWidth, colGap);

  if (allocated.length === 0) {
    return <Text dimColor>Terminal too narrow</Text>;
  }

  const offset = scrollOffset ?? 0;
  const displayData =
    visibleRows != null ? data.slice(offset, offset + visibleRows) : data;
  const adjustedHighlight = highlightIndex - offset;

  // Separator line width = sum of column widths + gaps
  const separatorWidth =
    allocated.reduce((s, a) => s + a.charWidth, 0) +
    colGap * (allocated.length - 1);
  const separator = '\u2500'.repeat(separatorWidth);

  return (
    <Box flexDirection="column">
      {/* Header row */}
      <Box>
        {showCursor && <Box width={CURSOR_WIDTH}><Text> </Text></Box>}
        {allocated.map((a, i) => {
          let label = a.col.label;
          const sortField = a.col.sort?.field;
          if (sortKey && (a.col.key === sortKey || sortField === sortKey)) {
            label += sortDirection === 'desc' ? ' \u25bc' : ' \u25b2';
          }
          return (
            <Box
              key={a.col.key}
              width={a.charWidth}
              marginRight={i < allocated.length - 1 ? colGap : 0}
            >
              <Text bold color={a.col.color ?? BASE_FG}>
                {formatCell(label, a.charWidth)}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Separator */}
      <Text dimColor>{showCursor ? '  ' + separator : separator}</Text>

      {/* Data rows */}
      {displayData.map((row, i) => {
        const isHighlighted = i === adjustedHighlight;
        const isZebra = (offset + i) % 2 === 1;

        return (
          <Box
            key={offset + i}
            width={effectiveWidth}
            backgroundColor={isZebra ? ZEBRA_BG : ROW_BG}
          >
            {showCursor && (
              <Box width={CURSOR_WIDTH}>
                <Text color={isHighlighted ? 'yellow' : undefined} bold={isHighlighted}>
                  {isHighlighted ? '\u25b8 ' : '  '}
                </Text>
              </Box>
            )}

            {allocated.map((a, j) => {
              let cellStr = formatCell(row[a.col.key], a.charWidth, a.col.format);

              // Highlighted rows force a uniform foreground so formatter ANSI
              // colors do not reduce contrast against the selection styling.
              if (isHighlighted) {
                cellStr = stripAnsi(cellStr);
              }

              cellStr = a.col.align === 'right'
                ? padVisibleRight(cellStr, a.charWidth)
                : padVisible(cellStr, a.charWidth);

              return (
                <Box
                  key={a.col.key}
                  width={a.charWidth}
                  marginRight={j < allocated.length - 1 ? colGap : 0}
                >
                  <Text
                    bold={isHighlighted || j === 0}
                    color={isHighlighted ? 'white' : (a.col.color ?? BASE_FG)}
                  >
                    {cellStr}
                  </Text>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
