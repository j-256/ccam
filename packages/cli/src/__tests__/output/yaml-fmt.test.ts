import { describe, it, expect } from 'vitest';
import { formatYaml } from '../../output/yaml-fmt.js';

describe('formatYaml', () => {
  it('formats array', () => {
    const data = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
    const result = formatYaml(data);
    expect(result).toContain('- id: 1');
    expect(result).toContain('  name: Alice');
    expect(result).toContain('- id: 2');
    expect(result).toContain('  name: Bob');
  });

  it('formats single object', () => {
    const data = { id: 1, name: 'Alice', email: 'alice@example.com' };
    const result = formatYaml(data);
    expect(result).toContain('id: 1');
    expect(result).toContain('name: Alice');
    expect(result).toContain('email: alice@example.com');
  });

  it('applies field selection to array', () => {
    const data = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];
    const result = formatYaml(data, ['id', 'name']);
    expect(result).toContain('id: 1');
    expect(result).toContain('name: Alice');
    expect(result).not.toContain('email');
  });

  it('applies field selection to single object', () => {
    const data = { id: 1, name: 'Alice', email: 'alice@example.com' };
    const result = formatYaml(data, ['id', 'name']);
    expect(result).toContain('id: 1');
    expect(result).toContain('name: Alice');
    expect(result).not.toContain('email');
  });

  it('handles null values', () => {
    const data = { id: 1, name: null };
    const result = formatYaml(data);
    expect(result).toContain('id: 1');
    expect(result).toContain('name: null');
  });
});
