import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstancesResource } from '../../resources/instances.js';
import { HttpClient } from '../../client.js';
import type { Instance, PagedResponse, ContentResponse } from '../../types/index.js';

describe('InstancesResource', () => {
  let httpClient: HttpClient;
  let instances: InstancesResource;

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as HttpClient;
    instances = new InstancesResource(httpClient);
  });

  describe('list', () => {
    it('should call GET /dw/rest/v1/instances', async () => {
      const mockResponse: PagedResponse<Instance> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await instances.list();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances',
        undefined,
        { resource: 'instances', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: PagedResponse<Instance> = {
        content: [],
        page: { number: 1, size: 10, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await instances.list({ page: 1, size: 10 });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances',
        { page: 1, size: 10 },
        { resource: 'instances', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include sort param', async () => {
      const mockResponse: PagedResponse<Instance> = {
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await instances.list({ sort: { field: 'id', direction: 'asc' } });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances',
        { sort: 'id,asc' },
        { resource: 'instances', operation: 'list' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('get', () => {
    it('should call GET /dw/rest/v1/instances/{id}', async () => {
      const mockInstance: Instance = {
        id: 'aabc_prd',
        description: 'Production instance',
        podId: 'pod-1',
        tenantType: 'prd',
        inactiveSinceTimestamp: null,
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockInstance);

      const result = await instances.get('aabc_prd');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances/aabc_prd',
        undefined,
        { resource: 'instances', operation: 'get' }
      );
      expect(result).toBe(mockInstance);
    });
  });

  describe('search.findByOrganization', () => {
    it('should call GET /dw/rest/v1/instances/search/findByOrganization', async () => {
      const mockResponse: ContentResponse<Instance> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await instances.search.findByOrganization({ organization: 'org-123' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances/search/findByOrganization',
        { organization: 'org-123' },
        { resource: 'instances', operation: 'search.findByOrganization' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: ContentResponse<Instance> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await instances.search.findByOrganization({
        organization: 'org-123',
        page: 1,
        size: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances/search/findByOrganization',
        { organization: 'org-123', page: 1, size: 10 },
        { resource: 'instances', operation: 'search.findByOrganization' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('search.findByRealm', () => {
    it('should call GET /dw/rest/v1/instances/search/findByRealm', async () => {
      const mockResponse: ContentResponse<Instance> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await instances.search.findByRealm({ realm: 'zzrf' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances/search/findByRealm',
        { realm: 'zzrf' },
        { resource: 'instances', operation: 'search.findByRealm' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle comma-separated realm IDs', async () => {
      const mockResponse: ContentResponse<Instance> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await instances.search.findByRealm({ realm: 'zzrf,aabc,test' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances/search/findByRealm',
        { realm: 'zzrf,aabc,test' },
        { resource: 'instances', operation: 'search.findByRealm' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: ContentResponse<Instance> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await instances.search.findByRealm({
        realm: 'zzrf',
        page: 1,
        size: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances/search/findByRealm',
        { realm: 'zzrf', page: 1, size: 10 },
        { resource: 'instances', operation: 'search.findByRealm' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('search.findById', () => {
    it('should call GET /dw/rest/v1/instances/search/findById', async () => {
      const mockResponse: ContentResponse<Instance> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await instances.search.findById({ id: 'aabc_prd' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances/search/findById',
        { id: 'aabc_prd' },
        { resource: 'instances', operation: 'search.findById' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle comma-separated instance IDs', async () => {
      const mockResponse: ContentResponse<Instance> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await instances.search.findById({ id: 'aabc_prd,zzrf_dev,test_sbx' });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances/search/findById',
        { id: 'aabc_prd,zzrf_dev,test_sbx' },
        { resource: 'instances', operation: 'search.findById' }
      );
      expect(result).toBe(mockResponse);
    });

    it('should include pagination params', async () => {
      const mockResponse: ContentResponse<Instance> = {
        content: [],
        links: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await instances.search.findById({
        id: 'aabc_prd',
        page: 1,
        size: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/dw/rest/v1/instances/search/findById',
        { id: 'aabc_prd', page: 1, size: 10 },
        { resource: 'instances', operation: 'search.findById' }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('validateFilter', () => {
    it('should POST to /dw/rest/v1/instances/validatefilter', async () => {
      vi.mocked(httpClient.post).mockResolvedValue(undefined);

      await instances.validateFilter('aalm_prd');

      expect(httpClient.post).toHaveBeenCalledWith(
        '/dw/rest/v1/instances/validatefilter',
        { tenantfilter: 'aalm_prd' },
        undefined,
        { resource: 'instances', operation: 'validateFilter' }
      );
    });
  });
});
