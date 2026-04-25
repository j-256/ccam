import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import chalk from 'chalk';
import { formatTable } from '../../output/table.js';

describe('formatTable', () => {
  it('formats array as table', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const result = formatTable(data);
    expect(result).toContain('id');
    expect(result).toContain('name');
    expect(result).toContain('1');
    expect(result).toContain('Alice');
    expect(result).toContain('2');
    expect(result).toContain('Bob');
  });

  it('applies field selection', () => {
    const data = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];
    const result = formatTable(data, ['id', 'name']);
    expect(result).toContain('id');
    expect(result).toContain('name');
    expect(result).not.toContain('email');
  });

  it('returns "No results." for empty data', () => {
    const result = formatTable([]);
    expect(result).toBe('No results.');
  });

  it('truncates long values', () => {
    const longString = 'a'.repeat(100);
    const data = [{ text: longString }];
    const result = formatTable(data);
    expect(result).toContain('...');
    expect(result).not.toContain('a'.repeat(61));
  });

  it('joins array values with comma-space', () => {
    const data = [{ tags: ['foo', 'bar', 'baz'] }];
    const result = formatTable(data);
    expect(result).toContain('foo, bar, baz');
  });

  it('handles single object', () => {
    const data = { id: 1, name: 'Alice' };
    const result = formatTable(data);
    expect(result).toContain('id');
    expect(result).toContain('name');
    expect(result).toContain('1');
    expect(result).toContain('Alice');
  });

  it('shows dash for null and undefined values', () => {
    const data = [
      { id: 1, name: null },
      { id: 2, name: undefined },
    ];
    const result = formatTable(data);
    // Dash will be styled with chalk.dim, so check for dash character
    expect(result).toContain('-');
  });

  it('includes status values in output', () => {
    const data = [{ status: 'ENABLED' }];
    const result = formatTable(data);
    expect(result).toContain('ENABLED');
  });

  it('includes DELETED status in output', () => {
    const data = [{ status: 'DELETED' }];
    const result = formatTable(data);
    expect(result).toContain('DELETED');
  });

  it('includes boolean true in output', () => {
    const data = [{ active: true }];
    const result = formatTable(data);
    expect(result).toContain('true');
  });

  it('includes boolean false in output', () => {
    const data = [{ active: false }];
    const result = formatTable(data);
    expect(result).toContain('false');
  });

  describe('with chalk colors forced on', () => {
    let originalLevel: typeof chalk.level;

    beforeAll(() => {
      originalLevel = chalk.level;
      chalk.level = 1;
    });

    afterAll(() => {
      chalk.level = originalLevel;
    });

    it('wraps a short ENABLED status with a well-formed green escape pair', () => {
      // Under the new order (truncate then colorize), a short "ENABLED" produces a
      // clean '\x1b[32mENABLED\x1b[39m' pair -- the escape bytes are applied after any
      // truncation runs so they cannot be bisected by a slice() call.
      const data = [{ status: 'ENABLED' }];
      const result = formatTable(data);
      expect(result).toContain('\x1b[32mENABLED\x1b[39m');
    });

    it('does not apply status color when truncation changes the cell text', () => {
      // A long value that starts with "ENABLED_" is truncated to a non-status string,
      // so colorizeStatus should not match. This verifies the order: truncate first,
      // then decide whether to colorize based on the truncated value.
      const longValue = 'ENABLED_' + 'x'.repeat(100);
      const data = [{ status: longValue }];
      const result = formatTable(data);
      expect(result).toContain('...');
      expect(result).not.toContain('\x1b[32m');
    });
  });
});
