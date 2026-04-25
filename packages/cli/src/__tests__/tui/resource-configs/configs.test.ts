import { describe, it, expect } from 'vitest';
import { RESOURCE_CONFIGS, getResourceConfig } from '../../../tui/resource-configs/index.js';
import { getSortableColumns } from '../../../tui/types.js';
import {
  formatUserState,
  formatBoolean,
  formatDate,
  formatArray,
  formatCount,
} from '../../../tui/format.js';

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

describe('format helpers', () => {
  describe('formatUserState', () => {
    it('returns styled string for known states', () => {
      // chalk-styled output still contains the raw text
      expect(formatUserState('ENABLED')).toContain('ENABLED');
      expect(formatUserState('DELETED')).toContain('DELETED');
      expect(formatUserState('INITIAL')).toContain('INITIAL');
    });

    it('returns the value as-is for unknown states', () => {
      expect(formatUserState('SUSPENDED')).toBe('SUSPENDED');
    });

    it('handles null/undefined', () => {
      expect(formatUserState(null)).toBe('');
      expect(formatUserState(undefined)).toBe('');
    });
  });

  describe('formatBoolean', () => {
    it('returns styled "Yes" for true', () => {
      expect(formatBoolean(true)).toContain('Yes');
    });

    it('returns styled "No" for false', () => {
      expect(formatBoolean(false)).toContain('No');
    });

    it('treats string "true" as truthy', () => {
      expect(formatBoolean('true')).toContain('Yes');
    });

    it('treats anything else as false', () => {
      expect(formatBoolean(null)).toContain('No');
      expect(formatBoolean(0)).toContain('No');
    });
  });

  describe('formatDate', () => {
    it('truncates ISO datetime to date portion', () => {
      expect(formatDate('2026-04-14T12:30:00Z')).toBe('2026-04-14');
    });

    it('passes through plain date strings', () => {
      expect(formatDate('2026-04-14')).toBe('2026-04-14');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('formatArray', () => {
    it('joins array elements with comma', () => {
      expect(formatArray(['a', 'b', 'c'])).toBe('a, b, c');
    });

    it('returns empty string for empty array', () => {
      expect(formatArray([])).toBe('');
    });

    it('stringifies non-array values', () => {
      expect(formatArray('hello')).toBe('hello');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatArray(null)).toBe('');
      expect(formatArray(undefined)).toBe('');
    });
  });

  describe('formatCount', () => {
    it('returns array length as string', () => {
      expect(formatCount([1, 2, 3])).toBe('3');
    });

    it('returns "0" for empty array', () => {
      expect(formatCount([])).toBe('0');
    });

    it('stringifies non-array values', () => {
      expect(formatCount(42)).toBe('42');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatCount(null)).toBe('');
      expect(formatCount(undefined)).toBe('');
    });
  });
});

// ---------------------------------------------------------------------------
// Resource configs registry
// ---------------------------------------------------------------------------

describe('RESOURCE_CONFIGS', () => {
  it('contains all 9 resource configs', () => {
    const keys = Object.keys(RESOURCE_CONFIGS);
    expect(keys).toHaveLength(9);
    expect(keys).toContain('user');
    expect(keys).toContain('org');
    expect(keys).toContain('client');
    expect(keys).toContain('role');
    expect(keys).toContain('realm');
    expect(keys).toContain('instance');
    expect(keys).toContain('permission');
    expect(keys).toContain('service-type');
    expect(keys).toContain('org-configuration');
  });
});

describe('getResourceConfig', () => {
  it('returns a config for a known resource', () => {
    const config = getResourceConfig('user');
    expect(config.name).toBe('user');
    expect(config.displayName).toBe('Users');
  });

  it('throws for an unknown resource', () => {
    expect(() => getResourceConfig('nonexistent')).toThrow('Unknown resource: nonexistent');
  });
});

// ---------------------------------------------------------------------------
// Structural validation for all configs
// ---------------------------------------------------------------------------

describe('ResourceConfig structural validation', () => {
  const allConfigs = Object.values(RESOURCE_CONFIGS);

  it.each(allConfigs)('$name has required string fields', (config) => {
    expect(typeof config.name).toBe('string');
    expect(config.name.length).toBeGreaterThan(0);
    expect(typeof config.displayName).toBe('string');
    expect(config.displayName.length).toBeGreaterThan(0);
    expect(typeof config.idField).toBe('string');
    expect(config.idField.length).toBeGreaterThan(0);
  });

  it.each(allConfigs)('$name has at least one column', (config) => {
    expect(config.columns.length).toBeGreaterThan(0);
    for (const col of config.columns) {
      expect(typeof col.key).toBe('string');
      expect(typeof col.label).toBe('string');
      expect(typeof col.width).toBe('number');
      expect(col.width).toBeGreaterThan(0);
    }
  });

  it.each(allConfigs)('$name has valid listFn', (config) => {
    expect(typeof config.listFn).toBe('function');
  });

  it.each(allConfigs)('$name has valid labelFn', (config) => {
    expect(typeof config.labelFn).toBe('function');
    // labelFn should return a string even for empty input
    const label = config.labelFn({});
    expect(typeof label).toBe('string');
    expect(label.length).toBeGreaterThan(0);
  });

  it.each(allConfigs)('$name has valid fields array', (config) => {
    expect(Array.isArray(config.fields)).toBe(true);
    expect(config.fields.length).toBeGreaterThan(0);
    for (const field of config.fields) {
      expect(typeof field.key).toBe('string');
      expect(typeof field.label).toBe('string');
    }
  });

  it.each(allConfigs)('$name has valid tabs array', (config) => {
    expect(Array.isArray(config.tabs)).toBe(true);
    for (const tab of config.tabs) {
      expect(typeof tab.key).toBe('string');
      expect(typeof tab.label).toBe('string');
      expect(typeof tab.fetchFn).toBe('function');
      expect(['local', 'paginated', 'audit']).toContain(tab.type);
      expect(tab.columns.length).toBeGreaterThan(0);
    }
  });

  it.each(allConfigs)('$name has valid crossLinks array', (config) => {
    expect(Array.isArray(config.crossLinks)).toBe(true);
    for (const link of config.crossLinks) {
      expect(typeof link.field).toBe('string');
      expect(typeof link.targetView).toBe('string');
    }
  });

  it.each(allConfigs)(
    '$name sortable columns use valid sort metadata',
    (config) => {
      for (const sf of getSortableColumns(config.columns, 'remote')) {
        expect(typeof sf.key).toBe('string');
        expect(typeof sf.field).toBe('string');
        expect(sf.field.length).toBeGreaterThan(0);
        expect(typeof sf.label).toBe('string');
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Config-specific assertions
// ---------------------------------------------------------------------------

describe('users config', () => {
  const config = getResourceConfig('user');

  it('uses "id" as idField', () => {
    expect(config.idField).toBe('id');
  });

  it('derives sortable columns from visible remote-sortable fields', () => {
    const fields = getSortableColumns(config.columns, 'remote').map((s) => s.field);
    expect(fields).toHaveLength(3);
    expect(fields).toContain('email');
    expect(fields).toContain('displayName');
    expect(fields).toContain('createdAt');
  });

  it('has 6 tabs with correct types', () => {
    expect(config.tabs).toHaveLength(6);
    expect(config.tabs.map((t) => t.type)).toEqual([
      'local',
      'local',
      'local',
      'local',
      'local',
      'audit',
    ]);
  });

  it('has cross-link to org-detail', () => {
    expect(config.crossLinks).toHaveLength(1);
    expect(config.crossLinks[0].targetView).toBe('org-detail');
  });
});

describe('organizations config', () => {
  const config = getResourceConfig('org');

  it('has 4 tabs: Realms (local), Instances (local), Users (paginated), Audit (audit)', () => {
    expect(config.tabs).toHaveLength(4);
    expect(config.tabs.map((t) => t.type)).toEqual(['local', 'local', 'paginated', 'audit']);
  });

  it('only exposes visible remote-sortable columns', () => {
    const fields = getSortableColumns(config.columns, 'remote').map((s) => s.field);
    expect(fields).toEqual(['name']);
  });
});

describe('api-clients config', () => {
  const config = getResourceConfig('client');

  it('has 5 tabs with correct types', () => {
    expect(config.tabs).toHaveLength(5);
    expect(config.tabs.map((t) => t.type)).toEqual([
      'local',
      'local',
      'local',
      'local',
      'audit',
    ]);
  });

  it('keeps API Client sorting aligned with the visible columns', () => {
    const fields = getSortableColumns(config.columns, 'remote').map((s) => s.field);
    expect(fields).toEqual(['name', 'id', 'active', 'tokenEndpointAuthMethod', 'createdAt']);
  });
});

describe('roles config', () => {
  const config = getResourceConfig('role');

  it('has 1 tab: Users with Role (paginated)', () => {
    expect(config.tabs).toHaveLength(1);
    expect(config.tabs.map((t) => t.type)).toEqual(['paginated']);
  });

  it('only sorts by visible role columns', () => {
    const fields = getSortableColumns(config.columns, 'remote').map((s) => s.field);
    expect(fields).toEqual(['id', 'description', 'scope', 'targetType', 'serviceType']);
  });

  it('has cross-link to service-type-detail', () => {
    expect(config.crossLinks).toHaveLength(1);
    expect(config.crossLinks[0].targetView).toBe('service-type-detail');
  });
});

describe('realms config', () => {
  const config = getResourceConfig('realm');

  it('has cross-link to org-detail', () => {
    expect(config.crossLinks).toHaveLength(1);
    expect(config.crossLinks[0].targetView).toBe('org-detail');
    expect(config.crossLinks[0].field).toBe('organizationId');
  });

  it('has no tabs', () => {
    expect(config.tabs).toHaveLength(0);
  });

  it('only sorts by visible remote-sortable realm columns', () => {
    const fields = getSortableColumns(config.columns, 'remote').map((s) => s.field);
    expect(fields).toEqual(['id', 'organizationId']);
  });
});

describe('instances config', () => {
  const config = getResourceConfig('instance');

  it('has no remote-sortable columns', () => {
    expect(getSortableColumns(config.columns, 'remote')).toEqual([]);
  });

  it('has no tabs or cross-links', () => {
    expect(config.tabs).toHaveLength(0);
    expect(config.crossLinks).toHaveLength(0);
  });
});

describe('permissions config', () => {
  const config = getResourceConfig('permission');

  it('uses "name" as idField', () => {
    expect(config.idField).toBe('name');
  });

  it('has no remote-sortable columns', () => {
    expect(getSortableColumns(config.columns, 'remote')).toEqual([]);
  });

  it('has no tabs or cross-links', () => {
    expect(config.tabs).toHaveLength(0);
    expect(config.crossLinks).toHaveLength(0);
  });
});

describe('service-types config', () => {
  const config = getResourceConfig('service-type');

  it('has no remote-sortable columns', () => {
    expect(getSortableColumns(config.columns, 'remote')).toEqual([]);
  });

  it('has no tabs or cross-links', () => {
    expect(config.tabs).toHaveLength(0);
    expect(config.crossLinks).toHaveLength(0);
  });
});

describe('org-configuration config', () => {
  const config = getResourceConfig('org-configuration');

  it('has no remote-sortable columns', () => {
    expect(getSortableColumns(config.columns, 'remote')).toEqual([]);
  });

  it('has no tabs or cross-links', () => {
    expect(config.tabs).toHaveLength(0);
    expect(config.crossLinks).toHaveLength(0);
  });

  it('has listFn that wraps singleton in ContentResponse', () => {
    expect(typeof config.listFn).toBe('function');
  });
});
