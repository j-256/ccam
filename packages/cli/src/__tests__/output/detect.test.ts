import { describe, it, expect } from 'vitest';
import { resolveFormat } from '../../output/detect.js';

describe('resolveFormat', () => {
  it('returns explicit format when provided', () => {
    expect(resolveFormat('json', true)).toBe('json');
    expect(resolveFormat('json', false)).toBe('json');
    expect(resolveFormat('table', true)).toBe('table');
    expect(resolveFormat('table', false)).toBe('table');
    expect(resolveFormat('csv', true)).toBe('csv');
    expect(resolveFormat('yaml', false)).toBe('yaml');
  });

  it('returns table when TTY and no explicit format', () => {
    expect(resolveFormat(undefined, true)).toBe('table');
  });

  it('returns json when not TTY and no explicit format', () => {
    expect(resolveFormat(undefined, false)).toBe('json');
  });
});
