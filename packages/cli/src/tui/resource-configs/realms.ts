import { RealmSortField } from 'ccam-sdk';
import type { CcamClient, PagedResponse } from 'ccam-sdk';
import type { ResourceConfig } from '../types.js';

export const realmsConfig: ResourceConfig = {
  name: 'realm',
  displayName: 'Realms',
  idField: 'id',

  // -- List view --
  columns: [
    { key: 'id', label: 'ID', width: 1, color: 'white', sort: { mode: 'remote', field: RealmSortField.ID } },
    { key: 'description', label: 'Description', width: 3 },
    { key: 'customerName', label: 'Customer', width: 3 },
    { key: 'organizationId', label: 'Organization', width: 3, priority: 5, color: 'gray', sort: { mode: 'remote', field: RealmSortField.ORGANIZATION_ID } },
  ],

  listFn: (c: CcamClient, opts) =>
    c.realms.list({
      page: opts.page,
      size: opts.size,
      sort: opts.sort ? { field: opts.sort.field, direction: opts.sort.direction } : undefined,
    }) as unknown as Promise<PagedResponse<Record<string, unknown>>>,

  labelFn: (item) => (item.id as string) || 'Realm',

  detailFn: (c, id) => c.realms.get(id) as unknown as Promise<Record<string, unknown>>,

  // -- Detail view --
  fields: [
    { key: 'id', label: 'ID', group: 'identity' },
    { key: 'description', label: 'Description', group: 'identity' },
    { key: 'customerName', label: 'Customer', group: 'identity' },
    {
      key: 'organizationId',
      label: 'Organization',
      crossLink: { field: 'organizationId', targetView: 'org-detail' },
      group: 'config',
    },
    { key: 'sfAccountId', label: 'SF Account ID', group: 'config' },
  ],

  tabs: [],

  crossLinks: [{ field: 'organizationId', targetView: 'org-detail' }],
};
