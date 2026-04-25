import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { OutputFormat } from '../../output/types.js';
import { renderOutput } from '../../output/index.js';

describe('renderOutput', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  const testData = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];

  beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    writeSpy.mockRestore();
  });

  it('routes to JSON formatter', () => {
    renderOutput(testData, { format: 'json' });
    expect(writeSpy).toHaveBeenCalledOnce();
    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain('"id": 1');
    expect(output).toContain('"name": "Alice"');
    expect(output).toContain('\n'); // Includes newline
  });

  it('routes to CSV formatter', () => {
    renderOutput(testData, { format: 'csv' });
    expect(writeSpy).toHaveBeenCalledOnce();
    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain('id,name');
    expect(output).toContain('1,Alice');
    expect(output).toContain('\n'); // Includes newline
  });

  it('routes to TSV formatter', () => {
    renderOutput(testData, { format: 'tsv' });
    expect(writeSpy).toHaveBeenCalledOnce();
    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain('id\tname');
    expect(output).toContain('1\tAlice');
  });

  it('routes to YAML formatter', () => {
    renderOutput(testData, { format: 'yaml' });
    expect(writeSpy).toHaveBeenCalledOnce();
    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain('- id: 1');
    expect(output).toContain('  name: Alice');
  });

  it('routes to table formatter', () => {
    renderOutput(testData, { format: 'table' });
    expect(writeSpy).toHaveBeenCalledOnce();
    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain('id');
    expect(output).toContain('name');
    expect(output).toContain('Alice');
  });

  it('passes fields to formatter', () => {
    renderOutput(testData, { format: 'json', fields: ['id'] });
    expect(writeSpy).toHaveBeenCalledOnce();
    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain('"id": 1');
    expect(output).not.toContain('name');
  });

  it('throws for unsupported format', () => {
    expect(() => {
      renderOutput(testData, { format: 'xml' as string as OutputFormat });
    }).toThrow('Unsupported format: xml');
  });

  it('appends newline to output', () => {
    renderOutput(testData, { format: 'json' });
    const output = writeSpy.mock.calls[0][0] as string;
    expect(output.endsWith('\n')).toBe(true);
  });
});
