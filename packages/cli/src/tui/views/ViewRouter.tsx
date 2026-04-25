import { Text } from 'ink';
import { useNav } from '../context/navigation.js';
import { ResourcePicker } from '../components/ResourcePicker.js';
import { ResourceListView } from './ResourceListView.js';
import { ResourceDetailView } from './ResourceDetailView.js';
import { getResourceConfig } from '../resource-configs/index.js';
import type { ViewType } from '../types.js';

/**
 * Extract resource name from a ViewType string.
 * Examples:
 * - 'user-list' -> 'user'
 * - 'service-type-detail' -> 'service-type'
 * - 'org-list' -> 'org'
 */
function getResourceName(viewType: ViewType): string {
  // Strip the last '-list' or '-detail' suffix
  return viewType.replace(/-(?:list|detail)$/, '');
}

export function ViewRouter() {
  const { current } = useNav();
  const { view, params } = current;

  // Special case: resource picker
  if (view === 'resource-picker') {
    return <ResourcePicker />;
  }

  // Special case: org-config-detail (singleton resource)
  if (view === 'org-config-detail') {
    const config = getResourceConfig('org-configuration');
    return <ResourceDetailView config={config} id="singleton" />;
  }

  // List views: *-list
  if (view.endsWith('-list')) {
    const resourceName = getResourceName(view);
    try {
      const config = getResourceConfig(resourceName);
      return <ResourceListView config={config} />;
    } catch (err) {
      return <Text color="red">Error: {String(err)}</Text>;
    }
  }

  // Detail views: *-detail
  if (view.endsWith('-detail')) {
    const resourceName = getResourceName(view);
    const id = params?.id;
    if (!id) {
      return <Text color="red">Error: detail view requires id param</Text>;
    }
    try {
      const config = getResourceConfig(resourceName);
      return <ResourceDetailView key={`${resourceName}-${id}`} config={config} id={id} />;
    } catch (err) {
      return <Text color="red">Error: {String(err)}</Text>;
    }
  }

  // Unknown view type
  return <Text color="red">Error: unknown view type: {view}</Text>;
}
