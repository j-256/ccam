import { RoleSortField } from '@ccam/sdk';
import type { CcamClient, PagedResponse } from '@ccam/sdk';
import type { ResourceConfig } from '../types.js';
import { formatBoolean, formatArray, formatUserState } from '../format.js';

export const rolesConfig: ResourceConfig = {
  name: 'role',
  displayName: 'Roles',
  idField: 'id',

  // -- List view --
  columns: [
    { key: 'id', label: 'ID', width: 3, color: 'white', sort: { mode: 'remote', field: RoleSortField.ID } },
    { key: 'description', label: 'Description', width: 5, sort: { mode: 'remote', field: RoleSortField.DESCRIPTION } },
    { key: 'scope', label: 'Scope', width: 1, color: 'magenta', sort: { mode: 'remote', field: RoleSortField.SCOPE } },
    { key: 'targetType', label: 'Target', width: 1, priority: 5, color: 'magenta', sort: { mode: 'remote', field: RoleSortField.TARGET_TYPE } },
    { key: 'serviceType', label: 'Service Type', width: 2, priority: 3, color: 'magenta', sort: { mode: 'remote', field: RoleSortField.SERVICE_TYPE } },
  ],

  listFn: (c: CcamClient, opts) =>
    c.roles.list({
      page: opts.page,
      size: opts.size,
      sort: opts.sort ? { field: opts.sort.field, direction: opts.sort.direction } : undefined,
    }) as unknown as Promise<PagedResponse<Record<string, unknown>>>,

  labelFn: (item) => (item.id as string) || (item.description as string) || 'Role',

  detailFn: (c, id) => c.roles.get(id) as unknown as Promise<Record<string, unknown>>,

  // -- Detail view --
  fields: [
    { key: 'id', label: 'ID', group: 'identity' },
    { key: 'description', label: 'Description', group: 'identity' },
    { key: 'roleEnumName', label: 'Enum Name', group: 'identity' },
    { key: 'internalRole', label: 'Internal Role', format: formatBoolean, group: 'identity' },
    {
      key: 'serviceType',
      label: 'Service Type',
      crossLink: { field: 'serviceType', targetView: 'service-type-detail' },
      group: 'config',
    },
    { key: 'permissions', label: 'Permissions', format: formatArray, group: 'config' },
    { key: 'scope', label: 'Scope', group: 'config' },
    { key: 'targetType', label: 'Target Type', group: 'config' },
    { key: 'twoFAEnabled', label: '2FA Enabled', format: formatBoolean, group: 'config' },
    { key: 'privileged', label: 'Privileged', format: formatBoolean, group: 'config' },
  ],

  tabs: [
    {
      key: 'usersWithRole',
      label: 'Users with Role',
      type: 'paginated',
      fetchFn: (c, id, page, size) =>
        c.users.search.findByRole({ role: id, page, size }) as unknown as Promise<
          PagedResponse<Record<string, unknown>>
        >,
      columns: [
        { key: 'mail', label: 'Email', width: 5 },
        { key: 'displayName', label: 'Display Name', width: 3 },
        { key: 'userState', label: 'State', width: 2, format: formatUserState },
      ],
      crossLinkTo: 'user-detail',
    },
  ],

  crossLinks: [{ field: 'serviceType', targetView: 'service-type-detail' }],
};
