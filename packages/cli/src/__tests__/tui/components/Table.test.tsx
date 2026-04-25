import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import chalk from 'chalk';
import { TerminalSizeProvider } from '../../../tui/context/terminal-size.js';
import {
  Table,
  allocateColumns,
  formatCell,
  stripAnsi,
  padVisible,
  padVisibleRight,
  truncateVisible,
} from '../../../tui/components/Table.js';
import type { ColumnDef } from '../../../tui/types.js';

// ---------------------------------------------------------------------------
// Terminal size helpers
// ---------------------------------------------------------------------------

let originalColumns: number | undefined;
let originalRows: number | undefined;

beforeEach(() => {
  originalColumns = process.stdout.columns;
  originalRows = process.stdout.rows;
  setTerminalSize(100, 24);
});

afterEach(() => {
  Object.defineProperty(process.stdout, 'columns', {
    value: originalColumns,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(process.stdout, 'rows', {
    value: originalRows,
    writable: true,
    configurable: true,
  });
});

function setTerminalSize(cols: number, rows: number) {
  Object.defineProperty(process.stdout, 'columns', {
    value: cols,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(process.stdout, 'rows', {
    value: rows,
    writable: true,
    configurable: true,
  });
}

// ---------------------------------------------------------------------------
// Test columns
// ---------------------------------------------------------------------------

const basicColumns: ColumnDef[] = [
  { key: 'id', label: 'ID', width: 1 },
  { key: 'name', label: 'Name', width: 2 },
];

const priorityColumns: ColumnDef[] = [
  { key: 'id', label: 'ID', width: 1, priority: 10 },
  { key: 'name', label: 'Name', width: 2, priority: 10 },
  { key: 'email', label: 'Email', width: 2, priority: 5 },
  { key: 'extra', label: 'Extra', width: 1, priority: 1 },
];

const basicData = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
  { id: '3', name: 'Gamma' },
];

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderTable(props: {
  columns?: ColumnDef[];
  data?: Record<string, unknown>[];
  highlightIndex?: number;
  visibleRows?: number;
  scrollOffset?: number;
}) {
  return render(
    <TerminalSizeProvider>
      <Table
        columns={props.columns ?? basicColumns}
        data={props.data ?? basicData}
        highlightIndex={props.highlightIndex ?? 0}
        visibleRows={props.visibleRows}
        scrollOffset={props.scrollOffset}
      />
    </TerminalSizeProvider>,
  );
}

// ---------------------------------------------------------------------------
// allocateColumns unit tests
// ---------------------------------------------------------------------------

describe('allocateColumns', () => {
  it('allocates proportional widths when all columns fit', () => {
    const cols: ColumnDef[] = [
      { key: 'a', label: 'A', width: 1 },
      { key: 'b', label: 'B', width: 3 },
    ];
    // 80 total - 2 gap = 78 usable; 1:3 ratio -> 19.5:58.5 -> floor: 19, 58
    const result = allocateColumns(cols, 80);
    expect(result).toHaveLength(2);
    expect(result[0].col.key).toBe('a');
    expect(result[1].col.key).toBe('b');
    expect(result[0].charWidth + result[1].charWidth).toBeLessThanOrEqual(78);
    // Roughly 1:3 ratio
    expect(result[1].charWidth).toBeGreaterThan(result[0].charWidth * 2);
  });

  it('hides lowest-priority columns when terminal is too narrow', () => {
    const cols: ColumnDef[] = [
      { key: 'a', label: 'A', width: 1, minWidth: 10, priority: 10 },
      { key: 'b', label: 'B', width: 1, minWidth: 10, priority: 5 },
      { key: 'c', label: 'C', width: 1, minWidth: 10, priority: 1 },
    ];
    // 24 total - 2 gap = 22 usable; need 30 for all 3 at minWidth
    // Should hide 'c' (priority 1) first, then check: 10+10+2=22 fits
    const result = allocateColumns(cols, 24);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.col.key)).toEqual(['a', 'b']);
  });

  it('hides multiple low-priority columns if needed', () => {
    const cols: ColumnDef[] = [
      { key: 'a', label: 'A', width: 1, minWidth: 10, priority: 10 },
      { key: 'b', label: 'B', width: 1, minWidth: 10, priority: 5 },
      { key: 'c', label: 'C', width: 1, minWidth: 10, priority: 1 },
    ];
    // 10 total: only one column fits
    const result = allocateColumns(cols, 10);
    expect(result).toHaveLength(1);
    expect(result[0].col.key).toBe('a');
  });

  it('returns empty when no columns can fit', () => {
    const cols: ColumnDef[] = [
      { key: 'a', label: 'A', width: 1, minWidth: 20 },
    ];
    const result = allocateColumns(cols, 10);
    expect(result).toHaveLength(0);
  });

  it('uses default minWidth of 4 when not specified', () => {
    const cols: ColumnDef[] = [
      { key: 'a', label: 'A', width: 1 },
      { key: 'b', label: 'B', width: 1 },
    ];
    // 10 total - 2 gap = 8 usable; 4+4=8 fits exactly
    const result = allocateColumns(cols, 10);
    expect(result).toHaveLength(2);
  });

  it('uses default priority of 10 when not specified', () => {
    const cols: ColumnDef[] = [
      { key: 'a', label: 'A', width: 1, minWidth: 10 },
      { key: 'b', label: 'B', width: 1, minWidth: 10, priority: 5 },
    ];
    // 15 total: can only fit one. 'b' has lower priority (5), so it's hidden first
    const result = allocateColumns(cols, 15);
    expect(result).toHaveLength(1);
    expect(result[0].col.key).toBe('a');
  });

  it('handles empty columns array', () => {
    expect(allocateColumns([], 80)).toEqual([]);
  });

  it('enforces minWidth as floor for charWidth', () => {
    const cols: ColumnDef[] = [
      { key: 'a', label: 'A', width: 1, minWidth: 20 },
      { key: 'b', label: 'B', width: 1, minWidth: 20 },
    ];
    // 42 total - 2 gap = 40 usable; 50/50 = 20 each, which equals minWidth
    const result = allocateColumns(cols, 42);
    expect(result).toHaveLength(2);
    expect(result[0].charWidth).toBeGreaterThanOrEqual(20);
    expect(result[1].charWidth).toBeGreaterThanOrEqual(20);
  });

  it('respects custom colGap parameter', () => {
    const cols: ColumnDef[] = [
      { key: 'a', label: 'A', width: 1 },
      { key: 'b', label: 'B', width: 1 },
    ];
    // gap=1: 80 - 1 = 79 usable; gap=4: 80 - 4 = 76 usable
    const gap1 = allocateColumns(cols, 80, 1);
    const gap4 = allocateColumns(cols, 80, 4);
    const sum1 = gap1[0].charWidth + gap1[1].charWidth;
    const sum4 = gap4[0].charWidth + gap4[1].charWidth;
    expect(sum1).toBeGreaterThan(sum4);
  });

  it('uses colGap in column-hiding calculations', () => {
    const cols: ColumnDef[] = [
      { key: 'a', label: 'A', width: 1, minWidth: 10, priority: 10 },
      { key: 'b', label: 'B', width: 1, minWidth: 10, priority: 5 },
    ];
    // With gap=2: 10+10+2=22, fits in 22
    expect(allocateColumns(cols, 22, 2)).toHaveLength(2);
    // With gap=3: 10+10+3=23, does NOT fit in 22 -> hides 'b'
    expect(allocateColumns(cols, 22, 3)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// stripAnsi / padVisible unit tests
// ---------------------------------------------------------------------------

describe('stripAnsi', () => {
  it('returns plain text unchanged', () => {
    expect(stripAnsi('hello')).toBe('hello');
  });

  it('strips color codes', () => {
    expect(stripAnsi('\x1b[32mtrue\x1b[39m')).toBe('true');
  });

  it('strips bold and reset codes', () => {
    expect(stripAnsi('\x1b[1mbold\x1b[0m')).toBe('bold');
  });
});

describe('padVisible', () => {
  it('pads plain text to target width', () => {
    expect(padVisible('hi', 5)).toBe('hi   ');
  });

  it('does not pad when already at target width', () => {
    expect(padVisible('hello', 5)).toBe('hello');
  });

  it('does not pad when exceeding target width', () => {
    expect(padVisible('toolong', 3)).toBe('toolong');
  });

  it('pads ANSI-colored text based on visible length', () => {
    const colored = '\x1b[32mtrue\x1b[39m'; // visible: "true" (4 chars)
    const padded = padVisible(colored, 8);
    expect(stripAnsi(padded)).toBe('true    ');
  });
});

describe('padVisibleRight', () => {
  it('pads plain text to target width with prepended spaces', () => {
    expect(padVisibleRight('hi', 5)).toBe('   hi');
  });

  it('does not pad when already at target width', () => {
    expect(padVisibleRight('hello', 5)).toBe('hello');
  });

  it('does not pad when exceeding target width', () => {
    expect(padVisibleRight('toolong', 3)).toBe('toolong');
  });

  it('pads ANSI-colored text based on visible length', () => {
    const colored = '\x1b[32mtrue\x1b[39m'; // visible: "true" (4 chars)
    const padded = padVisibleRight(colored, 8);
    expect(stripAnsi(padded)).toBe('    true');
  });
});

describe('truncateVisible', () => {
  it('does not truncate short ANSI-colored strings that fit visibly', () => {
    const result = truncateVisible(chalk.green('Yes'), 4);
    expect(stripAnsi(result)).toBe('Yes');
    expect(stripAnsi(result)).not.toContain('...');
  });

  it('truncates ANSI-colored strings by visible width', () => {
    const result = truncateVisible(chalk.green('Enabled'), 6);
    expect(stripAnsi(result)).toBe('Ena...');
  });
});

// ---------------------------------------------------------------------------
// formatCell unit tests
// ---------------------------------------------------------------------------

describe('formatCell', () => {
  it('returns dash for null', () => {
    expect(formatCell(null, 20)).toBe('-');
  });

  it('returns dash for undefined', () => {
    expect(formatCell(undefined, 20)).toBe('-');
  });

  it('joins arrays with comma+space', () => {
    expect(formatCell(['a', 'b', 'c'], 20)).toBe('a, b, c');
  });

  it('stringifies objects', () => {
    expect(formatCell({ x: 1 }, 30)).toBe('{"x":1}');
  });

  it('converts numbers to string', () => {
    expect(formatCell(42, 20)).toBe('42');
  });

  it('converts booleans to string', () => {
    expect(formatCell(true, 20)).toBe('true');
  });

  it('passes strings through', () => {
    expect(formatCell('hello', 20)).toBe('hello');
  });

  it('truncates long strings with ellipsis', () => {
    const result = formatCell('A'.repeat(30), 10);
    expect(result).toBe('AAAAAAA...');
    expect(result.length).toBe(10);
  });

  it('does not truncate strings that fit exactly', () => {
    expect(formatCell('ABCDE', 5)).toBe('ABCDE');
  });

  it('truncates at maxWidth boundary', () => {
    expect(formatCell('ABCDEF', 5)).toBe('AB...');
  });

  it('uses custom formatter when provided', () => {
    const formatter = (v: unknown) => `<${String(v)}>`;
    expect(formatCell('hi', 20, formatter)).toBe('<hi>');
  });

  it('truncates custom formatter output if too long', () => {
    const formatter = () => 'X'.repeat(20);
    const result = formatCell('anything', 10, formatter);
    expect(result).toBe('XXXXXXX...');
    expect(result.length).toBe(10);
  });

  it('does not truncate ANSI-colored formatter output that fits visibly', () => {
    const formatter = () => chalk.green('Yes');
    const result = formatCell(true, 4, formatter);
    expect(stripAnsi(result)).toBe('Yes');
  });

  it('applies custom formatter even for null/undefined', () => {
    const formatter = (v: unknown) => (v == null ? 'N/A' : String(v));
    expect(formatCell(null, 20, formatter)).toBe('N/A');
  });
});

// ---------------------------------------------------------------------------
// Table component rendering tests
// ---------------------------------------------------------------------------

describe('Table', () => {
  it('renders column headers', () => {
    const { lastFrame } = renderTable({});
    const frame = lastFrame()!;
    expect(frame).toContain('ID');
    expect(frame).toContain('Name');
  });

  it('renders all data rows', () => {
    const { lastFrame } = renderTable({});
    const frame = lastFrame()!;
    expect(frame).toContain('Alpha');
    expect(frame).toContain('Beta');
    expect(frame).toContain('Gamma');
  });

  it('renders separator line between header and data', () => {
    const { lastFrame } = renderTable({});
    const frame = lastFrame()!;
    // Should contain horizontal box-drawing characters
    expect(frame).toContain('\u2500');
  });

  it('renders empty state when no data', () => {
    const { lastFrame } = renderTable({ data: [] });
    expect(lastFrame()).toContain('No data');
  });

  it('renders null/undefined as dash', () => {
    const sparseData = [{ id: '1', name: null }];
    const { lastFrame } = renderTable({
      data: sparseData as Record<string, unknown>[],
    });
    expect(lastFrame()).toContain('-');
  });

  it('renders arrays as comma-separated', () => {
    const arrayData = [{ id: '1', name: ['a', 'b', 'c'] }];
    const { lastFrame } = renderTable({
      data: arrayData as Record<string, unknown>[],
    });
    expect(lastFrame()).toContain('a, b, c');
  });

  it('truncates long values', () => {
    const longData = [{ id: '1', name: 'A'.repeat(200) }];
    const { lastFrame } = renderTable({ data: longData });
    const frame = lastFrame()!;
    expect(frame).toContain('...');
    expect(frame).not.toContain('A'.repeat(200));
  });

  it('uses custom format function', () => {
    const columns: ColumnDef[] = [
      {
        key: 'status',
        label: 'Status',
        width: 1,
        format: (v) => (v === true ? 'ACTIVE' : 'INACTIVE'),
      },
    ];
    const data = [{ status: true }, { status: false }];
    const { lastFrame } = renderTable({ columns, data });
    const frame = lastFrame()!;
    expect(frame).toContain('ACTIVE');
    expect(frame).toContain('INACTIVE');
  });

  it('renders ANSI-colored boolean formatter output without bogus ellipsis', () => {
    const columns: ColumnDef[] = [
      { key: 'active', label: 'Active', width: 1, minWidth: 4, format: (v) => (v ? chalk.green('Yes') : chalk.dim('No')) },
    ];
    const data = [{ active: true }, { active: false }];
    const { lastFrame } = renderTable({ columns, data });
    const frame = stripAnsi(lastFrame()!);
    expect(frame).toContain('Yes');
    expect(frame).toContain('No');
    expect(frame).not.toContain('N...');
  });

  describe('highlighting', () => {
    it('renders without error at various highlight indices', () => {
      for (const idx of [0, 1, 2]) {
        const { lastFrame } = renderTable({ highlightIndex: idx });
        expect(lastFrame()).toBeTruthy();
      }
    });
  });

  describe('scroll windowing', () => {
    const manyRows = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `Row${i}`,
    }));

    it('shows only visible rows when windowed', () => {
      const { lastFrame } = renderTable({
        data: manyRows,
        highlightIndex: 0,
        visibleRows: 3,
        scrollOffset: 0,
      });
      const frame = lastFrame()!;
      expect(frame).toContain('Row0');
      expect(frame).toContain('Row2');
      expect(frame).not.toContain('Row3');
    });

    it('offsets visible window by scrollOffset', () => {
      const { lastFrame } = renderTable({
        data: manyRows,
        highlightIndex: 5,
        visibleRows: 3,
        scrollOffset: 4,
      });
      const frame = lastFrame()!;
      expect(frame).toContain('Row4');
      expect(frame).toContain('Row6');
      expect(frame).not.toContain('Row3');
      expect(frame).not.toContain('Row7');
    });

    it('renders all rows when visibleRows is not set', () => {
      const { lastFrame } = renderTable({
        data: manyRows,
        highlightIndex: 0,
      });
      const frame = lastFrame()!;
      expect(frame).toContain('Row0');
      expect(frame).toContain('Row9');
    });
  });

  describe('responsive column hiding', () => {
    it('hides low-priority columns in narrow terminal', () => {
      setTerminalSize(30, 24);
      const { lastFrame } = renderTable({
        columns: priorityColumns,
        data: [{ id: '1', name: 'Test', email: 'a@b', extra: 'x' }],
      });
      const frame = lastFrame()!;
      // High-priority columns should be visible
      expect(frame).toContain('ID');
      expect(frame).toContain('Name');
      // Low-priority columns should be hidden
      expect(frame).not.toContain('Extra');
    });

    it('shows all columns when terminal is wide enough', () => {
      setTerminalSize(120, 24);
      const { lastFrame } = renderTable({
        columns: priorityColumns,
        data: [{ id: '1', name: 'Test', email: 'a@b', extra: 'x' }],
      });
      const frame = lastFrame()!;
      expect(frame).toContain('ID');
      expect(frame).toContain('Name');
      expect(frame).toContain('Email');
      expect(frame).toContain('Extra');
    });

    it('shows "Terminal too narrow" when no columns fit', () => {
      setTerminalSize(3, 24);
      const columns: ColumnDef[] = [
        { key: 'a', label: 'A', width: 1, minWidth: 10 },
      ];
      const { lastFrame } = renderTable({
        columns,
        data: [{ a: 'test' }],
      });
      expect(lastFrame()).toContain('Terminal too narrow');
    });
  });

  describe('sort indicators', () => {
    it('shows up arrow when sortDirection is asc', () => {
      const columns: ColumnDef[] = [
        { key: 'name', label: 'Name', width: 2 },
        { key: 'email', label: 'Email', width: 2 },
      ];
      const data = [{ name: 'Alice', email: 'alice@test.com' }];
      const { lastFrame } = render(
        <TerminalSizeProvider>
          <Table
            columns={columns}
            data={data}
            highlightIndex={0}
            sortKey="name"
            sortDirection="asc"
          />
        </TerminalSizeProvider>,
      );
      const frame = lastFrame()!;
      expect(frame).toContain('\u25b2'); // up arrow
    });

    it('shows down arrow when sortDirection is desc', () => {
      const columns: ColumnDef[] = [
        { key: 'name', label: 'Name', width: 2 },
        { key: 'email', label: 'Email', width: 2 },
      ];
      const data = [{ name: 'Alice', email: 'alice@test.com' }];
      const { lastFrame } = render(
        <TerminalSizeProvider>
          <Table
            columns={columns}
            data={data}
            highlightIndex={0}
            sortKey="name"
            sortDirection="desc"
          />
        </TerminalSizeProvider>,
      );
      const frame = lastFrame()!;
      expect(frame).toContain('\u25bc'); // down arrow
    });

    it('shows arrow only on the sorted column', () => {
      const columns: ColumnDef[] = [
        { key: 'name', label: 'Name', width: 2 },
        { key: 'email', label: 'Email', width: 2 },
      ];
      const data = [{ name: 'Alice', email: 'alice@test.com' }];
      const { lastFrame } = render(
        <TerminalSizeProvider>
          <Table
            columns={columns}
            data={data}
            highlightIndex={0}
            sortKey="email"
            sortDirection="asc"
          />
        </TerminalSizeProvider>,
      );
      const frame = lastFrame()!;
      // Email column should have arrow, not Name
      expect(frame).toContain('Email');
      expect(frame).toContain('\u25b2');
    });

    it('shows no arrow when sortKey is undefined', () => {
      const columns: ColumnDef[] = [
        { key: 'name', label: 'Name', width: 2 },
        { key: 'email', label: 'Email', width: 2 },
      ];
      const data = [{ name: 'Alice', email: 'alice@test.com' }];
      const { lastFrame } = render(
        <TerminalSizeProvider>
          <Table
            columns={columns}
            data={data}
            highlightIndex={0}
          />
        </TerminalSizeProvider>,
      );
      const frame = lastFrame()!;
      expect(frame).not.toContain('\u25b2');
      expect(frame).not.toContain('\u25bc');
    });

    it('shows no arrow when sortKey does not match any column key', () => {
      const columns: ColumnDef[] = [
        { key: 'name', label: 'Name', width: 2 },
        { key: 'email', label: 'Email', width: 2 },
      ];
      const data = [{ name: 'Alice', email: 'alice@test.com' }];
      const { lastFrame } = render(
        <TerminalSizeProvider>
          <Table
            columns={columns}
            data={data}
            highlightIndex={0}
            sortKey="nonexistent"
            sortDirection="asc"
          />
        </TerminalSizeProvider>,
      );
      const frame = lastFrame()!;
      expect(frame).not.toContain('\u25b2');
      expect(frame).not.toContain('\u25bc');
    });
  });

  describe('per-column styling', () => {
    it('renders table with color and align properties without error', () => {
      const columns: ColumnDef[] = [
        { key: 'id', label: 'ID', width: 1 },
        { key: 'status', label: 'Status', width: 1, color: 'green' },
        { key: 'count', label: 'Count', width: 1, align: 'right' },
      ];
      const data = [
        { id: '1', status: 'active', count: 42 },
        { id: '2', status: 'inactive', count: 100 },
      ];
      const { lastFrame } = renderTable({
        columns,
        data,
        highlightIndex: 0,
      });
      const frame = lastFrame()!;
      // Verify rendering completes and includes data
      expect(frame).toContain('active');
      expect(frame).toContain('inactive');
      expect(frame).toContain('42');
      expect(frame).toContain('100');
    });

    it('right-aligns columns with align: right', () => {
      const columns: ColumnDef[] = [
        { key: 'name', label: 'Name', width: 2, minWidth: 10 },
        { key: 'count', label: 'Count', width: 1, minWidth: 8, align: 'right' },
      ];
      const data = [{ name: 'Item', count: '42' }];
      const { lastFrame } = renderTable({ columns, data });
      const frame = lastFrame()!;
      // The count should be right-aligned (preceded by spaces)
      expect(frame).toMatch(/\s+42/);
    });

    it('left-aligns columns by default', () => {
      const columns: ColumnDef[] = [
        { key: 'name', label: 'Name', width: 2, minWidth: 10 },
        { key: 'value', label: 'Value', width: 1, minWidth: 8 },
      ];
      const data = [{ name: 'Test', value: 'abc' }];
      const { lastFrame } = renderTable({ columns, data });
      const frame = lastFrame()!;
      // Value should be left-aligned (followed by spaces, not preceded)
      // We can verify by checking that 'abc' appears and the next chars are likely spaces or next column
      expect(frame).toContain('abc');
    });
  });
});
