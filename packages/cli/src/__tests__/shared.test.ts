import { describe, it, expect, vi, afterEach } from 'vitest';
import { Command } from 'commander';
import { parseFields, parsePageSize, parseSort, parseExpand, addGlobalOptions, resolveGlobalOptions, writePageInfoIfTable } from '../shared.js';

describe('parseFields', () => {
  it('splits comma-separated fields', () => {
    expect(parseFields('id,name,email')).toEqual(['id', 'name', 'email']);
  });

  it('trims whitespace', () => {
    expect(parseFields('id, name , email')).toEqual(['id', 'name', 'email']);
  });

  it('filters empty fields', () => {
    expect(parseFields('id,,name')).toEqual(['id', 'name']);
  });

  it('returns undefined for undefined input', () => {
    expect(parseFields(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(parseFields('')).toBeUndefined();
  });
});

describe('parsePageSize', () => {
  it('parses valid number', () => {
    expect(parsePageSize('10')).toBe(10);
    expect(parsePageSize('0')).toBe(0);
  });

  it('returns default value for undefined input', () => {
    expect(parsePageSize(undefined, 25)).toBe(25);
  });

  it('returns undefined for undefined input with no default', () => {
    expect(parsePageSize(undefined)).toBeUndefined();
  });

  it('throws for invalid number', () => {
    expect(() => parsePageSize('abc')).toThrow('Invalid number: abc');
  });

  it('throws for negative number', () => {
    expect(() => parsePageSize('-5')).toThrow('Invalid number: -5');
  });
});

describe('parseSort', () => {
  it('parses field with ascending direction', () => {
    expect(parseSort('name:asc')).toEqual({ field: 'name', direction: 'asc' });
  });

  it('parses field with descending direction', () => {
    expect(parseSort('createdAt:desc')).toEqual({ field: 'createdAt', direction: 'desc' });
  });

  it('defaults to ascending when no direction specified', () => {
    expect(parseSort('email')).toEqual({ field: 'email', direction: 'asc' });
  });

  it('returns undefined for undefined input', () => {
    expect(parseSort(undefined)).toBeUndefined();
  });

  it('throws for invalid sort direction', () => {
    expect(() => parseSort('name:invalid')).toThrow('Invalid sort direction: "invalid". Use "asc" or "desc"');
  });

  it('throws for empty field', () => {
    expect(() => parseSort(':asc')).toThrow('Invalid sort field: empty. Use "field:asc" or "field:desc"');
  });

  it('throws for empty direction after colon', () => {
    expect(() => parseSort('name:')).toThrow('Invalid sort direction: "". Use "asc" or "desc"');
  });

  it('returns undefined for empty string', () => {
    expect(parseSort('')).toBeUndefined();
  });
});

describe('parseExpand', () => {
  it('returns undefined for undefined input', () => {
    expect(parseExpand(undefined, ['a', 'b'])).toBeUndefined();
  });

  it('returns the input when it is in the allowed list', () => {
    expect(parseExpand('a', ['a', 'b'])).toBe('a');
  });

  it('throws with a helpful message for unknown values', () => {
    expect(() => parseExpand('c', ['a', 'b'])).toThrow(/Invalid --expand/);
  });

  it('throws for empty string (not in allowed list)', () => {
    expect(() => parseExpand('', ['a'])).toThrow(/Invalid --expand/);
  });
});

describe('addGlobalOptions', () => {
  it('adds all global options', () => {
    const cmd = new Command();
    addGlobalOptions(cmd);

    const options = cmd.options;
    expect(options.some((opt) => opt.long === '--format')).toBe(true);
    expect(options.some((opt) => opt.long === '--fields')).toBe(true);
    expect(options.some((opt) => opt.long === '--page')).toBe(true);
    expect(options.some((opt) => opt.long === '--size')).toBe(true);
    expect(options.some((opt) => opt.long === '--sort')).toBe(true);
    expect(options.some((opt) => opt.long === '--profile')).toBe(true);
    expect(options.some((opt) => opt.long === '--host')).toBe(true);
    expect(options.some((opt) => opt.short === '-j')).toBe(true);
  });

  it('sets default values', () => {
    const cmd = new Command();
    addGlobalOptions(cmd);

    const pageOption = cmd.options.find((opt) => opt.long === '--page');
    expect(pageOption?.defaultValue).toBe('0');

    const sizeOption = cmd.options.find((opt) => opt.long === '--size');
    expect(sizeOption?.defaultValue).toBe('25');

    const profileOption = cmd.options.find((opt) => opt.long === '--profile');
    expect(profileOption?.defaultValue).toBeUndefined();
  });
});

describe('resolveGlobalOptions', () => {
  it('resolves -j flag to json format', () => {
    const resolved = resolveGlobalOptions({ json: true });
    expect(resolved.format).toBe('json');
  });

  it('resolves explicit format', () => {
    const resolved = resolveGlobalOptions({ format: 'table' });
    expect(resolved.format).toBe('table');
  });

  it('-j flag overrides explicit format', () => {
    const resolved = resolveGlobalOptions({ format: 'table', json: true });
    expect(resolved.format).toBe('json');
  });

  it('parses fields', () => {
    const resolved = resolveGlobalOptions({ fields: 'id,name' });
    expect(resolved.fields).toEqual(['id', 'name']);
  });

  it('parses page and size', () => {
    const resolved = resolveGlobalOptions({ page: '5', size: '50' });
    expect(resolved.page).toBe(5);
    expect(resolved.size).toBe(50);
  });

  it('uses default page and size', () => {
    const resolved = resolveGlobalOptions({});
    expect(resolved.page).toBe(0);
    expect(resolved.size).toBe(25);
  });

  it('parses sort parameter', () => {
    const resolved = resolveGlobalOptions({ sort: 'name:asc' });
    expect(resolved.sort).toEqual({ field: 'name', direction: 'asc' });
  });

  it('passes through host', () => {
    const resolved = resolveGlobalOptions({ host: 'https://example.com' });
    expect(resolved.host).toBe('https://example.com');
  });

  it('leaves profile undefined when not specified so the resolver can fall through to env/active', () => {
    const resolved = resolveGlobalOptions({});
    expect(resolved.profile).toBeUndefined();
  });

  it('uses custom profile', () => {
    const resolved = resolveGlobalOptions({ profile: 'production' });
    expect(resolved.profile).toBe('production');
  });
});

describe('writePageInfoIfTable', () => {
  const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

  afterEach(() => {
    writeSpy.mockClear();
  });

  it('writes page info to stderr for table format with PagedResponse', () => {
    const result = {
      content: [{ id: 1 }, { id: 2 }],
      page: { number: 0, size: 25, totalElements: 50, totalPages: 2 },
    };
    writePageInfoIfTable('table', result);
    expect(writeSpy).toHaveBeenCalledWith('Page 1 of 2 (50 total)\n');
  });

  it('is a no-op for json format', () => {
    const result = {
      content: [{ id: 1 }],
      page: { number: 0, size: 25, totalElements: 1, totalPages: 1 },
    };
    writePageInfoIfTable('json', result);
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('is a no-op for table format with ContentResponse (no page key)', () => {
    const result = { content: [{ id: 1 }] };
    writePageInfoIfTable('table', result);
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('is a no-op for null result', () => {
    writePageInfoIfTable('table', null);
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('is a no-op for undefined result', () => {
    writePageInfoIfTable('table', undefined);
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
