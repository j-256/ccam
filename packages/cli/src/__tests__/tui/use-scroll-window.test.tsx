import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { useScrollWindow } from '../../tui/hooks/use-scroll-window.js';

function Harness({ highlight, total, visibleRows }: { highlight: number; total: number; visibleRows: number }) {
  const { scrollOffset, scrollInfo } = useScrollWindow(highlight, total, visibleRows);
  return <Text>{scrollOffset}|{scrollInfo ?? 'none'}</Text>;
}

describe('useScrollWindow', () => {
  it('returns no scroll info when data fits in window', () => {
    const { lastFrame } = render(<Harness highlight={0} total={5} visibleRows={10} />);
    expect(lastFrame()).toBe('0|none');
  });

  it('returns scroll info when data exceeds window', () => {
    const { lastFrame } = render(<Harness highlight={0} total={20} visibleRows={5} />);
    expect(lastFrame()).toBe('0|Rows 1-5 of 20');
  });

  it('shifts window down when highlight moves past bottom', () => {
    const { lastFrame, rerender } = render(
      <Harness highlight={0} total={20} visibleRows={5} />,
    );
    rerender(<Harness highlight={6} total={20} visibleRows={5} />);
    expect(lastFrame()).toBe('2|Rows 3-7 of 20');
  });

  it('shifts window up when highlight moves before top', () => {
    const { lastFrame, rerender } = render(
      <Harness highlight={10} total={20} visibleRows={5} />,
    );
    // offset is 6 (highlight 10 at bottom of [6..10])
    rerender(<Harness highlight={3} total={20} visibleRows={5} />);
    expect(lastFrame()).toBe('3|Rows 4-8 of 20');
  });

  it('clamps offset at end of data', () => {
    const { lastFrame } = render(<Harness highlight={19} total={20} visibleRows={5} />);
    expect(lastFrame()).toBe('15|Rows 16-20 of 20');
  });

  it('keeps window stable when highlight stays within', () => {
    const { lastFrame, rerender } = render(
      <Harness highlight={0} total={20} visibleRows={5} />,
    );
    // Move highlight to 3 -- still inside window [0..4]
    rerender(<Harness highlight={3} total={20} visibleRows={5} />);
    expect(lastFrame()).toBe('0|Rows 1-5 of 20');
  });

  it('resets offset when data shrinks to fit window', () => {
    const { lastFrame, rerender } = render(
      <Harness highlight={10} total={20} visibleRows={5} />,
    );
    // offset is 6. Now total drops to 3 (fits in window)
    rerender(<Harness highlight={0} total={3} visibleRows={5} />);
    expect(lastFrame()).toBe('0|none');
  });
});
