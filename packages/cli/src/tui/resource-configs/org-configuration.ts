import type { CcamClient, ContentResponse } from '@ccam/sdk';
import type { ResourceConfig } from '../types.js';
import { formatArray } from '../format.js';

export const orgConfigurationConfig: ResourceConfig = {
  name: 'org-configuration',
  displayName: 'Org Configuration',
  idField: 'id',

  // -- List view (singleton -- wraps single item in ContentResponse shape) --
  columns: [
    { key: 'allowedSfMyDomainSuffixes', label: 'Allowed SF My Domain Suffixes', width: 5, format: formatArray },
  ],

  listFn: (c: CcamClient) =>
    c.organizationConfiguration.get().then(
      (config) =>
        ({
          content: [{ id: 'organization-configuration', ...config } as Record<string, unknown>],
          links: [],
        }) as ContentResponse<Record<string, unknown>>,
    ),

  labelFn: () => 'Org Configuration',

  detailFn: (c) =>
    c.organizationConfiguration.get() as unknown as Promise<Record<string, unknown>>,

  // -- Detail view --
  fields: [
    { key: 'allowedSfMyDomainSuffixes', label: 'Allowed SF My Domain Suffixes', format: formatArray },
  ],

  tabs: [],
  crossLinks: [],
};
