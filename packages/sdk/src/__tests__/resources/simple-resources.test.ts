import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClientsResource } from '../../resources/api-clients.js';
import { RolesResource } from '../../resources/roles.js';
import { RealmsResource } from '../../resources/realms.js';
import { PermissionsResource } from '../../resources/permissions.js';
import { ServiceTypesResource } from '../../resources/service-types.js';
import { OrganizationConfigurationResource } from '../../resources/organization-configuration.js';
import { HttpClient } from '../../client.js';
import type {
  ApiClient,
  Role,
  RoleExpanded,
  Realm,
  Permission,
  ServiceType,
  Instance,
  ContentResponse,
  PagedResponse,
  AuditLogRecord,
  OrganizationConfiguration,
} from '../../types/index.js';

describe('ApiClientsResource', () => {
  let httpClient: HttpClient;
  let apiClients: ApiClientsResource;

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;
    apiClients = new ApiClientsResource(httpClient);
  });

  describe('list', () => {
    it('should call GET /dw/rest/v1/apiclients', async () => {
      const mockResponse: PagedResponse<ApiClient> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await apiClients.list();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients',
        undefined,
        { resource: 'apiClients', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: PagedResponse<ApiClient> = {
        content: [],
        page: { number: 1, size: 10, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await apiClients.list({ page: 1, size: 10 });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients',
        { page: 1, size: 10 },
        { resource: 'apiClients', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('get', () => {
    it('should call GET /dw/rest/v1/apiclients/{id}', async () => {
      const mockApiClient: ApiClient = {
        id: 'client-123',
        name: 'Test Client',
        description: null,
        jwtPublicKey: null,
        redirectUrls: [],
        scopes: [],
        defaultScopes: [],
        organizations: [],
        organizationCount: 0,
        active: true,
        roles: [],
        roleTenantFilter: '',
        roleTenantFilterMap: {},
        tokenEndpointAuthMethod: 'client_secret_basic',
        passwordModificationTimestamp: null,
        lastAuthenticatedDate: null,
        disabledTimestamp: null,
        createdAt: '2026-01-01T00:00:00Z',
        publicClient: false,
        needsInitialPassword: false,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockApiClient);

      const result = await apiClients.get('client-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/client-123',
        undefined,
        { resource: 'apiClients', operation: 'get' }
      );
      expect(result).toBe(mockApiClient);
    });
  });

  describe('auditLogs', () => {
    it('should call GET /dw/rest/v1/apiclients/{id}/audit-log-records', async () => {
      const mockResponse: ContentResponse<AuditLogRecord> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await apiClients.auditLogs('client-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/client-123/audit-log-records',
        undefined,
        { resource: 'apiClients', operation: 'auditLogs' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include querySize param when provided', async () => {
      const mockResponse: ContentResponse<AuditLogRecord> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await apiClients.auditLogs('client-123', { querySize: 50 });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/client-123/audit-log-records',
        { querySize: 50 },
        { resource: 'apiClients', operation: 'auditLogs' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should throw when querySize is 0', async () => {
      await expect(apiClients.auditLogs('client-123', { querySize: 0 })).rejects.toThrow(
        /querySize must be a positive integer/
      );
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should throw when querySize is negative', async () => {
      await expect(apiClients.auditLogs('client-123', { querySize: -1 })).rejects.toThrow(
        /querySize must be a positive integer/
      );
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should throw when querySize is non-integer', async () => {
      await expect(apiClients.auditLogs('client-123', { querySize: 1.5 })).rejects.toThrow(
        /querySize must be a positive integer/
      );
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should throw when querySize exceeds 1000', async () => {
      await expect(apiClients.auditLogs('client-123', { querySize: 10000 })).rejects.toThrow(
        /querySize must be <= 1000/
      );
      expect(httpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('assignedRealms', () => {
    it('should call GET /dw/rest/v1/apiclients/{id}/assigned-realms', async () => {
      const mockResponse: ContentResponse<Realm> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await apiClients.assignedRealms('client-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/client-123/assigned-realms',
        undefined,
        { resource: 'apiClients', operation: 'assignedRealms' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('assignedInstances', () => {
    it('should call GET /dw/rest/v1/apiclients/{id}/assigned-instances', async () => {
      const mockResponse: ContentResponse<Instance> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await apiClients.assignedInstances('client-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/client-123/assigned-instances',
        undefined,
        { resource: 'apiClients', operation: 'assignedInstances' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('create', () => {
    it('should POST to /dw/rest/v1/apiclients', async () => {
      const body = { id: 'my-client', name: 'My Client' };
      const mockResponse = { id: 'my-client', name: 'My Client', links: [] } as unknown as ApiClient;
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const result = await apiClients.create(body);

      expect(httpClient.post).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients',
        body,
        undefined,
        { resource: 'apiClients', operation: 'create' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('update', () => {
    it('should PUT to /dw/rest/v1/apiclients/{id}', async () => {
      const body = { name: 'Updated Client' };
      const mockResponse = { id: 'my-client', name: 'Updated Client', links: [] } as unknown as ApiClient;
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse);

      const result = await apiClients.update('my-client', body);

      expect(httpClient.put).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/my-client',
        body,
        undefined,
        { resource: 'apiClients', operation: 'update' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('delete', () => {
    it('should DELETE /dw/rest/v1/apiclients/{id}', async () => {
      vi.mocked(httpClient.delete).mockResolvedValue(undefined);

      await apiClients.delete('my-client');

      expect(httpClient.delete).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/my-client',
        undefined,
        { resource: 'apiClients', operation: 'delete' }
      );
    });
  });

  describe('setPassword', () => {
    it('should PUT to /dw/rest/v1/apiclients/{id}/password with new only', async () => {
      vi.mocked(httpClient.put).mockResolvedValue(undefined);

      await apiClients.setPassword('my-client', { new: 'new-secret' });

      expect(httpClient.put).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/my-client/password',
        { new: 'new-secret' },
        undefined,
        { resource: 'apiClients', operation: 'setPassword' }
      );
    });

    it('should PUT with old and new when rotating an existing secret', async () => {
      vi.mocked(httpClient.put).mockResolvedValue(undefined);

      await apiClients.setPassword('my-client', { new: 'new-secret', old: 'old-secret' });

      expect(httpClient.put).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/my-client/password',
        { new: 'new-secret', old: 'old-secret' },
        undefined,
        { resource: 'apiClients', operation: 'setPassword' }
      );
    });
  });

  describe('setAuthType', () => {
    it('should POST to /dw/rest/v1/apiclients/{id}/client-authentication-type with public=true', async () => {
      vi.mocked(httpClient.post).mockResolvedValue(undefined);

      await apiClients.setAuthType('my-client', true);

      expect(httpClient.post).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/my-client/client-authentication-type',
        { public: true },
        undefined,
        { resource: 'apiClients', operation: 'setAuthType' }
      );
    });

    it('should POST with public=false for confidential', async () => {
      vi.mocked(httpClient.post).mockResolvedValue(undefined);

      await apiClients.setAuthType('my-client', false);

      expect(httpClient.post).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/my-client/client-authentication-type',
        { public: false },
        undefined,
        { resource: 'apiClients', operation: 'setAuthType' }
      );
    });
  });

  describe('grantRole', () => {
    const baseClient = (overrides: Partial<ApiClient> = {}): ApiClient => ({
      id: 'client-1',
      name: 'Test Client',
      description: null,
      jwtPublicKey: null,
      redirectUrls: [],
      scopes: [],
      defaultScopes: [],
      organizations: [],
      organizationCount: 0,
      active: true,
      roles: [],
      roleTenantFilter: '',
      roleTenantFilterMap: {},
      tokenEndpointAuthMethod: 'client_secret_basic',
      passwordModificationTimestamp: null,
      lastAuthenticatedDate: null,
      disabledTimestamp: null,
      createdAt: '2026-01-01T00:00:00Z',
      publicClient: false,
      needsInitialPassword: false,
      links: [],
      ...overrides,
    });

    const globalRole = {
      id: 'account-admin',
      description: 'AM Account Admin',
      roleEnumName: 'AM_ACCOUNT_ADMIN',
      internalRole: false,
      serviceType: 'AM',
      permissions: [],
      scope: 'GLOBAL',
      targetType: null,
      twoFAEnabled: false,
      privileged: true,
      links: [],
    };

    const instanceRole = {
      id: 'ccdx-sbx-user',
      description: 'Sandbox API User',
      roleEnumName: 'CCDX_SBX_USER',
      internalRole: false,
      serviceType: 'CCDX',
      permissions: [],
      scope: 'INSTANCE',
      targetType: null,
      twoFAEnabled: false,
      privileged: false,
      links: [],
    };

    it('adds an absent role; changed=true', async () => {
      const before = baseClient({ roles: ['api-admin'] });
      const after = baseClient({ roles: ['api-admin', 'account-admin'] });
      vi.mocked(httpClient.get)
        .mockResolvedValueOnce(before)
        .mockResolvedValueOnce(globalRole);
      vi.mocked(httpClient.put).mockResolvedValueOnce(after);

      const result = await apiClients.grantRole('client-1', 'account-admin');

      expect(httpClient.put).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/client-1',
        { roles: ['api-admin', 'account-admin'] },
        undefined,
        { resource: 'apiClients', operation: 'grantRole' }
      );
      expect(result).toEqual({ apiClient: after, changed: true, roleScope: 'GLOBAL' });
    });

    it('is a no-op when already present and no tenants', async () => {
      const before = baseClient({ roles: ['api-admin'] });
      vi.mocked(httpClient.get)
        .mockResolvedValueOnce(before)
        .mockResolvedValueOnce(globalRole);

      const result = await apiClients.grantRole('client-1', 'api-admin');

      expect(httpClient.put).not.toHaveBeenCalled();
      expect(result).toEqual({ apiClient: before, changed: false, roleScope: 'GLOBAL' });
    });

    it('throws for GLOBAL role + tenants', async () => {
      vi.mocked(httpClient.get)
        .mockResolvedValueOnce(baseClient({ roles: [] }))
        .mockResolvedValueOnce(globalRole);

      await expect(
        apiClients.grantRole('client-1', 'account-admin', { tenants: ['x'] })
      ).rejects.toThrow(/GLOBAL/);

      expect(httpClient.put).not.toHaveBeenCalled();
    });

    it('throws when a GLOBAL role is given tenants even if already present', async () => {
      const before = baseClient({ roles: ['account-admin'] });
      vi.mocked(httpClient.get)
        .mockResolvedValueOnce(before)
        .mockResolvedValueOnce(globalRole);

      await expect(
        apiClients.grantRole('client-1', 'account-admin', { tenants: ['x'] })
      ).rejects.toThrow(/GLOBAL/);

      expect(httpClient.put).not.toHaveBeenCalled();
    });

    it('adds role + filter entry when role absent and tenants given', async () => {
      const before = baseClient({ roles: [], roleTenantFilter: '' });
      const after = baseClient({
        roles: ['ccdx-sbx-user'],
        roleTenantFilter: 'CCDX_SBX_USER:zysj_sbx',
      });
      vi.mocked(httpClient.get)
        .mockResolvedValueOnce(before)
        .mockResolvedValueOnce(instanceRole);
      vi.mocked(httpClient.put).mockResolvedValueOnce(after);

      const result = await apiClients.grantRole('client-1', 'ccdx-sbx-user', {
        tenants: ['zysj_sbx'],
      });

      expect(httpClient.put).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/client-1',
        {
          roles: ['ccdx-sbx-user'],
          roleTenantFilter: 'CCDX_SBX_USER:zysj_sbx',
        },
        undefined,
        { resource: 'apiClients', operation: 'grantRole' }
      );
      expect(result).toEqual({ apiClient: after, changed: true, roleScope: 'INSTANCE' });
    });

    it('adds filter entry only when role present but filter is missing it', async () => {
      const before = baseClient({
        roles: ['ccdx-sbx-user'],
        roleTenantFilter: '',
      });
      const after = baseClient({
        roles: ['ccdx-sbx-user'],
        roleTenantFilter: 'CCDX_SBX_USER:zysj_sbx',
      });
      vi.mocked(httpClient.get)
        .mockResolvedValueOnce(before)
        .mockResolvedValueOnce(instanceRole);
      vi.mocked(httpClient.put).mockResolvedValueOnce(after);

      const result = await apiClients.grantRole('client-1', 'ccdx-sbx-user', {
        tenants: ['zysj_sbx'],
      });

      expect(httpClient.put).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/client-1',
        {
          roles: ['ccdx-sbx-user'],
          roleTenantFilter: 'CCDX_SBX_USER:zysj_sbx',
        },
        undefined,
        { resource: 'apiClients', operation: 'grantRole' }
      );
      expect(result).toEqual({ apiClient: after, changed: true, roleScope: 'INSTANCE' });
    });

    it('is a no-op when all requested tenants are already in the filter', async () => {
      const before = baseClient({
        roles: ['ccdx-sbx-user'],
        roleTenantFilter: 'CCDX_SBX_USER:a,b',
      });
      vi.mocked(httpClient.get)
        .mockResolvedValueOnce(before)
        .mockResolvedValueOnce(instanceRole);

      const result = await apiClients.grantRole('client-1', 'ccdx-sbx-user', {
        tenants: ['a'],
      });

      expect(httpClient.put).not.toHaveBeenCalled();
      expect(result).toEqual({ apiClient: before, changed: false, roleScope: 'INSTANCE' });
    });

    it('unions tenants into existing filter', async () => {
      const before = baseClient({
        roles: ['ccdx-sbx-user'],
        roleTenantFilter: 'CCDX_SBX_USER:a',
      });
      const after = baseClient({
        roles: ['ccdx-sbx-user'],
        roleTenantFilter: 'CCDX_SBX_USER:a,b',
      });
      vi.mocked(httpClient.get)
        .mockResolvedValueOnce(before)
        .mockResolvedValueOnce(instanceRole);
      vi.mocked(httpClient.put).mockResolvedValueOnce(after);

      const result = await apiClients.grantRole('client-1', 'ccdx-sbx-user', {
        tenants: ['a', 'b'],
      });

      expect(httpClient.put).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/client-1',
        {
          roles: ['ccdx-sbx-user'],
          roleTenantFilter: 'CCDX_SBX_USER:a,b',
        },
        undefined,
        { resource: 'apiClients', operation: 'grantRole' }
      );
      expect(result).toEqual({ apiClient: after, changed: true, roleScope: 'INSTANCE' });
    });
  });

  describe('revokeRole', () => {
    const baseClient = (overrides: Partial<ApiClient> = {}): ApiClient => ({
      id: 'client-1',
      name: 'Test Client',
      description: null,
      jwtPublicKey: null,
      redirectUrls: [],
      scopes: [],
      defaultScopes: [],
      organizations: [],
      organizationCount: 0,
      active: true,
      roles: [],
      roleTenantFilter: '',
      roleTenantFilterMap: {},
      tokenEndpointAuthMethod: 'client_secret_basic',
      passwordModificationTimestamp: null,
      lastAuthenticatedDate: null,
      disabledTimestamp: null,
      createdAt: '2026-01-01T00:00:00Z',
      publicClient: false,
      needsInitialPassword: false,
      links: [],
      ...overrides,
    });

    it('is a no-op when role not present', async () => {
      const before = baseClient({ roles: ['api-admin'] });
      vi.mocked(httpClient.get).mockResolvedValueOnce(before);

      const result = await apiClients.revokeRole('client-1', 'account-admin');

      expect(httpClient.put).not.toHaveBeenCalled();
      expect(result).toEqual({ apiClient: before, changed: false });
    });

    it('sends only the filtered roles array', async () => {
      const before = baseClient({
        roles: ['ccdx-sbx-user', 'api-admin'],
        roleTenantFilter: 'CCDX_SBX_USER:a',
      });
      const after = baseClient({
        roles: ['api-admin'],
        roleTenantFilter: '',
      });
      vi.mocked(httpClient.get).mockResolvedValueOnce(before);
      vi.mocked(httpClient.put).mockResolvedValueOnce(after);

      const result = await apiClients.revokeRole('client-1', 'ccdx-sbx-user');

      expect(httpClient.put).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/client-1',
        { roles: ['api-admin'] },
        undefined,
        { resource: 'apiClients', operation: 'revokeRole' }
      );
      expect(result).toEqual({ apiClient: after, changed: true });
    });
  });
});

describe('RolesResource', () => {
  let httpClient: HttpClient;
  let roles: RolesResource;

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;
    roles = new RolesResource(httpClient);
  });

  describe('list', () => {
    it('should call GET /dw/rest/v1/roles', async () => {
      const mockResponse: PagedResponse<Role> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await roles.list();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/roles',
        undefined,
        { resource: 'roles', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: PagedResponse<Role> = {
        content: [],
        page: { number: 1, size: 10, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await roles.list({ page: 1, size: 10 });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/roles',
        { page: 1, size: 10 },
        { resource: 'roles', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should call GET /dw/rest/v1/roles with expand=serviceType', async () => {
      const mockResponse: PagedResponse<RoleExpanded> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await roles.list({ expand: 'serviceType' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/roles',
        { expand: 'serviceType' },
        { resource: 'roles', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should call GET /dw/rest/v1/roles with expand and roleTargetType filter', async () => {
      const mockResponse: PagedResponse<RoleExpanded> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await roles.list({ expand: 'serviceType', roleTargetType: 'User' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/roles',
        { expand: 'serviceType', roleTargetType: 'User' },
        { resource: 'roles', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should call GET /dw/rest/v1/roles with expand, roleTargetType, and pagination', async () => {
      const mockResponse: PagedResponse<RoleExpanded> = {
        content: [],
        page: { number: 1, size: 10, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await roles.list({
        expand: 'serviceType',
        roleTargetType: 'ApiClient',
        page: 1,
        size: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/roles',
        { expand: 'serviceType', roleTargetType: 'ApiClient', page: 1, size: 10 },
        { resource: 'roles', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('get', () => {
    it('should call GET /dw/rest/v1/roles/{id}', async () => {
      const mockRole: Role = {
        id: 'ADMIN',
        description: 'Administrator role',
        roleEnumName: 'ADMIN',
        internalRole: false,
        serviceType: 'ECOM',
        permissions: [],
        scope: 'GLOBAL',
        targetType: 'User',
        twoFAEnabled: false,
        privileged: true,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockRole);

      const result = await roles.get('ADMIN');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/roles/ADMIN',
        undefined,
        { resource: 'roles', operation: 'get' }
      );
      expect(result).toBe(mockRole);
    });

    it('should call GET /dw/rest/v1/roles/{id} with expand=serviceType', async () => {
      const mockRoleExpanded: RoleExpanded = {
        id: 'ADMIN',
        description: 'Administrator role',
        roleEnumName: 'ADMIN',
        internalRole: false,
        serviceType: {
          id: 'ECOM',
          description: 'E-Commerce',
          links: [],
        },
        permissions: [],
        scope: 'GLOBAL',
        targetType: 'User',
        twoFAEnabled: false,
        privileged: true,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockRoleExpanded);

      const result = await roles.get('ADMIN', { expand: 'serviceType' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/roles/ADMIN',
        { expand: 'serviceType' },
        { resource: 'roles', operation: 'get' }
      );
      expect(result).toBe(mockRoleExpanded);
    });
  });

});

describe('RealmsResource', () => {
  let httpClient: HttpClient;
  let realms: RealmsResource;

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
    } as unknown as HttpClient;
    realms = new RealmsResource(httpClient);
  });

  describe('list', () => {
    it('should call GET /dw/rest/v1/realms', async () => {
      const mockResponse: PagedResponse<Realm> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await realms.list();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/realms',
        undefined,
        { resource: 'realms', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: PagedResponse<Realm> = {
        content: [],
        page: { number: 1, size: 10, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await realms.list({ page: 1, size: 10 });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/realms',
        { page: 1, size: 10 },
        { resource: 'realms', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('get', () => {
    it('should call GET /dw/rest/v1/realms/{id}', async () => {
      const mockRealm: Realm = {
        id: 'zzrf',
        description: 'Test Realm',
        customerName: 'Test Customer',
        organizationId: 'test-org',
        sfAccountId: 'SF-123',
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockRealm);

      const result = await realms.get('zzrf');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/realms/zzrf',
        undefined,
        { resource: 'realms', operation: 'get' }
      );
      expect(result).toBe(mockRealm);
    });
  });
});

describe('PermissionsResource', () => {
  let httpClient: HttpClient;
  let permissions: PermissionsResource;

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
    } as unknown as HttpClient;
    permissions = new PermissionsResource(httpClient);
  });

  describe('list', () => {
    it('should call GET /dw/rest/v1/permissions', async () => {
      const mockResponse: ContentResponse<Permission> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await permissions.list();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/permissions',
        undefined,
        { resource: 'permissions', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: ContentResponse<Permission> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await permissions.list({ page: 1, size: 10 });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/permissions',
        { page: 1, size: 10 },
        { resource: 'permissions', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include adminPermission filter', async () => {
      const mockResponse: ContentResponse<Permission> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await permissions.list({ adminPermission: true });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/permissions',
        { adminPermission: true },
        { resource: 'permissions', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('get', () => {
    it('should call GET /dw/rest/v1/permissions/{name}', async () => {
      const mockPermission: Permission = {
        name: 'READ_USER',
        adminPermission: false,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockPermission);

      const result = await permissions.get('READ_USER');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/permissions/READ_USER',
        undefined,
        { resource: 'permissions', operation: 'get' }
      );
      expect(result).toBe(mockPermission);
    });
  });
});

describe('ServiceTypesResource', () => {
  let httpClient: HttpClient;
  let serviceTypes: ServiceTypesResource;

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;
    serviceTypes = new ServiceTypesResource(httpClient);
  });

  describe('list', () => {
    it('should call GET /dw/rest/v1/service-types', async () => {
      const mockResponse: PagedResponse<ServiceType> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await serviceTypes.list();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/service-types',
        undefined,
        { resource: 'serviceTypes', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: PagedResponse<ServiceType> = {
        content: [],
        page: { number: 1, size: 10, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await serviceTypes.list({ page: 1, size: 10 });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/service-types',
        { page: 1, size: 10 },
        { resource: 'serviceTypes', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('get', () => {
    it('should call GET /dw/rest/v1/service-types/{id}', async () => {
      const mockServiceType: ServiceType = {
        id: 'ECOM',
        description: 'E-Commerce',
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockServiceType);

      const result = await serviceTypes.get('ECOM');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/service-types/ECOM',
        undefined,
        { resource: 'serviceTypes', operation: 'get' }
      );
      expect(result).toBe(mockServiceType);
    });
  });

});

describe('OrganizationConfigurationResource', () => {
  let httpClient: HttpClient;
  let organizationConfiguration: OrganizationConfigurationResource;

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
    } as unknown as HttpClient;
    organizationConfiguration = new OrganizationConfigurationResource(httpClient);
  });

  describe('get', () => {
    it('should call GET /dw/rest/v1/configurations/organization', async () => {
      const mockConfig: OrganizationConfiguration = {
        allowedSfMyDomainSuffixes: ['example.my.salesforce.com', 'test.my.salesforce.com'],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockConfig);

      const result = await organizationConfiguration.get();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/configurations/organization',
        undefined,
        { resource: 'organizationConfiguration', operation: 'get' }
      );
      expect(result).toBe(mockConfig);
    });
  });
});
