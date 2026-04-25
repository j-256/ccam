import type { HttpClient } from '../client.js';
import type { Role, RoleExpanded, PagedResponse, PaginationOptions, SortOption, RoleSortField } from '../types/index.js';
import { formatSort } from './sort.js';

export interface ListRolesOptions extends PaginationOptions {
  /**
   * Sort field. Prefer values from {@link RoleSortField} for IDE autocomplete
   * and to avoid server-side 400 on non-sortable fields. Accepts any string
   * to tolerate server-side additions.
   */
  sort?: SortOption<RoleSortField | string>;
}

export interface ListRolesExpandedOptions extends PaginationOptions {
  expand: 'serviceType';
  roleTargetType?: string;
  /**
   * Sort field. Prefer values from {@link RoleSortField} for IDE autocomplete
   * and to avoid server-side 400 on non-sortable fields. Accepts any string
   * to tolerate server-side additions.
   */
  sort?: SortOption<RoleSortField | string>;
}

/**
 * Resource class for managing roles in the Account Manager API.
 * Provides methods for listing and retrieving role definitions.
 */
export class RolesResource {
  private readonly http: HttpClient;

  constructor(httpClient: HttpClient) {
    this.http = httpClient;
  }

  /**
   * List all roles with optional pagination and sorting.
   * @param opts - Pagination and sort options
   * @returns Paginated list of roles
   */
  async list(opts?: ListRolesOptions): Promise<PagedResponse<Role>>;

  /**
   * List all roles with serviceType expanded to full objects.
   * @param opts - Expand, filter, pagination and sort options
   * @returns Paginated list of roles with expanded serviceType
   */
  async list(opts: ListRolesExpandedOptions): Promise<PagedResponse<RoleExpanded>>;

  async list(opts?: ListRolesOptions | ListRolesExpandedOptions): Promise<PagedResponse<Role> | PagedResponse<RoleExpanded>> {
    const params: Record<string, unknown> = {};

    if (opts) {
      if (opts.page !== undefined) params.page = opts.page;
      if (opts.size !== undefined) params.size = opts.size;
      const sort = formatSort(opts.sort);
      if (sort) params.sort = sort;

      if ('expand' in opts && opts.expand) {
        params.expand = opts.expand;
      }
      if ('roleTargetType' in opts && opts.roleTargetType !== undefined) {
        params.roleTargetType = opts.roleTargetType;
      }
    }

    return this.http.get<PagedResponse<Role>>(
      '/dw/rest/v1/roles',
      Object.keys(params).length > 0 ? params : undefined,
      { resource: 'roles', operation: 'list' }
    );
  }

  /**
   * Get a specific role by ID.
   * @param id - Role ID (e.g. "account-admin", "user-admin")
   * @returns Role resource
   */
  async get(id: string): Promise<Role>;

  /**
   * Get a specific role by ID with serviceType expanded to a full object.
   * @param id - Role ID (e.g. "account-admin", "user-admin")
   * @param opts - Expand options
   * @returns Role with expanded serviceType
   */
  async get(id: string, opts: { expand: 'serviceType' }): Promise<RoleExpanded>;

  async get(id: string, opts?: { expand: 'serviceType' }): Promise<Role | RoleExpanded> {
    const params: Record<string, unknown> | undefined = opts?.expand ? { expand: opts.expand } : undefined;

    return this.http.get<Role>(
      `/dw/rest/v1/roles/${id}`,
      params,
      { resource: 'roles', operation: 'get' }
    );
  }

}
