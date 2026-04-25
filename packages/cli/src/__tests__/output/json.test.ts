import { describe, it, expect } from 'vitest';
import { formatJson } from '../../output/json.js';

describe('formatJson', () => {
  it('formats array with pretty print', () => {
    const data = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
    const result = formatJson(data);
    expect(result).toBe(JSON.stringify(data, null, 2));
    expect(result).toContain('[\n');
    expect(result).toContain('  {\n');
    expect(result).toContain('    "id": 1,\n');
  });

  it('formats single object with pretty print', () => {
    const data = { id: 1, name: 'Alice', email: 'alice@example.com' };
    const result = formatJson(data);
    expect(result).toBe(JSON.stringify(data, null, 2));
    expect(result).toContain('{\n');
    expect(result).toContain('  "id": 1,\n');
  });

  it('applies field selection to array', () => {
    const data = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];
    const result = formatJson(data, ['id', 'name']);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
    expect(result).not.toContain('email');
  });

  it('applies field selection to single object', () => {
    const data = { id: 1, name: 'Alice', email: 'alice@example.com' };
    const result = formatJson(data, ['id', 'name']);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ id: 1, name: 'Alice' });
    expect(result).not.toContain('email');
  });

  it('handles empty field selection', () => {
    const data = { id: 1, name: 'Alice' };
    const result = formatJson(data, []);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({});
  });

  it('handles fields that do not exist', () => {
    const data = { id: 1, name: 'Alice' };
    const result = formatJson(data, ['id', 'nonexistent']);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ id: 1 });
  });

  it('handles null and undefined values', () => {
    const data = { id: 1, name: null, email: undefined };
    const result = formatJson(data);
    expect(result).toContain('"name": null');
    expect(result).not.toContain('email'); // undefined is not serialized
  });
});
