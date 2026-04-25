import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { NavigationProvider, useNav } from '../../../tui/context/navigation.js';
import { ResourcePicker, RESOURCES } from '../../../tui/components/ResourcePicker.js';
import type { ViewEntry } from '../../../tui/types.js';
import { delay } from '../helpers.js';

const home: ViewEntry = { view: 'resource-picker', label: 'Home' };

// Renders the current navigation view so tests can verify push() calls
function NavState() {
  const { current } = useNav();
  return <Text>{`nav:${current.view}:${current.label}`}</Text>;
}

function renderPicker() {
  return render(
    <NavigationProvider initial={home}>
      <ResourcePicker />
      <NavState />
    </NavigationProvider>,
  );
}

describe('ResourcePicker', () => {
  it('renders the title', () => {
    const { lastFrame } = renderPicker();
    expect(lastFrame()).toContain('Select a resource');
  });

  it('renders all 9 resource types', () => {
    const { lastFrame } = renderPicker();
    const frame = lastFrame()!;
    expect(frame).toContain('Organizations');
    expect(frame).toContain('Users');
    expect(frame).toContain('API Clients');
    expect(frame).toContain('Roles');
    expect(frame).toContain('Realms');
    expect(frame).toContain('Instances');
    expect(frame).toContain('Permissions');
    expect(frame).toContain('Service Types');
    expect(frame).toContain('Organization Configuration');
  });

  it('renders descriptions', () => {
    const { lastFrame } = renderPicker();
    const frame = lastFrame()!;
    expect(frame).toContain('Customer orgs, realms, and instances');
    expect(frame).toContain('User accounts and access');
    expect(frame).toContain('OAuth2 API client credentials');
    expect(frame).toContain('Role definitions and permissions');
    expect(frame).toContain('Realm/tenant definitions');
    expect(frame).toContain('Commerce Cloud instances');
    expect(frame).toContain('Permission definitions');
    expect(frame).toContain('Service type definitions');
    expect(frame).toContain('Org-level configuration');
  });

  it('highlights the first item by default', () => {
    const { lastFrame } = renderPicker();
    expect(lastFrame()).toContain('\u25b8 Organizations');
  });

  it('moves highlight down with j', async () => {
    const { lastFrame, stdin } = renderPicker();
    stdin.write('j');
    await delay();
    expect(lastFrame()).toContain('\u25b8 Users');
  });

  it('moves highlight up with k', async () => {
    const { lastFrame, stdin } = renderPicker();
    stdin.write('j');
    await delay();
    stdin.write('j');
    await delay();
    stdin.write('k');
    await delay();
    expect(lastFrame()).toContain('\u25b8 Users');
  });

  it('clamps at the top', async () => {
    const { lastFrame, stdin } = renderPicker();
    stdin.write('k');
    await delay();
    stdin.write('k');
    await delay();
    expect(lastFrame()).toContain('\u25b8 Organizations');
  });

  it('clamps at the bottom', async () => {
    const { lastFrame, stdin } = renderPicker();
    for (let i = 0; i < RESOURCES.length + 5; i++) {
      stdin.write('j');
      await delay();
    }
    expect(lastFrame()).toContain('\u25b8 Organization Configuration');
  });

  it('exports RESOURCES with 9 entries', () => {
    expect(RESOURCES).toHaveLength(9);
  });

  it('has correct view entries for all resources', () => {
    expect(RESOURCES[0].entry).toEqual({ view: 'org-list', label: 'Organizations' });
    expect(RESOURCES[1].entry).toEqual({ view: 'user-list', label: 'Users' });
    expect(RESOURCES[2].entry).toEqual({ view: 'client-list', label: 'API Clients' });
    expect(RESOURCES[3].entry).toEqual({ view: 'role-list', label: 'Roles' });
    expect(RESOURCES[4].entry).toEqual({ view: 'realm-list', label: 'Realms' });
    expect(RESOURCES[5].entry).toEqual({ view: 'instance-list', label: 'Instances' });
    expect(RESOURCES[6].entry).toEqual({ view: 'permission-list', label: 'Permissions' });
    expect(RESOURCES[7].entry).toEqual({ view: 'service-type-list', label: 'Service Types' });
    expect(RESOURCES[8].entry).toEqual({ view: 'org-config-detail', label: 'Org Configuration' });
  });
});

describe('ResourcePicker navigation push', () => {
  it('pushes org-list on Enter from first item', async () => {
    const { lastFrame, stdin } = renderPicker();
    stdin.write('\r');
    await delay();
    expect(lastFrame()).toContain('nav:org-list:Organizations');
  });

  it('pushes user-list after navigating down once', async () => {
    const { lastFrame, stdin } = renderPicker();
    stdin.write('j');
    await delay();
    stdin.write('\r');
    await delay();
    expect(lastFrame()).toContain('nav:user-list:Users');
  });

  it('pushes client-list for API Clients', async () => {
    const { lastFrame, stdin } = renderPicker();
    stdin.write('j');
    await delay();
    stdin.write('j');
    await delay();
    stdin.write('\r');
    await delay();
    expect(lastFrame()).toContain('nav:client-list:API Clients');
  });

  it('pushes org-config-detail for last item', async () => {
    const { lastFrame, stdin } = renderPicker();
    for (let i = 0; i < RESOURCES.length - 1; i++) {
      stdin.write('j');
      await delay();
    }
    stdin.write('\r');
    await delay();
    expect(lastFrame()).toContain('nav:org-config-detail:Org Configuration');
  });
});
