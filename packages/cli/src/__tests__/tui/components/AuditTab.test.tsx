import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import { AuditTab } from '../../../tui/components/AuditTab.js';
import { TerminalSizeProvider } from '../../../tui/context/terminal-size.js';
import type { ContentResponse, AuditLogRecord } from 'ccam-sdk';
import { delay } from '../helpers.js';

let originalColumns: number | undefined;
let originalRows: number | undefined;

beforeEach(() => {
  originalColumns = process.stdout.columns;
  originalRows = process.stdout.rows;
  Object.defineProperty(process.stdout, 'columns', { value: 120, writable: true, configurable: true });
  Object.defineProperty(process.stdout, 'rows', { value: 30, writable: true, configurable: true });
});

afterEach(() => {
  Object.defineProperty(process.stdout, 'columns', { value: originalColumns, writable: true, configurable: true });
  Object.defineProperty(process.stdout, 'rows', { value: originalRows, writable: true, configurable: true });
});

function makeAuditRecords(count: number): AuditLogRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: `2026-04-${String(i + 1).padStart(2, '0')}T12:00:00Z`,
    authorDisplayName: `Author ${i}`,
    eventType: 'USER_LOGIN',
    eventMessage: `Event message ${i}`,
  })) as AuditLogRecord[];
}

function makeFetchFn(records: AuditLogRecord[]) {
  return vi.fn().mockResolvedValue({
    content: records,
    links: [],
  } as ContentResponse<AuditLogRecord>);
}

function renderAuditTab(fetchFn: (querySize?: number) => Promise<ContentResponse<AuditLogRecord>>) {
  return render(
    <TerminalSizeProvider>
      <AuditTab fetchFn={fetchFn} />
    </TerminalSizeProvider>,
  );
}

describe('AuditTab', () => {
  describe('data rendering', () => {
    it('shows loading state initially', async () => {
      let resolveFn: (v: unknown) => void;
      const fetchFn = vi.fn().mockReturnValue(
        new Promise((r) => { resolveFn = r; }),
      );
      const { lastFrame } = renderAuditTab(fetchFn);
      expect(lastFrame()).toContain('Loading audit log');

      resolveFn!({ content: [], links: [] });
      await delay();
    });

    it('renders audit records after loading', async () => {
      const records = makeAuditRecords(3);
      const { lastFrame } = renderAuditTab(makeFetchFn(records));
      await delay();

      expect(lastFrame()).toContain('Author 0');
      expect(lastFrame()).toContain('USER_LOGIN');
      expect(lastFrame()).toContain('Event message 0');
    });

    it('shows record count', async () => {
      const records = makeAuditRecords(5);
      const { lastFrame } = renderAuditTab(makeFetchFn(records));
      await delay();

      expect(lastFrame()).toContain('5 records');
    });

    it('shows error state', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('API timeout'));
      const { lastFrame } = renderAuditTab(fetchFn);
      await delay();

      expect(lastFrame()).toContain('Error: API timeout');
      expect(lastFrame()).toContain('r:retry');
    });

    it('retries on r from error state', async () => {
      const fetchFn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ content: makeAuditRecords(1), links: [] });
      const { lastFrame, stdin } = renderAuditTab(fetchFn);
      await delay();

      expect(lastFrame()).toContain('Error: fail');

      stdin.write('r');
      await delay();

      expect(lastFrame()).toContain('Author 0');
    });
  });

  describe('keyboard navigation', () => {
    it('navigates rows with j/k', async () => {
      const records = makeAuditRecords(5);
      const { lastFrame, stdin } = renderAuditTab(makeFetchFn(records));
      await delay();

      // Just verify no crash on navigation
      stdin.write('j');
      await delay();
      stdin.write('k');
      await delay();

      expect(lastFrame()).toContain('Author 0');
    });

    it('shows j/k navigate hint', async () => {
      const records = makeAuditRecords(2);
      const { lastFrame } = renderAuditTab(makeFetchFn(records));
      await delay();

      const frame = lastFrame();
      expect(frame).toContain('j/k');
      expect(frame).toContain('nav');
    });
  });

  describe('load more stepping', () => {
    it('calls fetchFn with initial querySize of 25', async () => {
      const fetchFn = makeFetchFn(makeAuditRecords(3));
      renderAuditTab(fetchFn);
      await delay();

      // useAuditLog calls with first step (25)
      expect(fetchFn).toHaveBeenCalledWith(25);
    });

    it('shows m:load more hint when canLoadMore', async () => {
      const fetchFn = makeFetchFn(makeAuditRecords(25));
      const { lastFrame } = renderAuditTab(fetchFn);
      await delay();

      const frame = lastFrame();
      expect(frame).toContain('m');
      expect(frame).toContain('more');
    });

    it('steps querySize on m press (25 -> 50)', async () => {
      const fetchFn = vi.fn()
        .mockResolvedValueOnce({ content: makeAuditRecords(25), links: [] })
        .mockResolvedValueOnce({ content: makeAuditRecords(50), links: [] });
      const { stdin } = renderAuditTab(fetchFn);
      await delay();

      stdin.write('m');
      await delay();

      expect(fetchFn).toHaveBeenCalledWith(50);
    });

    it('steps querySize again (50 -> 100)', async () => {
      const fetchFn = vi.fn()
        .mockResolvedValueOnce({ content: makeAuditRecords(25), links: [] })
        .mockResolvedValueOnce({ content: makeAuditRecords(50), links: [] })
        .mockResolvedValueOnce({ content: makeAuditRecords(100), links: [] });
      const { lastFrame, stdin } = renderAuditTab(fetchFn);
      await delay();

      stdin.write('m');
      await delay();
      stdin.write('m');
      await delay();

      expect(fetchFn).toHaveBeenCalledWith(100);
      // At this point needsConfirmation is true
      const frame = lastFrame();
      expect(frame).toContain('m');
      expect(frame).toContain('load all');
    });

    it('loads all on m when needsConfirmation', async () => {
      const fetchFn = vi.fn()
        .mockResolvedValueOnce({ content: makeAuditRecords(25), links: [] })
        .mockResolvedValueOnce({ content: makeAuditRecords(50), links: [] })
        .mockResolvedValueOnce({ content: makeAuditRecords(100), links: [] })
        .mockResolvedValueOnce({ content: makeAuditRecords(200), links: [] });
      const { lastFrame, stdin } = renderAuditTab(fetchFn);
      await delay();

      // Step through: 25 -> 50 -> 100 -> confirm load all
      stdin.write('m');
      await delay();
      stdin.write('m');
      await delay();

      const frame1 = lastFrame();
      expect(frame1).toContain('m');
      expect(frame1).toContain('load all');

      stdin.write('m');
      await delay();

      // Should have called with undefined (load all)
      expect(fetchFn).toHaveBeenCalledWith(undefined);
      expect(lastFrame()).toContain('200 records');
    });

    it('hides load more hint after loading all', async () => {
      const fetchFn = vi.fn()
        .mockResolvedValueOnce({ content: makeAuditRecords(25), links: [] })
        .mockResolvedValueOnce({ content: makeAuditRecords(50), links: [] })
        .mockResolvedValueOnce({ content: makeAuditRecords(100), links: [] })
        .mockResolvedValueOnce({ content: makeAuditRecords(150), links: [] });
      const { lastFrame, stdin } = renderAuditTab(fetchFn);
      await delay();

      stdin.write('m');
      await delay();
      stdin.write('m');
      await delay();
      stdin.write('m');
      await delay();

      const frame = lastFrame();
      expect(frame).not.toContain('[m:more]');
      expect(frame).not.toContain('[m:load all]');
    });

    it('r resets to initial querySize', async () => {
      const fetchFn = vi.fn()
        .mockResolvedValueOnce({ content: makeAuditRecords(25), links: [] })
        .mockResolvedValueOnce({ content: makeAuditRecords(50), links: [] })
        .mockResolvedValueOnce({ content: makeAuditRecords(25), links: [] });
      const { stdin } = renderAuditTab(fetchFn);
      await delay();

      stdin.write('m');
      await delay();
      stdin.write('r');
      await delay();

      // retry resets step to 0, so should call with 25 again
      const calls = fetchFn.mock.calls;
      expect(calls[calls.length - 1][0]).toBe(25);
    });
  });
});
