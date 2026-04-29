import { describe, it, expect } from 'vitest';
import {
  parseFilter,
  formatFilter,
  mergeTenantsForRole,
} from '../../resources/role-tenant-filter.js';

describe('parseFilter', () => {
  it('returns empty map for empty string', () => {
    const m = parseFilter('');
    expect(m.size).toBe(0);
  });

  it('parses a single-role, single-tenant entry', () => {
    const m = parseFilter('CCDX_SBX_USER:zysj_sbx');
    expect(m.size).toBe(1);
    expect([...(m.get('CCDX_SBX_USER') ?? [])]).toEqual(['zysj_sbx']);
  });

  it('parses multiple roles with multiple tenants', () => {
    const m = parseFilter('CCDX_SBX_USER:zysj_sbx;SLAS_ORGANIZATION_ADMIN:tbdx_dev,tbdx_prd');
    expect([...(m.get('CCDX_SBX_USER') ?? [])]).toEqual(['zysj_sbx']);
    expect([...(m.get('SLAS_ORGANIZATION_ADMIN') ?? [])]).toEqual(['tbdx_dev', 'tbdx_prd']);
  });

  it('ignores empty segments from trailing semicolons', () => {
    const m = parseFilter('FOO:a;');
    expect(m.size).toBe(1);
    expect([...(m.get('FOO') ?? [])]).toEqual(['a']);
  });
});

describe('formatFilter', () => {
  it('returns empty string for empty map', () => {
    expect(formatFilter(new Map())).toBe('');
  });

  it('round-trips a canonical string', () => {
    const input = 'CCDX_SBX_USER:zysj_sbx;SLAS_ORGANIZATION_ADMIN:tbdx_dev,tbdx_prd';
    expect(formatFilter(parseFilter(input))).toBe(input);
  });

  it('preserves insertion order across parse/format', () => {
    const input = 'A:x;B:y;C:z';
    expect(formatFilter(parseFilter(input))).toBe(input);
  });
});

describe('mergeTenantsForRole', () => {
  it('adds a new role entry when role is missing', () => {
    const { filter, changed } = mergeTenantsForRole('', 'FOO', ['a', 'b']);
    expect(filter).toBe('FOO:a,b');
    expect(changed).toBe(true);
  });

  it('appends tenants that are not already present (union)', () => {
    const { filter, changed } = mergeTenantsForRole('FOO:a', 'FOO', ['b']);
    expect(filter).toBe('FOO:a,b');
    expect(changed).toBe(true);
  });

  it('returns changed=false when all requested tenants are already present', () => {
    const { filter, changed } = mergeTenantsForRole('FOO:a,b', 'FOO', ['a']);
    expect(filter).toBe('FOO:a,b');
    expect(changed).toBe(false);
  });

  it('returns changed=false when exact match', () => {
    const { filter, changed } = mergeTenantsForRole('FOO:a,b', 'FOO', ['a', 'b']);
    expect(filter).toBe('FOO:a,b');
    expect(changed).toBe(false);
  });

  it('mixes new and existing tenants correctly', () => {
    const { filter, changed } = mergeTenantsForRole('FOO:a,b;BAR:x', 'FOO', ['b', 'c']);
    expect(filter).toBe('FOO:a,b,c;BAR:x');
    expect(changed).toBe(true);
  });

  it('deduplicates tenants in the input list', () => {
    const { filter, changed } = mergeTenantsForRole('', 'FOO', ['a', 'a', 'b']);
    expect(filter).toBe('FOO:a,b');
    expect(changed).toBe(true);
  });

  it('returns changed=false and unchanged filter when tenants is empty and role entry exists', () => {
    const { filter, changed } = mergeTenantsForRole('FOO:a', 'FOO', []);
    expect(filter).toBe('FOO:a');
    expect(changed).toBe(false);
  });
});
