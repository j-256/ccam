import { describe, it, expect } from 'vitest';
import {
  UserState,
  SfIdentityFederation,
  RoleScope,
  RoleTargetType,
  VerifierType,
  RealmSortField,
  UserSortField,
  OrganizationSortField,
  ApiClientSortField,
  RoleSortField,
  OrganizationType,
  TokenEndpointAuthMethod,
} from '../types/enums.js';

describe('enums', () => {
  it('UserState has expected values', () => {
    expect(Object.values(UserState).sort()).toEqual(['DELETED', 'ENABLED', 'INITIAL']);
  });

  it('SfIdentityFederation has expected values', () => {
    expect(Object.values(SfIdentityFederation).sort()).toEqual(['ALLOWED', 'DISABLED', 'ENFORCED']);
  });

  it('RoleScope has expected values', () => {
    expect(Object.values(RoleScope).sort()).toEqual(['GLOBAL', 'INSTANCE']);
  });

  it('RoleTargetType has expected values', () => {
    expect(Object.values(RoleTargetType).sort()).toEqual(['ApiClient', 'User']);
  });

  it('VerifierType has expected values', () => {
    expect(Object.values(VerifierType).sort()).toEqual([
      'sfa',
      'totp',
      'webauthn.cross-platform',
    ]);
  });

  it('RealmSortField has expected values', () => {
    expect(Object.values(RealmSortField).sort()).toEqual(['id', 'name', 'organizationId']);
  });

  it('UserSortField has expected values', () => {
    expect(Object.values(UserSortField).sort()).toEqual([
      'createdAt',
      'displayName',
      'email',
      'firstName',
      'id',
      'primaryOrganization',
    ]);
  });

  it('OrganizationSortField has expected values', () => {
    expect(Object.values(OrganizationSortField).sort()).toEqual([
      'disableInactiveUsers',
      'id',
      'inactiveUserDays',
      'justInTimeUserProvisioningEnabled',
      'name',
      'passwordDaysExpiration',
      'passwordHistorySize',
      'passwordMinEntropy',
    ]);
  });

  it('ApiClientSortField has expected values', () => {
    expect(Object.values(ApiClientSortField).sort()).toEqual([
      'active',
      'createdAt',
      'description',
      'id',
      'name',
      'publicClient',
      'tokenEndpointAuthMethod',
    ]);
  });

  it('RoleSortField has expected values', () => {
    expect(Object.values(RoleSortField).sort()).toEqual([
      'description',
      'id',
      'internalRole',
      'privileged',
      'roleEnumName',
      'scope',
      'serviceType',
      'targetType',
      'twoFAEnabled',
    ]);
  });

  it('OrganizationType has expected values', () => {
    expect(Object.values(OrganizationType).sort()).toEqual([
      'CUSTOMER',
      'INTERNAL',
      'LINK_PARTNER',
      'PROSPECT',
      'SOLUTION_PARTNER',
      'UNAFFILIATED_PARTNER',
      'UNDEFINED',
    ]);
  });

  it('TokenEndpointAuthMethod has expected values', () => {
    expect(Object.values(TokenEndpointAuthMethod).sort()).toEqual([
      'client_secret_basic',
      'client_secret_post',
      'none',
      'private_key_jwt',
    ]);
  });
});
