import type { HttpClient } from '../client.js';
import type { Realm, PagedResponse, PaginationOptions, SortOption } from '../types/index.js';
import { formatSort } from './sort.js';

export interface ListRealmsOptions extends PaginationOptions {
  sort?: SortOption<string>;
}

/**
 * Resource class for managing realms (instances) in the Account Manager API.
 * Provides methods for listing and retrieving realm information.
 */
export class RealmsResource {
  private readonly http: HttpClient;

  constructor(httpClient: HttpClient) {
    this.http = httpClient;
  }

  /**
   * List all realms with optional pagination and sorting.
   * @param opts - Pagination and sort options
   * @returns Paginated list of realms
   */
  async list(opts?: ListRealmsOptions): Promise<PagedResponse<Realm>> {
    const params: Record<string, unknown> = {};

    if (opts) {
      if (opts.page !== undefined) params.page = opts.page;
      if (opts.size !== undefined) params.size = opts.size;
      const sort = formatSort(opts.sort);
      if (sort) params.sort = sort;
    }

    return this.http.get<PagedResponse<Realm>>(
      '/dw/rest/v1/realms',
      Object.keys(params).length > 0 ? params : undefined,
      { resource: 'realms', operation: 'list' }
    );
  }

  /**
   * Get a specific realm by ID.
   * @param id - Realm ID (4-character code, e.g. "zzrf")
   * @returns Realm resource
   */
  async get(id: string): Promise<Realm> {
    return this.http.get<Realm>(
      `/dw/rest/v1/realms/${id}`,
      undefined,
      { resource: 'realms', operation: 'get' }
    );
  }
}
