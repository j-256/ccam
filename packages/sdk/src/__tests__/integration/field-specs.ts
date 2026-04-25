import type { FieldSpec } from './helpers.js';

export const userFields: FieldSpec = {
  id: 'string',
  mail: 'string',
  firstName: 'string',
  lastName: 'string',
  displayName: 'string',
  businessPhone: 'string|null',
  homePhone: 'string|null',
  mobilePhone: 'string|null',
  preferredLocale: 'string|null',
  roles: 'array',
  organizations: 'array',
  primaryOrganization: 'string',
  roleTenantFilter: 'string',
  roleTenantFilterMap: 'object',
  passwordExpirationTimestamp: 'number|null',
  passwordModificationTimestamp: 'number|null',
  createdAt: 'string',
  lastModified: 'string',
  lastLoginDate: 'string|null',
  userState: 'string',
  activationCodeCreationTimestamp: 'number|null',
  sfUserId: 'string|null',
  verifiers: 'array',
  deleteTimestamp: 'number|null',
  links: 'array',
};

export const organizationFields: FieldSpec = {
  id: 'string',
  name: 'string',
  contactUsers: 'array',
  realms: 'array',
  emailDomains: 'array',
  passwordMinEntropy: 'number',
  passwordHistorySize: 'number',
  passwordDaysExpiration: 'number',
  sfAccountIds: 'array',
  type: 'string',
  twoFARoles: 'array',
  twoFAEnabled: 'boolean',
  sfMyDomain: 'string|null',
  sfMyDomainSuffix: 'string',
  sfMyDomainVerified: 'boolean',
  sfMyDomainVerificationTimestamp: 'string|null',
  sfIdentityFederation: 'string',
  justInTimeUserProvisioningEnabled: 'boolean',
  allowedVerifierTypes: 'array',
  disableInactiveUsers: 'boolean',
  inactiveUserDays: 'number',
  links: 'array',
};

export const apiClientFields: FieldSpec = {
  id: 'string',
  name: 'string',
  description: 'string|null',
  jwtPublicKey: 'string|null',
  redirectUrls: 'array',
  scopes: 'array',
  defaultScopes: 'array',
  organizations: 'array',
  active: 'boolean',
  roles: 'array',
  roleTenantFilter: 'string',
  roleTenantFilterMap: 'object',
  tokenEndpointAuthMethod: 'string',
  passwordModificationTimestamp: 'number|null',
  lastAuthenticatedDate: 'string|null',
  disabledTimestamp: 'number|null',
  createdAt: 'string',
  publicClient: 'boolean',
  needsInitialPassword: 'boolean',
  links: 'array',
};

export const roleFields: FieldSpec = {
  id: 'string',
  description: 'string',
  roleEnumName: 'string',
  internalRole: 'boolean',
  serviceType: 'string',
  permissions: 'array',
  scope: 'string',
  targetType: 'string|null',
  twoFAEnabled: 'boolean',
  privileged: 'boolean',
  links: 'array',
};

export const realmFields: FieldSpec = {
  id: 'string',
  description: 'string',
  customerName: 'string',
  organizationId: 'string',
  sfAccountId: 'string',
  links: 'array',
};

export const instanceFields: FieldSpec = {
  id: 'string',
  description: 'string',
  podId: 'string',
  tenantType: 'string',
  inactiveSinceTimestamp: 'number|null',
  links: 'array',
};

export const permissionFields: FieldSpec = {
  name: 'string',
  adminPermission: 'boolean',
  links: 'array',
};

export const serviceTypeFields: FieldSpec = {
  id: 'string',
  description: 'string',
  links: 'array',
};

export const auditLogFields: FieldSpec = {
  authorId: 'string|null',
  authorDisplayName: 'string',
  authorEmail: 'string|null',
  eventType: 'string',
  eventMessage: 'string',
  supportTicketId: 'string|null',
  timestamp: 'string',
  arguments: 'array|null',
  links: 'array',
};
