import type { HttpClient } from '../client.js';
import type { ServiceType, PagedResponse, PaginationOptions } from '../types/index.js';

export type ListServiceTypesOptions = PaginationOptions;

/**
 * Resource class for managing service types in the Account Manager API.
 * Provides methods for listing and retrieving service type definitions.
 */
export class ServiceTypesResource {
  private readonly http: HttpClient;

  constructor(httpClient: HttpClient) {
    this.http = httpClient;
  }

  /**
   * List all service types with optional pagination.
   * @param opts - Pagination options
   * @returns Paginated list of service types
   */
  async list(opts?: ListServiceTypesOptions): Promise<PagedResponse<ServiceType>> {
    const params: Record<string, unknown> = {};

    if (opts) {
      if (opts.page !== undefined) params.page = opts.page;
      if (opts.size !== undefined) params.size = opts.size;
    }

    return this.http.get<PagedResponse<ServiceType>>(
      '/dw/rest/v1/service-types',
      Object.keys(params).length > 0 ? params : undefined,
      { resource: 'serviceTypes', operation: 'list' }
    );
  }

  /**
   * Get a specific service type by ID.
   * @param id - Service type ID (e.g. "ECOM", "CDN")
   * @returns Service type resource
   */
  async get(id: string): Promise<ServiceType> {
    return this.http.get<ServiceType>(
      `/dw/rest/v1/service-types/${id}`,
      undefined,
      { resource: 'serviceTypes', operation: 'get' }
    );
  }

}
