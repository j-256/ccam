import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersResource } from '../../resources/users.js';
import { HttpClient } from '../../client.js';
import type { User, UserExpanded, UserExpandedRoles, UserExpandedAll, ContentResponse, PagedResponse, AuditLogRecord, Role, Realm, Instance } from '../../types/index.js';

describe('UsersResource', () => {
  let httpClient: HttpClient;
  let users: UsersResource;

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;
    users = new UsersResource(httpClient);
  });

  describe('list', () => {
    it('should call GET /dw/rest/v1/users with no params', async () => {
      const mockResponse: PagedResponse<User> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.list();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users',
        undefined,
        { resource: 'users', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should call GET /dw/rest/v1/users with pagination params', async () => {
      const mockResponse: PagedResponse<User> = {
        content: [],
        page: { number: 1, size: 10, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.list({ page: 1, size: 10 });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users',
        { page: 1, size: 10 },
        { resource: 'users', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should call GET /dw/rest/v1/users with sort param', async () => {
      const mockResponse: PagedResponse<User> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.list({ sort: { field: 'mail', direction: 'asc' } });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users',
        { sort: 'mail,asc' },
        { resource: 'users', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('get', () => {
    it('should call GET /dw/rest/v1/users/{id}', async () => {
      const mockUser: User = {
        id: 'user-123',
        mail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        businessPhone: null,
        homePhone: null,
        mobilePhone: null,
        preferredLocale: null,
        roles: [],
        primaryOrganization: 'org-123',
        organizations: ['org-123'],
        roleTenantFilter: '',
        roleTenantFilterMap: {},
        passwordExpirationTimestamp: null,
        passwordModificationTimestamp: null,
        createdAt: '2026-01-01T00:00:00Z',
        lastModified: '2026-01-01T00:00:00Z',
        lastLoginDate: null,
        userState: 'ENABLED',
        activationCodeCreationTimestamp: null,
        sfUserId: null,
        verifiers: [],
        deleteTimestamp: null,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockUser);

      const result = await users.get('user-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123',
        undefined,
        { resource: 'users', operation: 'get' }
      );
      expect(result).toBe(mockUser);
    });
  });

  describe('getByLogin', () => {
    it('should call GET /dw/rest/v1/users/search/findByLogin with login param', async () => {
      const mockUser: User = {
        id: 'user-123',
        mail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        businessPhone: null,
        homePhone: null,
        mobilePhone: null,
        preferredLocale: null,
        roles: [],
        primaryOrganization: 'org-123',
        organizations: ['org-123'],
        roleTenantFilter: '',
        roleTenantFilterMap: {},
        passwordExpirationTimestamp: null,
        passwordModificationTimestamp: null,
        createdAt: '2026-01-01T00:00:00Z',
        lastModified: '2026-01-01T00:00:00Z',
        lastLoginDate: null,
        userState: 'ENABLED',
        activationCodeCreationTimestamp: null,
        sfUserId: null,
        verifiers: [],
        deleteTimestamp: null,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockUser);

      const result = await users.getByLogin('test@example.com');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/search/findByLogin',
        { login: 'test@example.com' },
        { resource: 'users', operation: 'getByLogin' }
      );
      expect(result).toBe(mockUser);
    });

    it('should call GET /dw/rest/v1/users/search/findByLogin with expand param', async () => {
      const mockUserExpanded: UserExpanded = {
        id: 'user-123',
        mail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        businessPhone: null,
        homePhone: null,
        mobilePhone: null,
        preferredLocale: null,
        roles: [],
        primaryOrganization: 'org-123',
        organizations: [],
        roleTenantFilter: '',
        roleTenantFilterMap: {},
        passwordExpirationTimestamp: null,
        passwordModificationTimestamp: null,
        createdAt: '2026-01-01T00:00:00Z',
        lastModified: '2026-01-01T00:00:00Z',
        lastLoginDate: null,
        userState: 'ENABLED',
        activationCodeCreationTimestamp: null,
        sfUserId: null,
        verifiers: [],
        deleteTimestamp: null,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockUserExpanded);

      const result = await users.getByLogin('test@example.com', { expand: 'organizations' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/search/findByLogin',
        { login: 'test@example.com', expand: 'organizations' },
        { resource: 'users', operation: 'getByLogin' }
      );
      expect(result).toBe(mockUserExpanded);
    });
  });

  describe('search.findByOrg', () => {
    it('should call GET /dw/rest/v1/users/search/findByOrg', async () => {
      const mockResponse: ContentResponse<User> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.search.findByOrg({ organization: 'org-123' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/search/findByOrg',
        { organization: 'org-123' },
        { resource: 'users', operation: 'search.findByOrg' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: ContentResponse<User> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.search.findByOrg({
        organization: 'org-123',
        page: 1,
        size: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/search/findByOrg',
        { organization: 'org-123', page: 1, size: 10 },
        { resource: 'users', operation: 'search.findByOrg' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('search.findAllByOrg', () => {
    it('should call GET /dw/rest/v1/users/search/findAllByOrg', async () => {
      const mockResponse: ContentResponse<User> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.search.findAllByOrg({ organization: 'org-123' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/search/findAllByOrg',
        { organization: 'org-123' },
        { resource: 'users', operation: 'search.findAllByOrg' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('search.findByRole', () => {
    it('should call GET /dw/rest/v1/users/search/findByRole with role param', async () => {
      const mockResponse: PagedResponse<User> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.search.findByRole({ role: 'ADMIN' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/search/findByRole',
        { role: 'ADMIN' },
        { resource: 'users', operation: 'search.findByRole' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include optional modifiedAfter param', async () => {
      const mockResponse: PagedResponse<User> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.search.findByRole({
        role: 'ADMIN',
        modifiedAfter: '2026-01-01',
        page: 0,
        size: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/search/findByRole',
        { role: 'ADMIN', modifiedAfter: '2026-01-01', page: 0, size: 10 },
        { resource: 'users', operation: 'search.findByRole' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('search.findByOrgAndRole', () => {
    it('should call GET /dw/rest/v1/users/search/findByOrgAndRole', async () => {
      const mockResponse: ContentResponse<User> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.search.findByOrgAndRole({
        organization: 'org-123',
        role: 'ADMIN',
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/search/findByOrgAndRole',
        { organization: 'org-123', role: 'ADMIN' },
        { resource: 'users', operation: 'search.findByOrgAndRole' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('search.findByOrgRealmAccess', () => {
    it('should call GET /dw/rest/v1/users/search/findByOrgRealmAccess', async () => {
      const mockResponse: ContentResponse<User> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.search.findByOrgRealmAccess({ organization: 'org-123' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/search/findByOrgRealmAccess',
        { organization: 'org-123' },
        { resource: 'users', operation: 'search.findByOrgRealmAccess' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('auditLogs', () => {
    it('should call GET /dw/rest/v1/users/{id}/audit-log-records', async () => {
      const mockResponse: ContentResponse<AuditLogRecord> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.auditLogs('user-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123/audit-log-records',
        undefined,
        { resource: 'users', operation: 'auditLogs' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include querySize param when provided', async () => {
      const mockResponse: ContentResponse<AuditLogRecord> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.auditLogs('user-123', { querySize: 50 });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123/audit-log-records',
        { querySize: 50 },
        { resource: 'users', operation: 'auditLogs' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should throw when querySize is 0', async () => {
      await expect(users.auditLogs('user-123', { querySize: 0 })).rejects.toThrow(
        /querySize must be a positive integer/
      );
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should throw when querySize is negative', async () => {
      await expect(users.auditLogs('user-123', { querySize: -1 })).rejects.toThrow(
        /querySize must be a positive integer/
      );
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should throw when querySize is non-integer', async () => {
      await expect(users.auditLogs('user-123', { querySize: 1.5 })).rejects.toThrow(
        /querySize must be a positive integer/
      );
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should throw when querySize exceeds 1000', async () => {
      await expect(users.auditLogs('user-123', { querySize: 10000 })).rejects.toThrow(
        /querySize must be <= 1000/
      );
      expect(httpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('current', () => {
    it('should call GET /dw/rest/v1/users/current', async () => {
      const mockUser: User = {
        id: 'user-123',
        mail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        businessPhone: null,
        homePhone: null,
        mobilePhone: null,
        preferredLocale: null,
        roles: [],
        primaryOrganization: 'org-123',
        organizations: ['org-123'],
        roleTenantFilter: '',
        roleTenantFilterMap: {},
        passwordExpirationTimestamp: null,
        passwordModificationTimestamp: null,
        createdAt: '2026-01-01T00:00:00Z',
        lastModified: '2026-01-01T00:00:00Z',
        lastLoginDate: null,
        userState: 'ENABLED',
        activationCodeCreationTimestamp: null,
        sfUserId: null,
        verifiers: [],
        deleteTimestamp: null,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockUser);

      const result = await users.current();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/current',
        undefined,
        { resource: 'users', operation: 'current' }
      );
      expect(result).toBe(mockUser);
    });

    it('should call GET /dw/rest/v1/users/current with expand=organizations', async () => {
      const mockUserExpanded: UserExpanded = {
        id: 'user-123',
        mail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        businessPhone: null,
        homePhone: null,
        mobilePhone: null,
        preferredLocale: null,
        roles: [],
        primaryOrganization: 'org-123',
        organizations: [],
        roleTenantFilter: '',
        roleTenantFilterMap: {},
        passwordExpirationTimestamp: null,
        passwordModificationTimestamp: null,
        createdAt: '2026-01-01T00:00:00Z',
        lastModified: '2026-01-01T00:00:00Z',
        lastLoginDate: null,
        userState: 'ENABLED',
        activationCodeCreationTimestamp: null,
        sfUserId: null,
        verifiers: [],
        deleteTimestamp: null,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockUserExpanded);

      const result = await users.current({ expand: 'organizations' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/current',
        { expand: 'organizations' },
        { resource: 'users', operation: 'current' }
      );
      expect(result).toBe(mockUserExpanded);
    });

    it('should call GET /dw/rest/v1/users/current with expand=roles', async () => {
      const mockUserExpandedRoles: UserExpandedRoles = {
        id: 'user-123',
        mail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        businessPhone: null,
        homePhone: null,
        mobilePhone: null,
        preferredLocale: null,
        roles: [],
        primaryOrganization: 'org-123',
        organizations: ['org-123'],
        roleTenantFilter: '',
        roleTenantFilterMap: {},
        passwordExpirationTimestamp: null,
        passwordModificationTimestamp: null,
        createdAt: '2026-01-01T00:00:00Z',
        lastModified: '2026-01-01T00:00:00Z',
        lastLoginDate: null,
        userState: 'ENABLED',
        activationCodeCreationTimestamp: null,
        sfUserId: null,
        verifiers: [],
        deleteTimestamp: null,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockUserExpandedRoles);

      const result = await users.current({ expand: 'roles' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/current',
        { expand: 'roles' },
        { resource: 'users', operation: 'current' }
      );
      expect(result).toBe(mockUserExpandedRoles);
    });

    it('should call GET /dw/rest/v1/users/current with expand=organizations,roles', async () => {
      const mockUserExpandedAll: UserExpandedAll = {
        id: 'user-123',
        mail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        businessPhone: null,
        homePhone: null,
        mobilePhone: null,
        preferredLocale: null,
        roles: [],
        primaryOrganization: 'org-123',
        organizations: [],
        roleTenantFilter: '',
        roleTenantFilterMap: {},
        passwordExpirationTimestamp: null,
        passwordModificationTimestamp: null,
        createdAt: '2026-01-01T00:00:00Z',
        lastModified: '2026-01-01T00:00:00Z',
        lastLoginDate: null,
        userState: 'ENABLED',
        activationCodeCreationTimestamp: null,
        sfUserId: null,
        verifiers: [],
        deleteTimestamp: null,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockUserExpandedAll);

      const result = await users.current({ expand: 'organizations,roles' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/current',
        { expand: 'organizations,roles' },
        { resource: 'users', operation: 'current' }
      );
      expect(result).toBe(mockUserExpandedAll);
    });
  });

  describe('roles', () => {
    it('should call GET /dw/rest/v1/users/{id}/roles', async () => {
      const mockResponse: ContentResponse<Role> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.roles('user-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123/roles',
        undefined,
        { resource: 'users', operation: 'roles' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('instances', () => {
    it('should call GET /dw/rest/v1/users/{id}/instances', async () => {
      const mockResponse: ContentResponse<Instance> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.instances('user-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123/instances',
        undefined,
        { resource: 'users', operation: 'instances' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('assignedRealms', () => {
    it('should call GET /dw/rest/v1/users/{id}/assigned-realms', async () => {
      const mockResponse: ContentResponse<Realm> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.assignedRealms('user-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123/assigned-realms',
        undefined,
        { resource: 'users', operation: 'assignedRealms' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('assignedInstances', () => {
    it('should call GET /dw/rest/v1/users/{id}/assigned-instances', async () => {
      const mockResponse: ContentResponse<Instance> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await users.assignedInstances('user-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123/assigned-instances',
        undefined,
        { resource: 'users', operation: 'assignedInstances' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('create', () => {
    it('should POST to /dw/rest/v1/users', async () => {
      const body = {
        mail: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        primaryOrganization: 'org-123',
      };
      const mockResponse = { id: 'user-new', mail: 'new@example.com', links: [] } as unknown as User;
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const result = await users.create(body);

      expect(httpClient.post).toHaveBeenCalledWith(
        '/dw/rest/v1/users',
        body,
        undefined,
        { resource: 'users', operation: 'create' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('update', () => {
    it('should PUT to /dw/rest/v1/users/{id}', async () => {
      const body = { firstName: 'Updated' };
      const mockResponse = { id: 'user-123', firstName: 'Updated', links: [] } as unknown as User;
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse);

      const result = await users.update('user-123', body);

      expect(httpClient.put).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123',
        body,
        undefined,
        { resource: 'users', operation: 'update' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('delete', () => {
    it('should DELETE /dw/rest/v1/users/{id}', async () => {
      vi.mocked(httpClient.delete).mockResolvedValue(undefined);

      await users.delete('user-123');

      expect(httpClient.delete).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123',
        undefined,
        { resource: 'users', operation: 'delete' }
      );
    });
  });

  describe('reset', () => {
    it('should POST to /dw/rest/v1/users/{id}/reset with empty body', async () => {
      vi.mocked(httpClient.post).mockResolvedValue(undefined);

      await users.reset('user-123');

      expect(httpClient.post).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123/reset',
        {},
        undefined,
        { resource: 'users', operation: 'reset' }
      );
    });

    it('should include supportTicketId when provided', async () => {
      vi.mocked(httpClient.post).mockResolvedValue(undefined);

      await users.reset('user-123', { supportTicketId: 'TICKET-456' });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123/reset',
        { supportTicketId: 'TICKET-456' },
        undefined,
        { resource: 'users', operation: 'reset' }
      );
    });
  });

  describe('disable', () => {
    it('should POST to /dw/rest/v1/users/{id}/disable with empty body', async () => {
      vi.mocked(httpClient.post).mockResolvedValue(undefined);

      await users.disable('user-123');

      expect(httpClient.post).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123/disable',
        {},
        undefined,
        { resource: 'users', operation: 'disable' }
      );
    });

    it('should include supportTicketId when provided', async () => {
      vi.mocked(httpClient.post).mockResolvedValue(undefined);

      await users.disable('user-123', { supportTicketId: 'TICKET-789' });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123/disable',
        { supportTicketId: 'TICKET-789' },
        undefined,
        { resource: 'users', operation: 'disable' }
      );
    });
  });

  describe('revokeVerifier', () => {
    it('should POST to /dw/rest/v1/users/{uid}/revokeVerifier/{vid}', async () => {
      vi.mocked(httpClient.post).mockResolvedValue(undefined);

      await users.revokeVerifier('user-123', 'verifier-456');

      expect(httpClient.post).toHaveBeenCalledWith(
        '/dw/rest/v1/users/user-123/revokeVerifier/verifier-456',
        undefined,
        undefined,
        { resource: 'users', operation: 'revokeVerifier' }
      );
    });
  });
});
