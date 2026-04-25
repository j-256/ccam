import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useNav } from '../context/navigation.js';
import type { ViewEntry } from '../types.js';

interface ResourceItem {
  label: string;
  description: string;
  entry: ViewEntry;
}

const RESOURCES: ResourceItem[] = [
  { label: 'Organizations', description: 'Customer orgs, realms, and instances', entry: { view: 'org-list', label: 'Organizations' } },
  { label: 'Users', description: 'User accounts and access', entry: { view: 'user-list', label: 'Users' } },
  { label: 'API Clients', description: 'OAuth2 API client credentials', entry: { view: 'client-list', label: 'API Clients' } },
  { label: 'Roles', description: 'Role definitions and permissions', entry: { view: 'role-list', label: 'Roles' } },
  { label: 'Realms', description: 'Realm/tenant definitions', entry: { view: 'realm-list', label: 'Realms' } },
  { label: 'Instances', description: 'Commerce Cloud instances', entry: { view: 'instance-list', label: 'Instances' } },
  { label: 'Permissions', description: 'Permission definitions', entry: { view: 'permission-list', label: 'Permissions' } },
  { label: 'Service Types', description: 'Service type definitions', entry: { view: 'service-type-list', label: 'Service Types' } },
  { label: 'Organization Configuration', description: 'Org-level configuration', entry: { view: 'org-config-detail', label: 'Org Configuration' } },
];

export { RESOURCES };

export function ResourcePicker() {
  const [index, setIndex] = useState(0);
  const nav = useNav();

  useInput((input, key) => {
    if (input === 'j' || key.downArrow) {
      setIndex((i) => Math.min(i + 1, RESOURCES.length - 1));
    }
    if (input === 'k' || key.upArrow) {
      setIndex((i) => Math.max(i - 1, 0));
    }
    if (key.return) {
      nav.push(RESOURCES[index].entry);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Select a resource</Text>
      <Box flexDirection="column" marginTop={1}>
        {RESOURCES.map((r, i) => {
          const selected = i === index;
          return (
            <Box key={r.label}>
              <Text color="yellow" bold>{selected ? '\u25b8 ' : '  '}</Text>
              <Text bold={selected} color={selected ? 'white' : 'cyan'}>{r.label}</Text>
              <Text dimColor> {r.description}</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
