import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { NavigationProvider } from '../../../tui/context/navigation.js';
import { HeaderBar } from '../../../tui/components/HeaderBar.js';
import type { ViewEntry } from '../../../tui/types.js';

const home: ViewEntry = { view: 'resource-picker', label: 'Home' };

function renderHeaderBar(initial: ViewEntry, host?: string) {
  return render(
    <NavigationProvider initial={initial}>
      <HeaderBar host={host} />
    </NavigationProvider>,
  );
}

describe('HeaderBar', () => {
  it('renders ccam branding', () => {
    const { lastFrame } = renderHeaderBar(home);
    expect(lastFrame()).toContain('ccam');
  });

  it('renders breadcrumbs from navigation context', () => {
    const { lastFrame } = renderHeaderBar(home);
    expect(lastFrame()).toContain('Home');
  });

  it('renders host when provided', () => {
    const { lastFrame } = renderHeaderBar(home, 'account.demandware.com');
    expect(lastFrame()).toContain('account.demandware.com');
  });

  it('does not render host when not provided', () => {
    const { lastFrame } = renderHeaderBar(home);
    // Should still render without error
    expect(lastFrame()).toContain('ccam');
    expect(lastFrame()).not.toContain('account.demandware.com');
  });

  it('renders breadcrumb separator', () => {
    const { lastFrame } = renderHeaderBar(home);
    expect(lastFrame()).toContain('>');
  });
});
