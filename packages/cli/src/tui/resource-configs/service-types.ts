import type { CcamClient, PagedResponse } from 'ccam-sdk';
import type { ResourceConfig } from '../types.js';

export const serviceTypesConfig: ResourceConfig = {
  name: 'service-type',
  displayName: 'Service Types',
  idField: 'id',

  // -- List view --
  columns: [
    { key: 'id', label: 'ID', width: 1, color: 'white' },
    { key: 'description', label: 'Description', width: 5 },
  ],

  listFn: (c: CcamClient, opts) =>
    c.serviceTypes.list({
      page: opts.page,
      size: opts.size,
    }) as unknown as Promise<PagedResponse<Record<string, unknown>>>,

  labelFn: (item) => (item.id as string) || 'Service Type',

  detailFn: (c, id) => c.serviceTypes.get(id) as unknown as Promise<Record<string, unknown>>,

  // -- Detail view --
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'description', label: 'Description' },
  ],

  tabs: [],
  crossLinks: [],
};
