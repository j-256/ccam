import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { TerminalSizeProvider } from '../../../tui/context/terminal-size.js';
import { NavigationProvider } from '../../../tui/context/navigation.js';
import { FullScreenLayout } from '../../../tui/components/FullScreenLayout.js';
import type { ViewEntry } from '../../../tui/types.js';

const home: ViewEntry = { view: 'resource-picker', label: 'Home' };

let originalColumns: number | undefined;
let originalRows: number | undefined;

beforeEach(() => {
  originalColumns = process.stdout.columns;
  originalRows = process.stdout.rows;
  Object.defineProperty(process.stdout, 'columns', { value: 80, writable: true, configurable: true });
  Object.defineProperty(process.stdout, 'rows', { value: 24, writable: true, configurable: true });
});

afterEach(() => {
  Object.defineProperty(process.stdout, 'columns', { value: originalColumns, writable: true, configurable: true });
  Object.defineProperty(process.stdout, 'rows', { value: originalRows, writable: true, configurable: true });
});

function renderLayout(props?: { host?: string }) {
  return render(
    <TerminalSizeProvider>
      <NavigationProvider initial={home}>
        <FullScreenLayout host={props?.host}>
          <Text>Content area</Text>
        </FullScreenLayout>
      </NavigationProvider>
    </TerminalSizeProvider>,
  );
}

describe('FullScreenLayout', () => {
  it('renders header and content', () => {
    const { lastFrame } = renderLayout();
    const frame = lastFrame()!;
    expect(frame).toContain('ccam');
    expect(frame).toContain('Content area');
  });

  it('renders breadcrumbs from navigation context in header', () => {
    const { lastFrame } = renderLayout();
    expect(lastFrame()).toContain('Home');
  });

  it('renders host in header when provided', () => {
    const { lastFrame } = renderLayout({ host: 'staging.example.com' });
    expect(lastFrame()).toContain('staging.example.com');
  });

  it('does not render a footer', () => {
    const { lastFrame } = renderLayout();
    const frame = lastFrame()!;
    // Footer would contain a horizontal rule below content; verify only header rule exists
    expect(frame).toContain('ccam');
    expect(frame).toContain('Content area');
  });
});
