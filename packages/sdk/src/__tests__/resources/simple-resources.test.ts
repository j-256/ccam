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
    it('should call GET /dw/rest/v1/apiclients/', async () => {
      const mockResponse: PagedResponse<ApiClient> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await apiClients.list();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/apiclients/',
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
        '/dw/rest/v1/apiclients/',
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
