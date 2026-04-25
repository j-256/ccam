import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import {
  TerminalSizeProvider,
  useTerminalSize,
} from '../../../tui/context/terminal-size.js';

function SizeConsumer() {
  const { cols, rows } = useTerminalSize();
  return <Text>{`${cols}x${rows}`}</Text>;
}

describe('TerminalSizeProvider', () => {
  const originalColumns = process.stdout.columns;
  const originalRows = process.stdout.rows;

  afterEach(() => {
    // Restore original values
    Object.defineProperty(process.stdout, 'columns', { value: originalColumns, writable: true, configurable: true });
    Object.defineProperty(process.stdout, 'rows', { value: originalRows, writable: true, configurable: true });
  });

  it('provides current terminal dimensions', () => {
    Object.defineProperty(process.stdout, 'columns', { value: 120, writable: true, configurable: true });
    Object.defineProperty(process.stdout, 'rows', { value: 40, writable: true, configurable: true });

    const { lastFrame } = render(
      <TerminalSizeProvider>
        <SizeConsumer />
      </TerminalSizeProvider>,
    );
    expect(lastFrame()).toContain('120x40');
  });

  it('falls back to 80x24 when stdout dimensions are unavailable', () => {
    Object.defineProperty(process.stdout, 'columns', { value: undefined, writable: true, configurable: true });
    Object.defineProperty(process.stdout, 'rows', { value: undefined, writable: true, configurable: true });

    const { lastFrame } = render(
      <TerminalSizeProvider>
        <SizeConsumer />
      </TerminalSizeProvider>,
    );
    expect(lastFrame()).toContain('80x24');
  });

  it('updates on resize events', async () => {
    Object.defineProperty(process.stdout, 'columns', { value: 100, writable: true, configurable: true });
    Object.defineProperty(process.stdout, 'rows', { value: 30, writable: true, configurable: true });

    const { lastFrame } = render(
      <TerminalSizeProvider>
        <SizeConsumer />
      </TerminalSizeProvider>,
    );
    expect(lastFrame()).toContain('100x30');

    // Simulate resize
    Object.defineProperty(process.stdout, 'columns', { value: 200, writable: true, configurable: true });
    Object.defineProperty(process.stdout, 'rows', { value: 50, writable: true, configurable: true });
    process.stdout.emit('resize');

    // Poll until the resize event has propagated through React state
    await vi.waitFor(() => {
      expect(lastFrame()).toContain('200x50');
    });
  });

  it('cleans up resize listener on unmount', () => {
    const onSpy = vi.spyOn(process.stdout, 'on');
    const offSpy = vi.spyOn(process.stdout, 'off');

    const { unmount } = render(
      <TerminalSizeProvider>
        <SizeConsumer />
      </TerminalSizeProvider>,
    );

    expect(onSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    unmount();

    expect(offSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    // Verify the same handler was registered and removed
    const registeredHandler = onSpy.mock.calls.find((c) => c[0] === 'resize')?.[1];
    const removedHandler = offSpy.mock.calls.find((c) => c[0] === 'resize')?.[1];
    expect(registeredHandler).toBe(removedHandler);

    onSpy.mockRestore();
    offSpy.mockRestore();
  });
});
