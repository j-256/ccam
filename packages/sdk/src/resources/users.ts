import type { HttpClient } from '../client.js';
import type {
  User,
  UserExpanded,
  UserExpandedRoles,
  UserExpandedAll,
  ContentResponse,
  PagedResponse,
  PaginationOptions,
  SortOption,
  AuditLogRecord,
  AuditLogOptions,
  Role,
  Realm,
  Instance,
  CreateUserRequest,
  UpdateUserRequest,
  ResetUserRequest,
  DisableUserRequest,
} from '../types/index.js';
import { formatSort } from './sort.js';

export interface ListUsersOptions extends PaginationOptions {
  sort?: SortOption<string>;
}

/** Expand options for single-resource endpoints (get, getByLogin) */
export type ExpandUsers = 'organizations' | 'roles' | 'organizations,roles';

export interface GetByLoginOptions {
  expand?: 'organizations';
}

export interface GetUserOptions {
  expand?: ExpandUsers;
}

export interface FindByOrgOptions extends PaginationOptions {
  organization: string;
}

export interface FindByRoleOptions extends PaginationOptions {
  role: string;
  modifiedAfter?: string;
}

export interface FindByOrgAndRoleOptions extends PaginationOptions {
  organization: string;
  role: string;
}

export interface FindByOrgRealmAccessOptions extends PaginationOptions {
  organization: string;
}

/**
 * Resource class for managing users in the Account Manager API.
 * Provides methods for listing, searching, and retrieving user data.
 */
export class UsersResource {
  private readonly http: HttpClient;

  readonly search: {
    findByOrg: (opts: FindByOrgOptions) => Promise<ContentResponse<User>>;
    findAllByOrg: (opts: FindByOrgOptions) => Promise<ContentResponse<User>>;
    findByRole: (opts: FindByRoleOptions) => Promise<PagedResponse<User>>;
    findByOrgAndRole: (opts: FindByOrgAndRoleOptions) => Promise<ContentResponse<User>>;
    findByOrgRealmAccess: (opts: FindByOrgRealmAccessOptions) => Promise<ContentResponse<User>>;
  };

  constructor(httpClient: HttpClient) {
    this.http = httpClient;

    this.search = {
      findByOrg: (opts) => this.findByOrg(opts),
      findAllByOrg: (opts) => this.findAllByOrg(opts),
      findByRole: (opts) => this.findByRole(opts),
      findByOrgAndRole: (opts) => this.findByOrgAndRole(opts),
      findByOrgRealmAccess: (opts) => this.findByOrgRealmAccess(opts),
    };
  }

  /**
   * List all users with optional pagination and sorting.
   * @param opts - Pagination and sort options
   * @returns Paginated list of users
   */
  async list(opts?: ListUsersOptions): Promise<PagedResponse<User>> {
    const params: Record<string, unknown> = {};

    if (opts) {
      if (opts.page !== undefined) params.page = opts.page;
      if (opts.size !== undefined) params.size = opts.size;
      const sort = formatSort(opts.sort);
      if (sort) params.sort = sort;
    }

    return this.http.get<PagedResponse<User>>(
      '/dw/rest/v1/users',
      Object.keys(params).length > 0 ? params : undefined,
      { resource: 'users', operation: 'list' }
    );
  }

  /**
   * Get a specific user by ID.
   * @param id - User UUID
   * @returns User resource
   */
  async get(id: string): Promise<User>;

  /**
   * Get a specific user by ID with expanded organizations.
   * @param id - User UUID
   * @param opts - Expand options
   * @returns User with expanded organizations
   */
  async get(id: string, opts: { expand: 'organizations' }): Promise<UserExpanded>;

  /**
   * Get a specific user by ID with expanded roles.
   * @param id - User UUID
   * @param opts - Expand options
   * @returns User with expanded roles
   */
  async get(id: string, opts: { expand: 'roles' }): Promise<UserExpandedRoles>;

  /**
   * Get a specific user by ID with expanded organizations and roles.
   * @param id - User UUID
   * @param opts - Expand options
   * @returns User with expanded organizations and roles
   */
  async get(id: string, opts: { expand: 'organizations,roles' }): Promise<UserExpandedAll>;

  async get(id: string, opts?: GetUserOptions): Promise<User | UserExpanded | UserExpandedRoles | UserExpandedAll> {
    const params: Record<string, unknown> | undefined = opts?.expand ? { expand: opts.expand } : undefined;

    return this.http.get<User>(
      `/dw/rest/v1/users/${id}`,
      params,
      { resource: 'users', operation: 'get' }
    );
  }

  /**
   * Find a user by login (email address).
   * @param login - User's email address
   * @returns User resource
   */
  async getByLogin(login: string): Promise<User>;

  /**
   * Find a user by login with expanded organizations.
   * @param login - User's email address
   * @param opts - Options including expand parameter
   * @returns User resource with expanded organizations
   */
  async getByLogin(login: string, opts: GetByLoginOptions): Promise<UserExpanded>;

  async getByLogin(
    login: string,
    opts?: GetByLoginOptions
  ): Promise<User | UserExpanded> {
    const params: Record<string, unknown> = { login };

    if (opts?.expand) {
      params.expand = opts.expand;
    }

    return this.http.get<User | UserExpanded>(
      '/dw/rest/v1/users/search/findByLogin',
      params,
      { resource: 'users', operation: 'getByLogin' }
    );
  }

  /**
   * Find users by organization.
   * @param opts - Organization ID and pagination options
   * @returns Paginated list of users
   */
  private async findByOrg(opts: FindByOrgOptions): Promise<ContentResponse<User>> {
    const params: Record<string, unknown> = { organization: opts.organization };
    if (opts.page !== undefined) params.page = opts.page;
    if (opts.size !== undefined) params.size = opts.size;

    return this.http.get<ContentResponse<User>>(
      '/dw/rest/v1/users/search/findByOrg',
      params,
      { resource: 'users', operation: 'search.findByOrg' }
    );
  }

  /**
   * Find all users by organization (including deleted).
   * @param opts - Organization ID and pagination options
   * @returns Paginated list of users
   */
  private async findAllByOrg(opts: FindByOrgOptions): Promise<ContentResponse<User>> {
    const params: Record<string, unknown> = { organization: opts.organization };
    if (opts.page !== undefined) params.page = opts.page;
    if (opts.size !== undefined) params.size = opts.size;

    return this.http.get<ContentResponse<User>>(
      '/dw/rest/v1/users/search/findAllByOrg',
      params,
      { resource: 'users', operation: 'search.findAllByOrg' }
    );
  }

  /**
   * Find users by role.
   * @param opts - Role ID and optional modifiedAfter date
   * @returns Paginated list of users
   */
  private async findByRole(opts: FindByRoleOptions): Promise<PagedResponse<User>> {
    const params: Record<string, unknown> = { role: opts.role };
    if (opts.modifiedAfter !== undefined) params.modifiedAfter = opts.modifiedAfter;
    if (opts.page !== undefined) params.page = opts.page;
    if (opts.size !== undefined) params.size = opts.size;

    return this.http.get<PagedResponse<User>>(
      '/dw/rest/v1/users/search/findByRole',
      params,
      { resource: 'users', operation: 'search.findByRole' }
    );
  }

  /**
   * Find users by organization and role.
   *
   * Note: the AM API only accepts role IDs that map to its internal Java enum.
   * Some valid role IDs (e.g. `ccdx-sbx-user`) are rejected with a
   * "No enum constant" error despite being returned by `roles.list()`.
   *
   * @param opts - Organization ID and role ID
   * @returns Paginated list of users
   */
  private async findByOrgAndRole(opts: FindByOrgAndRoleOptions): Promise<ContentResponse<User>> {
    const params: Record<string, unknown> = {
      organization: opts.organization,
      role: opts.role,
    };
    if (opts.page !== undefined) params.page = opts.page;
    if (opts.size !== undefined) params.size = opts.size;

    return this.http.get<ContentResponse<User>>(
      '/dw/rest/v1/users/search/findByOrgAndRole',
      params,
      { resource: 'users', operation: 'search.findByOrgAndRole' }
    );
  }

  /**
   * Find users with realm access in an organization.
   * @param opts - Organization ID and pagination options
   * @returns Paginated list of users
   */
  private async findByOrgRealmAccess(
    opts: FindByOrgRealmAccessOptions
  ): Promise<ContentResponse<User>> {
    const params: Record<string, unknown> = { organization: opts.organization };
    if (opts.page !== undefined) params.page = opts.page;
    if (opts.size !== undefined) params.size = opts.size;

    return this.http.get<ContentResponse<User>>(
      '/dw/rest/v1/users/search/findByOrgRealmAccess',
      params,
      { resource: 'users', operation: 'search.findByOrgRealmAccess' }
    );
  }

  /**
   * Get audit log records for a user.
   * @param id - User UUID
   * @param opts - Options including querySize
   * @returns List of audit log records (not paginated)
   */
  async auditLogs(id: string, opts?: AuditLogOptions): Promise<ContentResponse<AuditLogRecord>> {
    const params: Record<string, unknown> | undefined = opts?.querySize !== undefined ? { querySize: opts.querySize } : undefined;

    return this.http.get<ContentResponse<AuditLogRecord>>(
      `/dw/rest/v1/users/${id}/audit-log-records`,
      params,
      { resource: 'users', operation: 'auditLogs' }
    );
  }

  /**
   * Get the current user (requires user-context token).
   * @returns User resource for the authenticated user
   */
  async current(): Promise<User>;

  /**
   * Get the current user with expanded organizations.
   * @param opts - Expand options
   * @returns User with expanded organizations
   */
  async current(opts: { expand: 'organizations' }): Promise<UserExpanded>;

  /**
   * Get the current user with expanded roles.
   * @param opts - Expand options
   * @returns User with expanded roles
   */
  async current(opts: { expand: 'roles' }): Promise<UserExpandedRoles>;

  /**
   * Get the current user with expanded organizations and roles.
   * @param opts - Expand options
   * @returns User with expanded organizations and roles
   */
  async current(opts: { expand: 'organizations,roles' }): Promise<UserExpandedAll>;

  async current(opts?: GetUserOptions): Promise<User | UserExpanded | UserExpandedRoles | UserExpandedAll> {
    const params: Record<string, unknown> | undefined = opts?.expand ? { expand: opts.expand } : undefined;

    return this.http.get<User>(
      '/dw/rest/v1/users/current',
      params,
      { resource: 'users', operation: 'current' }
    );
  }

  /**
   * Get roles assigned to a user.
   * @param id - User UUID
   * @returns Collection of roles
   */
  async roles(id: string): Promise<ContentResponse<Role>> {
    return this.http.get<ContentResponse<Role>>(
      `/dw/rest/v1/users/${id}/roles`,
      undefined,
      { resource: 'users', operation: 'roles' }
    );
  }

  /**
   * Get instances accessible to a user.
   * @param id - User UUID
   * @returns Collection of instances
   */
  async instances(id: string): Promise<ContentResponse<Instance>> {
    return this.http.get<ContentResponse<Instance>>(
      `/dw/rest/v1/users/${id}/instances`,
      undefined,
      { resource: 'users', operation: 'instances' }
    );
  }

  /**
   * Get realms assigned to a user via role-tenant filter.
   * @param id - User UUID
   * @returns Collection of realms
   */
  async assignedRealms(id: string): Promise<ContentResponse<Realm>> {
    return this.http.get<ContentResponse<Realm>>(
      `/dw/rest/v1/users/${id}/assigned-realms`,
      undefined,
      { resource: 'users', operation: 'assignedRealms' }
    );
  }

  /**
   * Get instances assigned to a user via role-tenant filter.
   * @param id - User UUID
   * @returns Collection of instances
   */
  async assignedInstances(id: string): Promise<ContentResponse<Instance>> {
    return this.http.get<ContentResponse<Instance>>(
      `/dw/rest/v1/users/${id}/assigned-instances`,
      undefined,
      { resource: 'users', operation: 'assignedInstances' }
    );
  }

  /**
   * Create a new user.
   * @param data - User fields (mail, firstName, lastName, primaryOrganization required)
   * @returns Created user
   */
  async create(data: CreateUserRequest): Promise<User> {
    return this.http.post<User>(
      '/dw/rest/v1/users',
      data,
      undefined,
      { resource: 'users', operation: 'create' }
    );
  }

  /**
   * Update a user (JSON merge semantics).
   * @param id - User UUID
   * @param data - Fields to update
   * @returns Updated user
   */
  async update(id: string, data: UpdateUserRequest): Promise<User> {
    return this.http.put<User>(
      `/dw/rest/v1/users/${id}`,
      data,
      undefined,
      { resource: 'users', operation: 'update' }
    );
  }

  /**
   * Delete a user.
   * @param id - User UUID
   */
  async delete(id: string): Promise<void> {
    return this.http.delete(
      `/dw/rest/v1/users/${id}`,
      undefined,
      { resource: 'users', operation: 'delete' }
    );
  }

  /**
   * Reset a user's password.
   * @param id - User UUID
   * @param opts - Optional support ticket ID
   */
  async reset(id: string, opts?: ResetUserRequest): Promise<void> {
    return this.http.post<void>(
      `/dw/rest/v1/users/${id}/reset`,
      opts ?? {},
      undefined,
      { resource: 'users', operation: 'reset' }
    );
  }

  /**
   * Disable (deactivate) a user.
   * @param id - User UUID
   * @param opts - Optional support ticket ID
   */
  async disable(id: string, opts?: DisableUserRequest): Promise<void> {
    return this.http.post<void>(
      `/dw/rest/v1/users/${id}/disable`,
      opts ?? {},
      undefined,
      { resource: 'users', operation: 'disable' }
    );
  }

  /**
   * Revoke an MFA verifier for a user.
   * @param userId - User UUID
   * @param verifierId - Verifier ID to revoke
   */
  async revokeVerifier(userId: string, verifierId: string): Promise<void> {
    return this.http.post<void>(
      `/dw/rest/v1/users/${userId}/revokeVerifier/${verifierId}`,
      undefined,
      undefined,
      { resource: 'users', operation: 'revokeVerifier' }
    );
  }
}
