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

describe('UserState', () => {
  it('should have INITIAL state', () => {
    expect(UserState.INITIAL).toBe('INITIAL');
  });

  it('should have ENABLED state', () => {
    expect(UserState.ENABLED).toBe('ENABLED');
  });

  it('should have DELETED state', () => {
    expect(UserState.DELETED).toBe('DELETED');
  });
});

describe('SfIdentityFederation', () => {
  it('should have DISABLED state', () => {
    expect(SfIdentityFederation.DISABLED).toBe('DISABLED');
  });

  it('should have ALLOWED state', () => {
    expect(SfIdentityFederation.ALLOWED).toBe('ALLOWED');
  });

  it('should have ENFORCED state', () => {
    expect(SfIdentityFederation.ENFORCED).toBe('ENFORCED');
  });
});

describe('RoleScope', () => {
  it('should have GLOBAL scope', () => {
    expect(RoleScope.GLOBAL).toBe('GLOBAL');
  });

  it('should have INSTANCE scope', () => {
    expect(RoleScope.INSTANCE).toBe('INSTANCE');
  });
});

describe('RoleTargetType', () => {
  it('should have USER type with string value "User"', () => {
    expect(RoleTargetType.USER).toBe('User');
  });

  it('should have API_CLIENT type with string value "ApiClient"', () => {
    expect(RoleTargetType.API_CLIENT).toBe('ApiClient');
  });
});

describe('VerifierType', () => {
  it('should have SFA type with value "sfa"', () => {
    expect(VerifierType.SFA).toBe('sfa');
  });

  it('should have TOTP type with value "totp"', () => {
    expect(VerifierType.TOTP).toBe('totp');
  });

  it('should have WEBAUTHN_CROSS_PLATFORM type with value "webauthn.cross-platform"', () => {
    expect(VerifierType.WEBAUTHN_CROSS_PLATFORM).toBe('webauthn.cross-platform');
  });
});

describe('RealmSortField', () => {
  it('should have ID field with value "id"', () => {
    expect(RealmSortField.ID).toBe('id');
  });

  it('should have NAME field with value "name"', () => {
    expect(RealmSortField.NAME).toBe('name');
  });

  it('should have ORGANIZATION_ID field with value "organizationId"', () => {
    expect(RealmSortField.ORGANIZATION_ID).toBe('organizationId');
  });
});

describe('UserSortField', () => {
  it('should have ID field with value "id"', () => {
    expect(UserSortField.ID).toBe('id');
  });

  it('should have EMAIL field with value "email"', () => {
    expect(UserSortField.EMAIL).toBe('email');
  });

  it('should have FIRST_NAME field with value "firstName"', () => {
    expect(UserSortField.FIRST_NAME).toBe('firstName');
  });

  it('should have DISPLAY_NAME field with value "displayName"', () => {
    expect(UserSortField.DISPLAY_NAME).toBe('displayName');
  });

  it('should have PRIMARY_ORGANIZATION field with value "primaryOrganization"', () => {
    expect(UserSortField.PRIMARY_ORGANIZATION).toBe('primaryOrganization');
  });

  it('should have CREATED_AT field with value "createdAt"', () => {
    expect(UserSortField.CREATED_AT).toBe('createdAt');
  });
});

describe('OrganizationSortField', () => {
  it('should have ID field with value "id"', () => {
    expect(OrganizationSortField.ID).toBe('id');
  });

  it('should have NAME field with value "name"', () => {
    expect(OrganizationSortField.NAME).toBe('name');
  });

  it('should have PASSWORD_MIN_ENTROPY field', () => {
    expect(OrganizationSortField.PASSWORD_MIN_ENTROPY).toBe('passwordMinEntropy');
  });

  it('should have PASSWORD_HISTORY_SIZE field', () => {
    expect(OrganizationSortField.PASSWORD_HISTORY_SIZE).toBe('passwordHistorySize');
  });

  it('should have PASSWORD_DAYS_EXPIRATION field', () => {
    expect(OrganizationSortField.PASSWORD_DAYS_EXPIRATION).toBe('passwordDaysExpiration');
  });

  it('should have DISABLE_INACTIVE_USERS field', () => {
    expect(OrganizationSortField.DISABLE_INACTIVE_USERS).toBe('disableInactiveUsers');
  });

  it('should have INACTIVE_USER_DAYS field', () => {
    expect(OrganizationSortField.INACTIVE_USER_DAYS).toBe('inactiveUserDays');
  });

  it('should have JUST_IN_TIME_USER_PROVISIONING_ENABLED field', () => {
    expect(OrganizationSortField.JUST_IN_TIME_USER_PROVISIONING_ENABLED).toBe('justInTimeUserProvisioningEnabled');
  });
});

describe('ApiClientSortField', () => {
  it('should have ID field with value "id"', () => {
    expect(ApiClientSortField.ID).toBe('id');
  });

  it('should have NAME field with value "name"', () => {
    expect(ApiClientSortField.NAME).toBe('name');
  });

  it('should have DESCRIPTION field with value "description"', () => {
    expect(ApiClientSortField.DESCRIPTION).toBe('description');
  });

  it('should have ACTIVE field with value "active"', () => {
    expect(ApiClientSortField.ACTIVE).toBe('active');
  });

  it('should have CREATED_AT field with value "createdAt"', () => {
    expect(ApiClientSortField.CREATED_AT).toBe('createdAt');
  });

  it('should have TOKEN_ENDPOINT_AUTH_METHOD field', () => {
    expect(ApiClientSortField.TOKEN_ENDPOINT_AUTH_METHOD).toBe('tokenEndpointAuthMethod');
  });

  it('should have PUBLIC_CLIENT field with value "publicClient"', () => {
    expect(ApiClientSortField.PUBLIC_CLIENT).toBe('publicClient');
  });
});

describe('RoleSortField', () => {
  it('should have ID field with value "id"', () => {
    expect(RoleSortField.ID).toBe('id');
  });

  it('should have DESCRIPTION field with value "description"', () => {
    expect(RoleSortField.DESCRIPTION).toBe('description');
  });

  it('should have ROLE_ENUM_NAME field with value "roleEnumName"', () => {
    expect(RoleSortField.ROLE_ENUM_NAME).toBe('roleEnumName');
  });

  it('should have INTERNAL_ROLE field with value "internalRole"', () => {
    expect(RoleSortField.INTERNAL_ROLE).toBe('internalRole');
  });

  it('should have SERVICE_TYPE field with value "serviceType"', () => {
    expect(RoleSortField.SERVICE_TYPE).toBe('serviceType');
  });

  it('should have SCOPE field with value "scope"', () => {
    expect(RoleSortField.SCOPE).toBe('scope');
  });

  it('should have TARGET_TYPE field with value "targetType"', () => {
    expect(RoleSortField.TARGET_TYPE).toBe('targetType');
  });

  it('should have TWO_FA_ENABLED field with value "twoFAEnabled"', () => {
    expect(RoleSortField.TWO_FA_ENABLED).toBe('twoFAEnabled');
  });

  it('should have PRIVILEGED field with value "privileged"', () => {
    expect(RoleSortField.PRIVILEGED).toBe('privileged');
  });
});

describe('OrganizationType', () => {
  it('should have UNDEFINED type', () => {
    expect(OrganizationType.UNDEFINED).toBe('UNDEFINED');
  });

  it('should have CUSTOMER type', () => {
    expect(OrganizationType.CUSTOMER).toBe('CUSTOMER');
  });

  it('should have LINK_PARTNER type', () => {
    expect(OrganizationType.LINK_PARTNER).toBe('LINK_PARTNER');
  });

  it('should have SOLUTION_PARTNER type', () => {
    expect(OrganizationType.SOLUTION_PARTNER).toBe('SOLUTION_PARTNER');
  });

  it('should have UNAFFILIATED_PARTNER type', () => {
    expect(OrganizationType.UNAFFILIATED_PARTNER).toBe('UNAFFILIATED_PARTNER');
  });

  it('should have PROSPECT type', () => {
    expect(OrganizationType.PROSPECT).toBe('PROSPECT');
  });

  it('should have INTERNAL type', () => {
    expect(OrganizationType.INTERNAL).toBe('INTERNAL');
  });
});

describe('TokenEndpointAuthMethod', () => {
  it('should have PRIVATE_KEY_JWT method', () => {
    expect(TokenEndpointAuthMethod.PRIVATE_KEY_JWT).toBe('private_key_jwt');
  });

  it('should have CLIENT_SECRET_POST method', () => {
    expect(TokenEndpointAuthMethod.CLIENT_SECRET_POST).toBe('client_secret_post');
  });

  it('should have CLIENT_SECRET_BASIC method', () => {
    expect(TokenEndpointAuthMethod.CLIENT_SECRET_BASIC).toBe('client_secret_basic');
  });

  it('should have NONE method', () => {
    expect(TokenEndpointAuthMethod.NONE).toBe('none');
  });
});
