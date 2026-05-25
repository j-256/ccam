import { OrganizationSortField } from 'ccam-sdk';
import type { CcamClient, ContentResponse, PagedResponse } from 'ccam-sdk';
import type { ResourceConfig } from '../types.js';
import { formatBoolean, formatDate, formatArray, formatCount, formatUserState } from '../format.js';

export const organizationsConfig: ResourceConfig = {
  name: 'org',
  displayName: 'Organizations',
  idField: 'id',

  // -- List view --
  columns: [
    { key: 'name', label: 'Name', width: 5, color: 'white', sort: { mode: 'remote', field: OrganizationSortField.NAME } },
    { key: 'type', label: 'Type', width: 2, color: 'magenta' },
    { key: 'twoFAEnabled', label: '2FA', width: 1, format: formatBoolean, priority: 5 },
    { key: 'realms', label: 'Realms', width: 2, format: formatCount, priority: 3, color: 'yellow', align: 'right' },
  ],

  listFn: (c: CcamClient, opts) =>
    c.organizations.list({
      page: opts.page,
      size: opts.size,
      sort: opts.sort ? { field: opts.sort.field, direction: opts.sort.direction } : undefined,
    }) as unknown as Promise<PagedResponse<Record<string, unknown>>>,

  labelFn: (item) => (item.name as string) || 'Organization',

  detailFn: (c, id) => c.organizations.get(id) as unknown as Promise<Record<string, unknown>>,

  // -- Detail view --
  fields: [
    { key: 'name', label: 'Name', group: 'identity' },
    { key: 'type', label: 'Type', group: 'identity' },
    { key: 'emailDomains', label: 'Email Domains', format: formatArray, group: 'identity' },
    { key: 'sfAccountIds', label: 'SF Account IDs', format: formatArray, group: 'identity' },
    { key: 'contactUsers', label: 'Contact Users', format: formatArray, group: 'identity' },
    { key: 'passwordMinEntropy', label: 'Password Min Entropy', group: 'password' },
    { key: 'passwordHistorySize', label: 'Password History Size', group: 'password' },
    { key: 'passwordDaysExpiration', label: 'Password Days Expiration', group: 'password' },
    { key: 'twoFAEnabled', label: '2FA Enabled', format: formatBoolean, group: 'security' },
    { key: 'twoFARoles', label: '2FA Roles', format: formatArray, group: 'security' },
    { key: 'sfMyDomain', label: 'SF My Domain', group: 'security' },
    { key: 'sfMyDomainSuffix', label: 'SF My Domain Suffix', group: 'security' },
    { key: 'sfMyDomainVerified', label: 'SF My Domain Verified', format: formatBoolean, group: 'security' },
    { key: 'sfIdentityFederation', label: 'SF Identity Federation', group: 'security' },
    {
      key: 'justInTimeUserProvisioningEnabled',
      label: 'JIT Provisioning',
      format: formatBoolean,
      group: 'security',
    },
    { key: 'allowedVerifierTypes', label: 'Allowed Verifier Types', format: formatArray, group: 'status' },
    { key: 'disableInactiveUsers', label: 'Disable Inactive Users', format: formatBoolean, group: 'status' },
    { key: 'inactiveUserDays', label: 'Inactive User Days', group: 'status' },
    {
      key: 'supportTicketRequiredForAccessModification',
      label: 'Support Ticket Required',
      format: formatBoolean,
      group: 'status',
    },
  ],

  tabs: [
    {
      key: 'realms',
      label: 'Realms',
      type: 'local',
      fetchFn: (c, id) =>
        c.organizations.realms(id, { expand: 'instance' }) as unknown as Promise<
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
      key: 'instances',
      label: 'Instances',
      type: 'local',
      fetchFn: (c, id) =>
        c.organizations.instances(id) as unknown as Promise<
          ContentResponse<Record<string, unknown>>
        >,
      columns: [
        { key: 'id', label: 'ID', width: 2 },
        { key: 'description', label: 'Description', width: 5 },
      ],
      crossLinkTo: 'instance-detail',
    },
    {
      key: 'users',
      label: 'Users',
      type: 'paginated',
      fetchFn: (c, id, page, size) =>
        c.users.search.findByOrg({ organization: id, page, size }) as unknown as Promise<
          ContentResponse<Record<string, unknown>>
        >,
      columns: [
        { key: 'mail', label: 'Email', width: 5 },
        { key: 'displayName', label: 'Display Name', width: 3 },
        { key: 'userState', label: 'State', width: 2, format: formatUserState },
      ],
      crossLinkTo: 'user-detail',
    },
    {
      key: 'audit',
      label: 'Audit',
      type: 'audit',
      fetchFn: (c, id, querySize) =>
        c.organizations.auditLogs(
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
