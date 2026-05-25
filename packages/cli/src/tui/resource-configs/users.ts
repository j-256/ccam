import { UserSortField } from 'ccam-sdk';
import type { CcamClient, ContentResponse, PagedResponse } from 'ccam-sdk';
import type { ResourceConfig } from '../types.js';
import { formatUserState, formatDate, formatBoolean, formatArray } from '../format.js';

export const usersConfig: ResourceConfig = {
  name: 'user',
  displayName: 'Users',
  idField: 'id',

  // -- List view --
  columns: [
    { key: 'mail', label: 'Email', width: 5, color: 'white', sort: { mode: 'remote', field: UserSortField.EMAIL } },
    { key: 'displayName', label: 'Display Name', width: 3, sort: { mode: 'remote', field: UserSortField.DISPLAY_NAME } },
    { key: 'userState', label: 'State', width: 2, format: formatUserState },
    { key: 'lastLoginDate', label: 'Last Login', width: 2, format: formatDate, priority: 5, color: 'blue' },
    { key: 'createdAt', label: 'Created', width: 2, format: formatDate, priority: 3, color: 'blue', sort: { mode: 'remote', field: UserSortField.CREATED_AT } },
  ],

  listFn: (c: CcamClient, opts) =>
    c.users.list({
      page: opts.page,
      size: opts.size,
      sort: opts.sort ? { field: opts.sort.field, direction: opts.sort.direction } : undefined,
    }) as unknown as Promise<PagedResponse<Record<string, unknown>>>,

  labelFn: (item) => (item.displayName as string) || (item.mail as string) || 'User',

  detailFn: (c, id) => c.users.get(id) as unknown as Promise<Record<string, unknown>>,

  // -- Detail view --
  fields: [
    { key: 'displayName', label: 'Display Name', group: 'identity' },
    { key: 'mail', label: 'Email', group: 'identity' },
    { key: 'firstName', label: 'First Name', group: 'identity' },
    { key: 'lastName', label: 'Last Name', group: 'identity' },
    { key: 'userState', label: 'State', format: formatUserState, group: 'identity' },
    { key: 'businessPhone', label: 'Business Phone', group: 'contact' },
    { key: 'homePhone', label: 'Home Phone', group: 'contact' },
    { key: 'mobilePhone', label: 'Mobile Phone', group: 'contact' },
    { key: 'preferredLocale', label: 'Preferred Locale', group: 'contact' },
    {
      key: 'primaryOrganization',
      label: 'Primary Organization',
      crossLink: { field: 'primaryOrganization', targetView: 'org-detail' },
      group: 'organization',
    },
    { key: 'roleTenantFilter', label: 'Role Tenant Filter', group: 'organization' },
    { key: 'passwordExpirationTimestamp', label: 'Password Expires', group: 'status' },
    { key: 'passwordModificationTimestamp', label: 'Password Modified', group: 'status' },
    { key: 'createdAt', label: 'Created', format: formatDate, group: 'status' },
    { key: 'lastModified', label: 'Last Modified', format: formatDate, group: 'status' },
    { key: 'lastLoginDate', label: 'Last Login', format: formatDate, group: 'status' },
    { key: 'sfUserId', label: 'SF User ID', group: 'status' },
    { key: 'verifiers', label: 'Verifiers', format: formatArray, group: 'status' },
  ],

  tabs: [
    {
      key: 'roles',
      label: 'Roles',
      type: 'local',
      fetchFn: (c, id) =>
        c.users.roles(id) as unknown as Promise<ContentResponse<Record<string, unknown>>>,
      columns: [
        { key: 'id', label: 'ID', width: 3 },
        { key: 'description', label: 'Description', width: 5 },
        { key: 'scope', label: 'Scope', width: 1 },
        { key: 'targetType', label: 'Target', width: 1 },
      ],
      crossLinkTo: 'role-detail',
    },
    {
      key: 'organizations',
      label: 'Organizations',
      type: 'local',
      fetchFn: (c, id) =>
        c.users.get(id, { expand: 'organizations' }).then((u) => ({
          content: ((u as unknown as Record<string, unknown>).organizations as Record<string, unknown>[]) || [],
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
      key: 'instances',
      label: 'Instances',
      type: 'local',
      fetchFn: (c, id) =>
        c.users.instances(id) as unknown as Promise<ContentResponse<Record<string, unknown>>>,
      columns: [
        { key: 'id', label: 'ID', width: 2 },
        { key: 'description', label: 'Description', width: 5 },
      ],
      crossLinkTo: 'instance-detail',
    },
    {
      key: 'assignedRealms',
      label: 'Assigned Realms',
      type: 'local',
      fetchFn: (c, id) =>
        c.users.assignedRealms(id) as unknown as Promise<ContentResponse<Record<string, unknown>>>,
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
        c.users.assignedInstances(id) as unknown as Promise<
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
        c.users.auditLogs(id, querySize !== undefined ? { querySize } : undefined) as unknown as Promise<
          ContentResponse<Record<string, unknown>>
        >,
      columns: [
        { key: 'timestamp', label: 'Time', width: 2, format: formatDate },
        { key: 'eventType', label: 'Event', width: 2 },
        { key: 'eventMessage', label: 'Message', width: 4 },
        { key: 'authorDisplayName', label: 'Author', width: 2 },
      ],
    },
  ],

  crossLinks: [{ field: 'primaryOrganization', targetView: 'org-detail' }],
};
