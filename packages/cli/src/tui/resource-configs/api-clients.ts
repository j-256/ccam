import { ApiClientSortField } from '@ccam/sdk';
import type { CcamClient, ContentResponse, PagedResponse } from '@ccam/sdk';
import type { ResourceConfig } from '../types.js';
import { formatBoolean, formatDate, formatArray } from '../format.js';

export const apiClientsConfig: ResourceConfig = {
  name: 'client',
  displayName: 'API Clients',
  idField: 'id',

  // -- List view --
  columns: [
    { key: 'name', label: 'Name', width: 4, color: 'white', sort: { mode: 'remote', field: ApiClientSortField.NAME } },
    { key: 'id', label: 'ID', width: 4, priority: 5, color: 'gray', sort: { mode: 'remote', field: ApiClientSortField.ID } },
    { key: 'active', label: 'Active', width: 1, format: formatBoolean, sort: { mode: 'remote', field: ApiClientSortField.ACTIVE } },
    {
      key: 'tokenEndpointAuthMethod',
      label: 'Auth Method',
      width: 2,
      priority: 3,
      color: 'magenta',
      sort: { mode: 'remote', field: ApiClientSortField.TOKEN_ENDPOINT_AUTH_METHOD },
    },
    { key: 'createdAt', label: 'Created', width: 2, format: formatDate, priority: 3, color: 'blue', sort: { mode: 'remote', field: ApiClientSortField.CREATED_AT } },
  ],

  listFn: (c: CcamClient, opts) =>
    c.apiClients.list({
      page: opts.page,
      size: opts.size,
      sort: opts.sort ? { field: opts.sort.field, direction: opts.sort.direction } : undefined,
    }) as unknown as Promise<PagedResponse<Record<string, unknown>>>,

  labelFn: (item) => (item.name as string) || (item.id as string) || 'API Client',

  detailFn: (c, id) => c.apiClients.get(id) as unknown as Promise<Record<string, unknown>>,

  // -- Detail view --
  fields: [
    { key: 'name', label: 'Name', group: 'identity' },
    { key: 'description', label: 'Description', group: 'identity' },
    { key: 'id', label: 'ID', group: 'identity' },
    { key: 'scopes', label: 'Scopes', format: formatArray, group: 'config' },
    { key: 'defaultScopes', label: 'Default Scopes', format: formatArray, group: 'config' },
    { key: 'redirectUrls', label: 'Redirect URLs', format: formatArray, group: 'config' },
    { key: 'jwtPublicKey', label: 'JWT Public Key', group: 'config' },
    { key: 'organizationCount', label: 'Organization Count', group: 'status' },
    { key: 'active', label: 'Active', format: formatBoolean, group: 'status' },
    { key: 'publicClient', label: 'Public Client', format: formatBoolean, group: 'status' },
    { key: 'tokenEndpointAuthMethod', label: 'Auth Method', group: 'status' },
    { key: 'passwordModificationTimestamp', label: 'Password Modified', group: 'status' },
    { key: 'lastAuthenticatedDate', label: 'Last Authenticated', format: formatDate, group: 'status' },
    { key: 'disabledTimestamp', label: 'Disabled', format: formatDate, group: 'status' },
    { key: 'createdAt', label: 'Created', format: formatDate, group: 'status' },
    { key: 'needsInitialPassword', label: 'Needs Initial Password', format: formatBoolean, group: 'status' },
  ],

  tabs: [
    {
      key: 'organizations',
      label: 'Organizations',
      type: 'local',
      fetchFn: (c, id) =>
        c.apiClients.get(id, { expand: 'organizations' }).then((client) => ({
          content:
            ((client as unknown as Record<string, unknown>).organizations as Record<string, unknown>[]) || [],
          links: [],
        })),
      columns: [
        { key: 'name', label: 'Name', width: 5 },
        { key: 'type', label: 'Type', width: 2 },
        { key: 'twoFAEnabled', label: '2FA', width: 1, format: formatBoolean },
      ],
      crossLinkTo: 'org-detail',
    },
    {
      key: 'roles',
      label: 'Roles',
      type: 'local',
      fetchFn: (c, id) =>
        c.apiClients.get(id, { expand: 'roles' }).then((client) => ({
          content:
            ((client as unknown as Record<string, unknown>).roles as Record<string, unknown>[]) || [],
          links: [],
        })),
      columns: [
        { key: 'id', label: 'ID', width: 3 },
        { key: 'description', label: 'Description', width: 5 },
        { key: 'scope', label: 'Scope', width: 1 },
        { key: 'targetType', label: 'Target', width: 1 },
      ],
      crossLinkTo: 'role-detail',
    },
    {
      key: 'assignedRealms',
      label: 'Assigned Realms',
      type: 'local',
      fetchFn: (c, id) =>
        c.apiClients.assignedRealms(id) as unknown as Promise<
          ContentResponse<Record<string, unknown>>
        >,
      columns: [
        { key: 'id', label: 'ID', width: 1 },
        { key: 'description', label: 'Description', width: 3 },
        { key: 'customerName', label: 'Customer', width: 3 },
      ],
      crossLinkTo: 'realm-detail',
    },
    {
      key: 'assignedInstances',
      label: 'Assigned Instances',
      type: 'local',
      fetchFn: (c, id) =>
        c.apiClients.assignedInstances(id) as unknown as Promise<
          ContentResponse<Record<string, unknown>>
        >,
      columns: [
        { key: 'id', label: 'ID', width: 2 },
        { key: 'description', label: 'Description', width: 5 },
      ],
      crossLinkTo: 'instance-detail',
    },
    {
      key: 'audit',
      label: 'Audit',
      type: 'audit',
      fetchFn: (c, id, querySize) =>
        c.apiClients.auditLogs(
          id,
          querySize !== undefined ? { querySize } : undefined,
        ) as unknown as Promise<ContentResponse<Record<string, unknown>>>,
      columns: [
        { key: 'timestamp', label: 'Time', width: 2, format: formatDate },
        { key: 'eventType', label: 'Event', width: 2 },
        { key: 'eventMessage', label: 'Message', width: 4 },
        { key: 'authorDisplayName', label: 'Author', width: 2 },
      ],
    },
  ],

  crossLinks: [],
};
