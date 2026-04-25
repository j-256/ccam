import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { parseFields, parsePageSize, parseSort, addGlobalOptions, resolveGlobalOptions } from '../shared.js';

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
