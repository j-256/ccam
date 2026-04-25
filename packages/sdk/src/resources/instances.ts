import type { HttpClient } from '../client.js';
import type { Instance, PagedResponse, ContentResponse, PaginationOptions, SortOption } from '../types/index.js';
import { formatSort } from './sort.js';

export interface ListInstancesOptions extends PaginationOptions {
  /** Per AM docs, instances have no documented sortable fields. Passing `sort` will be sent to the server and likely rejected. */
  sort?: SortOption<string>;
}

export interface FindByOrganizationOptions extends PaginationOptions {
  organization: string;
}

export interface FindByRealmOptions extends PaginationOptions {
  realm: string;
}

export interface FindByIdOptions extends PaginationOptions {
  id: string;
}

/**
 * Resource class for managing instances in the Account Manager API.
 * Provides methods for listing and searching instance information.
 */
export class InstancesResource {
  private readonly http: HttpClient;

  readonly search: {
    findByOrganization: (opts: FindByOrganizationOptions) => Promise<ContentResponse<Instance>>;
    findByRealm: (opts: FindByRealmOptions) => Promise<ContentResponse<Instance>>;
    findById: (opts: FindByIdOptions) => Promise<ContentResponse<Instance>>;
  };

  constructor(httpClient: HttpClient) {
    this.http = httpClient;

    this.search = {
      findByOrganization: (opts) => this.findByOrganization(opts),
      findByRealm: (opts) => this.findByRealm(opts),
      findById: (opts) => this.findById(opts),
    };
  }

  /**
   * List all instances with optional pagination and sorting.
   * @param opts - Pagination and sort options
   * @returns Paginated list of instances
   */
  async list(opts?: ListInstancesOptions): Promise<PagedResponse<Instance>> {
    const params: Record<string, unknown> = {};

    if (opts) {
      if (opts.page !== undefined) params.page = opts.page;
      if (opts.size !== undefined) params.size = opts.size;
      const sort = formatSort(opts.sort);
      if (sort) params.sort = sort;
    }

    return this.http.get<PagedResponse<Instance>>(
      '/dw/rest/v1/instances',
      Object.keys(params).length > 0 ? params : undefined,
      { resource: 'instances', operation: 'list' }
    );
  }

  /**
   * Get a specific instance by ID.
   * @param id - Instance ID in REALM_TYPE format (e.g. "aabc_prd")
   * @returns Instance resource
   */
  async get(id: string): Promise<Instance> {
    return this.http.get<Instance>(
      `/dw/rest/v1/instances/${id}`,
      undefined,
      { resource: 'instances', operation: 'get' }
    );
  }

  /**
   * Find instances by organization.
   * @param opts - Organization ID and pagination options
   * @returns List of instances
   */
  private async findByOrganization(opts: FindByOrganizationOptions): Promise<ContentResponse<Instance>> {
    const params: Record<string, unknown> = { organization: opts.organization };
    if (opts.page !== undefined) params.page = opts.page;
    if (opts.size !== undefined) params.size = opts.size;

    return this.http.get<ContentResponse<Instance>>(
      '/dw/rest/v1/instances/search/findByOrganization',
      params,
      { resource: 'instances', operation: 'search.findByOrganization' }
    );
  }

  /**
   * Find instances by realm (comma-separated realm IDs).
   * @param opts - Comma-separated realm IDs and pagination options
   * @returns List of instances
   */
  private async findByRealm(opts: FindByRealmOptions): Promise<ContentResponse<Instance>> {
    const params: Record<string, unknown> = { realm: opts.realm };
    if (opts.page !== undefined) params.page = opts.page;
    if (opts.size !== undefined) params.size = opts.size;

    return this.http.get<ContentResponse<Instance>>(
      '/dw/rest/v1/instances/search/findByRealm',
      params,
      { resource: 'instances', operation: 'search.findByRealm' }
    );
  }

  /**
   * Find instances by ID (comma-separated instance IDs).
   * @param opts - Comma-separated instance IDs and pagination options
   * @returns List of instances
   */
  private async findById(opts: FindByIdOptions): Promise<ContentResponse<Instance>> {
    const params: Record<string, unknown> = { id: opts.id };
    if (opts.page !== undefined) params.page = opts.page;
    if (opts.size !== undefined) params.size = opts.size;

    return this.http.get<ContentResponse<Instance>>(
      '/dw/rest/v1/instances/search/findById',
      params,
      { resource: 'instances', operation: 'search.findById' }
    );
  }

  /**
   * Validate a tenant filter string.
   * Returns successfully if valid; throws CcamError (400) if invalid.
   * @param filter - Tenant filter string (e.g. "aalm_prd")
   */
  async validateFilter(filter: string): Promise<void> {
    return this.http.post<void>(
      '/dw/rest/v1/instances/validatefilter',
      { tenantfilter: filter },
      undefined,
      { resource: 'instances', operation: 'validateFilter' }
    );
  }
}
