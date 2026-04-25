import type { CcamClient, ContentResponse } from '@ccam/sdk';
import type { ResourceConfig } from '../types.js';
import { formatBoolean } from '../format.js';

export const permissionsConfig: ResourceConfig = {
  name: 'permission',
  displayName: 'Permissions',
  idField: 'name',

  // -- List view --
  columns: [
    { key: 'name', label: 'Name', width: 4, color: 'white' },
    { key: 'description', label: 'Description', width: 5 },
    { key: 'adminPermission', label: 'Admin', width: 1, format: formatBoolean, priority: 5 },
  ],

  listFn: (c: CcamClient, opts) =>
    c.permissions.list({
      page: opts.page,
      size: opts.size,
    }) as unknown as Promise<ContentResponse<Record<string, unknown>>>,

  labelFn: (item) => (item.name as string) || 'Permission',

  detailFn: (c, id) => c.permissions.get(id) as unknown as Promise<Record<string, unknown>>,

  // -- Detail view --
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'adminPermission', label: 'Admin Permission', format: formatBoolean },
  ],

  tabs: [],
  crossLinks: [],
};
