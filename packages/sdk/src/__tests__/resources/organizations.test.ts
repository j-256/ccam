import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationsResource } from '../../resources/organizations.js';
import { HttpClient } from '../../client.js';
import type { Organization, Realm, RealmExpanded, Instance, ContentResponse, PagedResponse, AuditLogRecord, SfMyDomainVerificationResponse } from '../../types/index.js';

describe('OrganizationsResource', () => {
  let httpClient: HttpClient;
  let organizations: OrganizationsResource;

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;
    organizations = new OrganizationsResource(httpClient);
  });

  describe('list', () => {
    it('should call GET /dw/rest/v1/organizations with no params', async () => {
      const mockResponse: PagedResponse<Organization> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.list();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations',
        undefined,
        { resource: 'organizations', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should call GET /dw/rest/v1/organizations with pagination params', async () => {
      const mockResponse: PagedResponse<Organization> = {
        content: [],
        page: { number: 1, size: 10, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.list({ page: 1, size: 10 });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations',
        { page: 1, size: 10 },
        { resource: 'organizations', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('get', () => {
    it('should call GET /dw/rest/v1/organizations/{id}', async () => {
      const mockOrg: Organization = {
        id: 'org-123',
        name: 'Test Org',
        contactUsers: [],
        realms: [],
        emailDomains: [],
        passwordMinEntropy: 0,
        passwordHistorySize: 0,
        passwordDaysExpiration: 0,
        sfAccountIds: [],
        type: 'STANDARD',
        twoFARoles: [],
        twoFAEnabled: false,
        sfMyDomain: null,
        sfMyDomainSuffix: '.my.salesforce.com',
        sfMyDomainVerified: false,
        sfMyDomainVerificationTimestamp: null,
        sfIdentityFederation: 'DISABLED',
        justInTimeUserProvisioningEnabled: false,
        allowedVerifierTypes: [],
        disableInactiveUsers: false,
        inactiveUserDays: 0,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockOrg);

      const result = await organizations.get('org-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/org-123',
        undefined,
        { resource: 'organizations', operation: 'get' }
      );
      expect(result).toBe(mockOrg);
    });
  });

  describe('search.findByName', () => {
    it('should call GET /dw/rest/v1/organizations/search/findByName with term param', async () => {
      const mockResponse: ContentResponse<Organization> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.search.findByName({ term: 'Test' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/search/findByName',
        { term: 'Test' },
        { resource: 'organizations', operation: 'search.findByName' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should call GET /dw/rest/v1/organizations/search/findByName with startsWith and ignoreCase', async () => {
      const mockResponse: ContentResponse<Organization> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.search.findByName({
        startsWith: 'Test',
        ignoreCase: true,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/search/findByName',
        { startsWith: 'Test', ignoreCase: true },
        { resource: 'organizations', operation: 'search.findByName' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: ContentResponse<Organization> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.search.findByName({
        term: 'Test',
        page: 1,
        size: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/search/findByName',
        { term: 'Test', page: 1, size: 10 },
        { resource: 'organizations', operation: 'search.findByName' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('search.findBySfAccountId', () => {
    it('should call GET /dw/rest/v1/organizations/search/findBySfAccountId', async () => {
      const mockResponse: ContentResponse<Organization> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.search.findBySfAccountId({
        sfAccountId: 'SF-123',
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/search/findBySfAccountId',
        { sfAccountId: 'SF-123' },
        { resource: 'organizations', operation: 'search.findBySfAccountId' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: ContentResponse<Organization> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.search.findBySfAccountId({
        sfAccountId: 'SF-123',
        page: 1,
        size: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/search/findBySfAccountId',
        { sfAccountId: 'SF-123', page: 1, size: 10 },
        { resource: 'organizations', operation: 'search.findBySfAccountId' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('realms', () => {
    it('should call GET /dw/rest/v1/organizations/{id}/realms', async () => {
      const mockResponse: ContentResponse<Realm> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.realms('org-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/org-123/realms',
        undefined,
        { resource: 'organizations', operation: 'realms' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should call GET /dw/rest/v1/organizations/{id}/realms with expand=instance', async () => {
      const mockInstance: Instance = {
        id: 'zzrf_prd',
        description: 'Production instance',
        podId: 'pod1',
        tenantType: 'prd',
        inactiveSinceTimestamp: null,
        links: [],
      };

      const mockRealmExpanded: RealmExpanded = {
        id: 'zzrf',
        description: 'Test Realm',
        customerName: 'Test Customer',
        organizationId: 'org-123',
        sfAccountId: 'SF-123',
        instances: [mockInstance],
        links: [],
      };

      const mockResponse: ContentResponse<RealmExpanded> = {
        content: [mockRealmExpanded],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.realms('org-123', { expand: 'instance' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/org-123/realms',
        { expand: 'instance' },
        { resource: 'organizations', operation: 'realms' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('instances', () => {
    it('should call GET /dw/rest/v1/organizations/{id}/instances', async () => {
      const mockInstance: Instance = {
        id: 'zzrf_prd',
        description: 'Production instance',
        podId: 'pod1',
        tenantType: 'prd',
        inactiveSinceTimestamp: null,
        links: [],
      };

      const mockResponse: ContentResponse<Instance> = {
        content: [mockInstance],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.instances('org-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/org-123/instances',
        undefined,
        { resource: 'organizations', operation: 'instances' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getSfMyDomainVerification', () => {
    it('should call GET /dw/rest/v1/organizations/{id}/sf-my-domain-verification', async () => {
      const mockResponse: SfMyDomainVerificationResponse = {
        verificationUri: 'https://example.my.salesforce.com/.well-known/sfcc-verification/abc123',
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.getSfMyDomainVerification('org-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/org-123/sf-my-domain-verification',
        undefined,
        { resource: 'organizations', operation: 'getSfMyDomainVerification' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('auditLogs', () => {
    it('should call GET /dw/rest/v1/organizations/{id}/audit-log-records', async () => {
      const mockResponse: ContentResponse<AuditLogRecord> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.auditLogs('org-123');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/org-123/audit-log-records',
        undefined,
        { resource: 'organizations', operation: 'auditLogs' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include querySize param when provided', async () => {
      const mockResponse: ContentResponse<AuditLogRecord> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await organizations.auditLogs('org-123', { querySize: 50 });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/org-123/audit-log-records',
        { querySize: 50 },
        { resource: 'organizations', operation: 'auditLogs' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('update', () => {
    it('should PUT to /dw/rest/v1/organizations/{id}', async () => {
      const body = { name: 'Updated Org' };
      const mockResponse = { id: 'org-123', name: 'Updated Org', links: [] } as unknown as Organization;
      vi.mocked(httpClient.put).mockResolvedValue(mockResponse);

      const result = await organizations.update('org-123', body);

      expect(httpClient.put).toHaveBeenCalledWith(
        '/dw/rest/v1/organizations/org-123',
        body,
        undefined,
        { resource: 'organizations', operation: 'update' }
      );
      expect(result).toBe(mockResponse);
    });
  });
});
