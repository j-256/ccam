import { describe, it, expect } from 'vitest';
import type { ApiClient } from '../types/api-client.js';

describe('ApiClient type', () => {
  it('should accept a complete ApiClient object from API response', () => {
    const apiClient: ApiClient = {
      id: 'client-id-123',
      name: 'Integration API Client',
      description: 'API client for third-party integration',
      jwtPublicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
      redirectUrls: ['https://example.com/callback'],
      scopes: ['read', 'write', 'admin'],
      defaultScopes: ['read'],
      organizations: ['org-uuid-1', 'org-uuid-2'],
      organizationCount: 2,
      active: true,
      roles: ['role-id-1', 'role-id-2'],
      roleTenantFilter: 'ECOM_ADMIN:realm_prod',
      roleTenantFilterMap: {
        'ECOM_ADMIN': ['realm_prod'],
      },
      tokenEndpointAuthMethod: 'client_secret_basic',
      passwordModificationTimestamp: 1704153600000,
      lastAuthenticatedDate: '2026-04-10',
      disabledTimestamp: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      publicClient: false,
      needsInitialPassword: false,
      links: [
        { rel: 'self', href: '/api-clients/client-id-123' },
      ],
    };

    expect(apiClient.id).toBe('client-id-123');
    expect(apiClient.name).toBe('Integration API Client');
    expect(apiClient.active).toBe(true);
    expect(apiClient.organizations).toHaveLength(2);
    expect(apiClient.tokenEndpointAuthMethod).toBe('client_secret_basic');
  });

  it('should accept an ApiClient with null optional fields', () => {
    const apiClient: ApiClient = {
      id: 'minimal-client',
      name: 'Minimal Client',
      description: null,
      jwtPublicKey: null,
      redirectUrls: [],
      scopes: [],
      defaultScopes: [],
      organizations: [],
      organizationCount: 0,
      active: false,
      roles: [],
      roleTenantFilter: '',
      roleTenantFilterMap: {},
      tokenEndpointAuthMethod: 'none',
      passwordModificationTimestamp: null,
      lastAuthenticatedDate: null,
      disabledTimestamp: '2024-01-02T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      publicClient: true,
      needsInitialPassword: true,
      links: [],
    };

    expect(apiClient.description).toBeNull();
    expect(apiClient.jwtPublicKey).toBeNull();
    expect(apiClient.publicClient).toBe(true);
  });
});
