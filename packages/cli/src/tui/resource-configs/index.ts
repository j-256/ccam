import type { ResourceConfig } from '../types.js';
import { usersConfig } from './users.js';
import { organizationsConfig } from './organizations.js';
import { apiClientsConfig } from './api-clients.js';
import { rolesConfig } from './roles.js';
import { realmsConfig } from './realms.js';
import { instancesConfig } from './instances.js';
import { permissionsConfig } from './permissions.js';
import { serviceTypesConfig } from './service-types.js';
import { orgConfigurationConfig } from './org-configuration.js';

export const RESOURCE_CONFIGS: Record<string, ResourceConfig> = {
  user: usersConfig,
  org: organizationsConfig,
  client: apiClientsConfig,
  role: rolesConfig,
  realm: realmsConfig,
  instance: instancesConfig,
  permission: permissionsConfig,
  'service-type': serviceTypesConfig,
  'org-configuration': orgConfigurationConfig,
};

export function getResourceConfig(name: string): ResourceConfig {
  const config = RESOURCE_CONFIGS[name];
  if (!config) throw new Error(`Unknown resource: ${name}`);
  return config;
}

export {
  usersConfig,
  organizationsConfig,
  apiClientsConfig,
  rolesConfig,
  realmsConfig,
  instancesConfig,
  permissionsConfig,
  serviceTypesConfig,
  orgConfigurationConfig,
};
