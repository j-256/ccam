import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { ViewRouter } from '../../../tui/views/ViewRouter.js';
import { NavigationProvider } from '../../../tui/context/navigation.js';
import type { ViewEntry } from '../../../tui/types.js';

// Mock view components so we don't need to set up their dependency trees
vi.mock('../../../tui/components/ResourcePicker.js', () => ({
  ResourcePicker: () => <Text>ResourcePicker</Text>,
}));

vi.mock('../../../tui/views/ResourceListView.js', () => ({
  ResourceListView: ({ config }: { config: { name: string } }) => <Text>ResourceListView:{config.name}</Text>,
}));

vi.mock('../../../tui/views/ResourceDetailView.js', () => ({
  ResourceDetailView: ({ config, id }: { config: { name: string }; id: string }) => (
    <Text>
      ResourceDetailView:{config.name}:{id}
    </Text>
  ),
}));

// Helper to render ViewRouter with a specific navigation state
function renderRouter(initial: ViewEntry) {
  return render(
    <NavigationProvider initial={initial}>
      <ViewRouter />
    </NavigationProvider>,
  );
}

describe('ViewRouter', () => {
  describe('resource-picker', () => {
    it('renders ResourcePicker', () => {
      const { lastFrame } = renderRouter({
        view: 'resource-picker',
        label: 'Home',
      });
      expect(lastFrame()).toContain('ResourcePicker');
    });
  });

  describe('list views', () => {
    it('routes user-list to ResourceListView with user config', () => {
      const { lastFrame } = renderRouter({
        view: 'user-list',
        label: 'Users',
      });
      expect(lastFrame()).toContain('ResourceListView:user');
    });

    it('routes org-list to ResourceListView with org config', () => {
      const { lastFrame } = renderRouter({
        view: 'org-list',
        label: 'Organizations',
      });
      expect(lastFrame()).toContain('ResourceListView:org');
    });

    it('routes client-list to ResourceListView with client config', () => {
      const { lastFrame } = renderRouter({
        view: 'client-list',
        label: 'API Clients',
      });
      expect(lastFrame()).toContain('ResourceListView:client');
    });

    it('routes role-list to ResourceListView with role config', () => {
      const { lastFrame } = renderRouter({
        view: 'role-list',
        label: 'Roles',
      });
      expect(lastFrame()).toContain('ResourceListView:role');
    });

    it('routes realm-list to ResourceListView with realm config', () => {
      const { lastFrame } = renderRouter({
        view: 'realm-list',
        label: 'Realms',
      });
      expect(lastFrame()).toContain('ResourceListView:realm');
    });

    it('routes instance-list to ResourceListView with instance config', () => {
      const { lastFrame } = renderRouter({
        view: 'instance-list',
        label: 'Instances',
      });
      expect(lastFrame()).toContain('ResourceListView:instance');
    });

    it('routes permission-list to ResourceListView with permission config', () => {
      const { lastFrame } = renderRouter({
        view: 'permission-list',
        label: 'Permissions',
      });
      expect(lastFrame()).toContain('ResourceListView:permission');
    });

    it('routes service-type-list to ResourceListView with service-type config', () => {
      const { lastFrame } = renderRouter({
        view: 'service-type-list',
        label: 'Service Types',
      });
      expect(lastFrame()).toContain('ResourceListView:service-type');
    });
  });

  describe('detail views', () => {
    it('routes user-detail to ResourceDetailView with user config and id', () => {
      const { lastFrame } = renderRouter({
        view: 'user-detail',
        label: 'Alice',
        params: { id: '42' },
      });
      expect(lastFrame()).toContain('ResourceDetailView:user:42');
    });

    it('routes org-detail to ResourceDetailView with org config and id', () => {
      const { lastFrame } = renderRouter({
        view: 'org-detail',
        label: 'Acme Corp',
        params: { id: '99' },
      });
      expect(lastFrame()).toContain('ResourceDetailView:org:99');
    });

    it('routes client-detail to ResourceDetailView with client config and id', () => {
      const { lastFrame } = renderRouter({
        view: 'client-detail',
        label: 'API Client',
        params: { id: 'abc-123' },
      });
      expect(lastFrame()).toContain('ResourceDetailView:client:abc-123');
    });

    it('routes role-detail to ResourceDetailView with role config and id', () => {
      const { lastFrame } = renderRouter({
        view: 'role-detail',
        label: 'Admin',
        params: { id: 'role-42' },
      });
      expect(lastFrame()).toContain('ResourceDetailView:role:role-42');
    });

    it('routes realm-detail to ResourceDetailView with realm config and id', () => {
      const { lastFrame } = renderRouter({
        view: 'realm-detail',
        label: 'Production',
        params: { id: 'realm-prod' },
      });
      expect(lastFrame()).toContain('ResourceDetailView:realm:realm-prod');
    });

    it('routes instance-detail to ResourceDetailView with instance config and id', () => {
      const { lastFrame } = renderRouter({
        view: 'instance-detail',
        label: 'Instance 1',
        params: { id: 'inst-1' },
      });
      expect(lastFrame()).toContain('ResourceDetailView:instance:inst-1');
    });

    it('routes permission-detail to ResourceDetailView with permission config and id', () => {
      const { lastFrame } = renderRouter({
        view: 'permission-detail',
        label: 'Read Access',
        params: { id: 'perm-read' },
      });
      expect(lastFrame()).toContain('ResourceDetailView:permission:perm-read');
    });

    it('routes service-type-detail to ResourceDetailView with service-type config and id', () => {
      const { lastFrame } = renderRouter({
        view: 'service-type-detail',
        label: 'Service Type',
        params: { id: 'st-1' },
      });
      expect(lastFrame()).toContain('ResourceDetailView:service-type:st-1');
    });
  });

  describe('org-config-detail special case', () => {
    it('routes org-config-detail to ResourceDetailView with org-configuration config and singleton id', () => {
      const { lastFrame } = renderRouter({
        view: 'org-config-detail',
        label: 'Org Configuration',
      });
      expect(lastFrame()).toContain('ResourceDetailView:org-configuration:singleton');
    });
  });

  describe('unknown view', () => {
    it('shows error message for unknown view type', () => {
      const { lastFrame } = renderRouter({
        view: 'unknown-view' as ViewEntry['view'],
        label: 'Unknown',
      });
      expect(lastFrame()).toMatch(/unknown view/i);
      expect(lastFrame()).toContain('unknown-view');
    });
  });
});
