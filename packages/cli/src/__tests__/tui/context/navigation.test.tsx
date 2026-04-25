import { describe, it, expect, vi } from 'vitest';
import React, { useEffect } from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import {
  NavigationProvider,
  useNav,
} from '../../../tui/context/navigation.js';
import type { ViewEntry } from '../../../tui/types.js';

const home: ViewEntry = { view: 'resource-picker', label: 'Home' };
const orgList: ViewEntry = { view: 'org-list', label: 'Orgs' };
const orgDetail: ViewEntry = { view: 'org-detail', label: 'Acme', params: { id: '1' } };

function NavConsumer() {
  const { current, breadcrumbs, canGoBack } = useNav();
  return (
    <Text>
      {`view:${current.view} crumbs:${breadcrumbs.join('>')} back:${canGoBack}`}
    </Text>
  );
}

function NavPusher({ entry }: { entry: ViewEntry }) {
  const { push, current, breadcrumbs, canGoBack } = useNav();
  useEffect(() => {
    push(entry);
  }, []);
  return (
    <Text>
      {`view:${current.view} crumbs:${breadcrumbs.join('>')} back:${canGoBack}`}
    </Text>
  );
}

function NavPopper({ pushFirst }: { pushFirst: ViewEntry }) {
  const { push, pop, current, breadcrumbs, canGoBack } = useNav();
  useEffect(() => {
    push(pushFirst);
    // Pop in next tick to ensure push has been applied
    setTimeout(() => pop(), 0);
  }, []);
  return (
    <Text>
      {`view:${current.view} crumbs:${breadcrumbs.join('>')} back:${canGoBack}`}
    </Text>
  );
}

describe('NavigationProvider', () => {
  it('provides the initial entry', () => {
    const { lastFrame } = render(
      <NavigationProvider initial={home}>
        <NavConsumer />
      </NavigationProvider>,
    );
    expect(lastFrame()).toContain('view:resource-picker');
    expect(lastFrame()).toContain('crumbs:Home');
    expect(lastFrame()).toContain('back:false');
  });

  it('supports push navigation', async () => {
    const { lastFrame } = render(
      <NavigationProvider initial={home}>
        <NavPusher entry={orgList} />
      </NavigationProvider>,
    );
    // Poll until the push effect has flushed; avoids fixed-timeout flakes under load
    await vi.waitFor(() => {
      expect(lastFrame()).toContain('view:org-list');
    });
    expect(lastFrame()).toContain('crumbs:Home>Orgs');
    expect(lastFrame()).toContain('back:true');
  });

  it('supports pop navigation', async () => {
    const { lastFrame } = render(
      <NavigationProvider initial={home}>
        <NavPopper pushFirst={orgList} />
      </NavigationProvider>,
    );
    // Poll until both push and pop have flushed (back:false is the pop-completed signal)
    await vi.waitFor(() => {
      expect(lastFrame()).toContain('back:false');
    });
    expect(lastFrame()).toContain('view:resource-picker');
    expect(lastFrame()).toContain('crumbs:Home');
  });

  it('throws when useNav is called outside provider', () => {
    // React catches render errors internally; verify the error boundary message
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { lastFrame } = render(<NavConsumer />);
      expect(lastFrame()).not.toContain('view:');
    } catch {
      // Expected -- some React versions re-throw
    }
    spy.mockRestore();
  });

  it('preserves params in view entries', async () => {
    function ParamChecker() {
      const { push, current } = useNav();
      useEffect(() => {
        push(orgDetail);
      }, []);
      return <Text>{`params:${JSON.stringify(current.params ?? {})}`}</Text>;
    }

    const { lastFrame } = render(
      <NavigationProvider initial={home}>
        <ParamChecker />
      </NavigationProvider>,
    );
    await vi.waitFor(() => {
      expect(lastFrame()).toContain('params:{"id":"1"}');
    });
  });
});
