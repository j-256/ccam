import { describe, it, expect } from 'vitest';
import type { User, UserExpanded, Verifier } from '../types/user.js';
import { UserState, VerifierType } from '../types/enums.js';

describe('User type', () => {
  it('should accept a complete User object from API response', () => {
    const user: User = {
      id: '00000000-0000-0000-0000-000000000000',
      mail: 'john.doe@cassis.be',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      businessPhone: '+32123456789',
      homePhone: null,
      mobilePhone: null,
      preferredLocale: 'fr',
      roles: ['role-id-1', 'role-id-2'],
      organizations: ['org-uuid-1', 'org-uuid-2'],
      primaryOrganization: 'org-uuid-1',
      roleTenantFilter: 'ECOM_USER:realm_dev,realm_stg',
      roleTenantFilterMap: {
        'ECOM_USER': ['realm_dev', 'realm_stg'],
      },
      passwordExpirationTimestamp: 1735689600000,
      passwordModificationTimestamp: 1704153600000,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModified: '2024-04-10T12:00:00.000Z',
      lastLoginDate: '2026-04-07',
      userState: UserState.ENABLED,
      activationCodeCreationTimestamp: null,
      sfUserId: 'SF123456789',
      verifiers: [
        {
          id: 'verifier-id-1',
          type: VerifierType.TOTP,
          displayName: 'My Authenticator',
          status: 'ACTIVE',
        },
      ],
      deleteTimestamp: null,
      links: [
        { rel: 'self', href: '/users/00000000-0000-0000-0000-000000000000' },
      ],
    };

    expect(user.id).toBe('00000000-0000-0000-0000-000000000000');
    expect(user.mail).toBe('john.doe@cassis.be');
    expect(user.userState).toBe(UserState.ENABLED);
    expect(user.verifiers).toHaveLength(1);
    expect(user.verifiers[0].type).toBe(VerifierType.TOTP);
  });
});

describe('Verifier type', () => {
  it('should accept a complete Verifier object', () => {
    const verifier: Verifier = {
      id: 'verifier-123',
      type: VerifierType.WEBAUTHN_CROSS_PLATFORM,
      displayName: 'YubiKey 5C',
      status: 'ACTIVE',
    };

    expect(verifier.id).toBe('verifier-123');
    expect(verifier.type).toBe(VerifierType.WEBAUTHN_CROSS_PLATFORM);
    expect(verifier.displayName).toBe('YubiKey 5C');
  });
});

describe('UserExpanded type', () => {
  it('should accept User with expanded organization objects', () => {
    const userExpanded: UserExpanded = {
      id: '00000000-0000-0000-0000-000000000000',
      mail: 'john.doe@cassis.be',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      businessPhone: null,
      homePhone: null,
      mobilePhone: null,
      preferredLocale: null,
      roles: ['role-id-1'],
      organizations: [
        {
          id: 'org-uuid-1',
          name: 'ACME Corporation',
          contactUsers: ['user-1', 'user-2'],
          realms: ['realm-1', 'realm-2'],
          emailDomains: ['acme.com'],
          passwordMinEntropy: 50,
          passwordHistorySize: 5,
          passwordDaysExpiration: 90,
          sfAccountIds: ['SF001'],
          type: 'STANDARD',
          twoFARoles: ['admin-role'],
          twoFAEnabled: true,
          sfMyDomain: 'acme',
          sfMyDomainSuffix: '.my.salesforce.com',
          sfMyDomainVerified: true,
          sfMyDomainVerificationTimestamp: '2024-01-01T00:00:00.000Z',
          sfIdentityFederation: 'ALLOWED',
          justInTimeUserProvisioningEnabled: false,
          allowedVerifierTypes: ['totp', 'webauthn.cross-platform'],
          disableInactiveUsers: true,
          inactiveUserDays: 90,
          links: [{ rel: 'self', href: '/organizations/org-uuid-1' }],
        },
      ],
      primaryOrganization: 'org-uuid-1',
      roleTenantFilter: '',
      roleTenantFilterMap: {},
      passwordExpirationTimestamp: null,
      passwordModificationTimestamp: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastModified: '2024-04-10T12:00:00.000Z',
      lastLoginDate: null,
      userState: UserState.ENABLED,
      activationCodeCreationTimestamp: null,
      sfUserId: null,
      verifiers: [],
      deleteTimestamp: null,
      links: [
        { rel: 'self', href: '/users/00000000-0000-0000-0000-000000000000' },
      ],
    };

    expect(userExpanded.organizations).toHaveLength(1);
    expect(userExpanded.organizations[0].name).toBe('ACME Corporation');
    expect(userExpanded.organizations[0].id).toBe('org-uuid-1');
  });
});
