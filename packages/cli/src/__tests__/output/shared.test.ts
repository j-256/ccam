import { describe, it, expect } from 'vitest';
import { extractColumns, getNestedValue, applyFieldSelection } from '../../output/shared.js';

describe('extractColumns', () => {
  it('returns the union of top-level keys across objects', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, email: 'bob@example.com' },
    ];
    expect(extractColumns(data)).toEqual(['id', 'name', 'email']);
  });

  it('returns an empty array for an empty list', () => {
    expect(extractColumns([])).toEqual([]);
  });

  it('skips null and non-object items', () => {
    const data = [null, 42, 'string', undefined, { id: 1 }];
    expect(extractColumns(data)).toEqual(['id']);
  });
});

describe('getNestedValue', () => {
  it('returns the property value by key', () => {
    expect(getNestedValue({ id: 5, name: 'Alice' }, 'name')).toBe('Alice');
  });

  it('returns undefined for missing keys', () => {
    expect(getNestedValue({ id: 5 }, 'name')).toBeUndefined();
  });

  it('returns undefined for null and non-object inputs', () => {
    expect(getNestedValue(null, 'name')).toBeUndefined();
    expect(getNestedValue(undefined, 'name')).toBeUndefined();
    expect(getNestedValue('string', 'name')).toBeUndefined();
    expect(getNestedValue(42, 'name')).toBeUndefined();
  });
});

describe('applyFieldSelection', () => {
  it('picks fields from a single object', () => {
    const data = { id: 1, name: 'Alice', email: 'alice@example.com' };
    expect(applyFieldSelection(data, ['id', 'name'])).toEqual({ id: 1, name: 'Alice' });
  });

  it('picks fields from each item in an array', () => {
    const data = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];
    expect(applyFieldSelection(data, ['id', 'name'])).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
  });

  it('omits fields that are not present on an object', () => {
    const data = { id: 1 };
    expect(applyFieldSelection(data, ['id', 'name'])).toEqual({ id: 1 });
  });

  it('returns the value unchanged for non-object, non-array inputs', () => {
    expect(applyFieldSelection(null, ['id'])).toBeNull();
    expect(applyFieldSelection('string', ['id'])).toBe('string');
    expect(applyFieldSelection(42, ['id'])).toBe(42);
  });

  it('handles heterogeneous arrays by picking available fields per item', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, email: 'bob@example.com' },
    ];
    expect(applyFieldSelection(data, ['id', 'name'])).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2 },
    ]);
  });
});
