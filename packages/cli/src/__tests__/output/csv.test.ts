import { describe, it, expect } from 'vitest';
import { formatCsv, formatTsv } from '../../output/csv.js';

describe('formatCsv', () => {
  it('formats array with header', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const result = formatCsv(data);
    expect(result).toBe('id,name\n1,Alice\n2,Bob');
  });

  it('quotes fields containing commas', () => {
    const data = [{ name: 'Smith, John', age: 30 }];
    const result = formatCsv(data);
    expect(result).toContain('"Smith, John"');
  });

  it('quotes fields containing double quotes and escapes them', () => {
    const data = [{ message: 'He said "hello"' }];
    const result = formatCsv(data);
    expect(result).toContain('"He said ""hello"""');
  });

  it('quotes fields containing newlines', () => {
    const data = [{ text: 'line1\nline2' }];
    const result = formatCsv(data);
    expect(result).toContain('"line1\nline2"');
  });

  it('applies field selection', () => {
    const data = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];
    const result = formatCsv(data, ['id', 'name']);
    expect(result).toBe('id,name\n1,Alice\n2,Bob');
    expect(result).not.toContain('email');
  });

  it('handles null and undefined as empty strings', () => {
    const data = [
      { id: 1, name: null },
      { id: 2, name: undefined },
    ];
    const result = formatCsv(data);
    expect(result).toBe('id,name\n1,\n2,');
  });

  it('joins array values with semicolons', () => {
    const data = [{ tags: ['foo', 'bar', 'baz'] }];
    const result = formatCsv(data);
    expect(result).toBe('tags\nfoo;bar;baz');
  });

  it('stringifies object values', () => {
    const data = [{ metadata: { key: 'value' } }];
    const result = formatCsv(data);
    // JSON string is quoted and double quotes are escaped
    expect(result).toContain('"{""key"":""value""}"');
  });

  it('handles single object', () => {
    const data = { id: 1, name: 'Alice' };
    const result = formatCsv(data);
    expect(result).toBe('id,name\n1,Alice');
  });

  it('returns empty string for empty array', () => {
    const result = formatCsv([]);
    expect(result).toBe('');
  });
});

describe('formatTsv', () => {
  it('formats array with tab separator', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const result = formatTsv(data);
    expect(result).toBe('id\tname\n1\tAlice\n2\tBob');
  });

  it('does not quote fields with tabs', () => {
    const data = [{ name: 'Smith\tJohn' }];
    const result = formatTsv(data);
    expect(result).not.toContain('"');
    expect(result).toBe('name\nSmith\tJohn');
  });

  it('applies field selection', () => {
    const data = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];
    const result = formatTsv(data, ['id', 'name']);
    expect(result).toBe('id\tname\n1\tAlice\n2\tBob');
  });

  it('handles null and undefined as empty strings', () => {
    const data = [
      { id: 1, name: null },
      { id: 2, name: undefined },
    ];
    const result = formatTsv(data);
    expect(result).toBe('id\tname\n1\t\n2\t');
  });
});
