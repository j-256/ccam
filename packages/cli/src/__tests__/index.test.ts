import { describe, it, expect } from 'vitest';
import { program } from '../index.js';

describe('CLI entry point', () => {
  it('exports the program', () => {
    expect(program).toBeDefined();
    expect(program.name()).toBe('ccam');
  });
});
