import { describe, it, expect } from 'vitest';
import { Readable, Writable } from 'node:stream';
import { promptText, promptPassword } from '../../auth/prompt.js';

function streams(inputLines: string[]) {
  const input = Readable.from(inputLines.map((l) => l + '\n').join(''));
  const chunks: string[] = [];
  const output = new Writable({
    write(chunk, _enc, cb) { chunks.push(chunk.toString()); cb(); },
  });
  return { input, output, chunks };
}

describe('promptText', () => {
  it('returns the typed value', async () => {
    const { input, output } = streams(['hello']);
    const value = await promptText({ message: 'Enter:', input, output });
    expect(value).toBe('hello');
  });

  it('returns the default when empty input is given', async () => {
    const { input, output } = streams(['']);
    const value = await promptText({ message: 'Host:', defaultValue: 'https://default', input, output });
    expect(value).toBe('https://default');
  });
});

describe('promptPassword', () => {
  it('returns the typed value without echoing to the output', async () => {
    const { input, output, chunks } = streams(['s3cret']);
    const value = await promptPassword({ message: 'Secret:', input, output });
    expect(value).toBe('s3cret');
    // No chunk should contain the literal password
    expect(chunks.join('')).not.toContain('s3cret');
  });

  it('enables and restores raw mode on a TTY input', async () => {
    const { input, output } = streams(['hunter2']);
    const tty = input as Readable & { isTTY?: boolean; isRaw?: boolean; setRawMode?: (m: boolean) => void };
    tty.isTTY = true;
    tty.isRaw = false;
    const calls: boolean[] = [];
    tty.setRawMode = (mode: boolean) => {
      calls.push(mode);
      tty.isRaw = mode;
    };
    const value = await promptPassword({ message: 'Secret:', input, output });
    expect(value).toBe('hunter2');
    expect(calls).toEqual([true, false]);
  });

  it('handles backspace by trimming the buffer', async () => {
    const input = Readable.from('abc\u007fd\n');
    const output = new Writable({ write(_c, _e, cb) { cb(); } });
    const value = await promptPassword({ message: 'Secret:', input, output });
    expect(value).toBe('abd');
  });

  it('rejects on Ctrl-C', async () => {
    const input = Readable.from('abc\u0003');
    const output = new Writable({ write(_c, _e, cb) { cb(); } });
    await expect(promptPassword({ message: 'Secret:', input, output })).rejects.toThrow('Cancelled');
  });

  it('unshifts bytes that arrived after the newline so a chained prompt can read them', async () => {
    const input = Readable.from('sec\nnext-value\n');
    const output = new Writable({ write(_c, _e, cb) { cb(); } });
    const first = await promptPassword({ message: 'Secret:', input, output });
    expect(first).toBe('sec');
    const second = await promptText({ message: 'Next:', input, output });
    expect(second).toBe('next-value');
  });
});
