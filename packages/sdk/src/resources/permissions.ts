import type { HttpClient } from '../client.js';
import type { Permission, ContentResponse, PaginationOptions } from '../types/index.js';

export interface ListPermissionsOptions extends PaginationOptions {
  /**
   * Filter permissions by their `adminPermission` flag.
   * Pass `true` to return only admin permissions; pass `false` to return
   * only non-admin. Omit to return all.
   */
  adminPermission?: boolean;
}

/**
 * Resource class for managing permissions in the Account Manager API.
 * Provides methods for listing and retrieving permission definitions.
 */
export class PermissionsResource {
  private readonly http: HttpClient;

  constructor(httpClient: HttpClient) {
    this.http = httpClient;
  }

  /**
   * List all permissions with optional pagination and filtering.
   * @param opts - Pagination and filter options
   * @returns Paginated list of permissions
   */
  async list(opts?: ListPermissionsOptions): Promise<ContentResponse<Permission>> {
    const params: Record<string, unknown> = {};

    if (opts) {
      if (opts.page !== undefined) params.page = opts.page;
      if (opts.size !== undefined) params.size = opts.size;
      if (opts.adminPermission !== undefined) params.adminPermission = opts.adminPermission;
    }

    return this.http.get<ContentResponse<Permission>>(
      '/dw/rest/v1/permissions',
      Object.keys(params).length > 0 ? params : undefined,
      { resource: 'permissions', operation: 'list' }
    );
  }

  /**
   * Get a specific permission by name.
   * @param name - Permission name (e.g. "READ_USER", "WRITE_ORGANIZATION")
   * @returns Permission resource
   */
  async get(name: string): Promise<Permission> {
    return this.http.get<Permission>(
      `/dw/rest/v1/permissions/${name}`,
      undefined,
      { resource: 'permissions', operation: 'get' }
    );
  }
}
