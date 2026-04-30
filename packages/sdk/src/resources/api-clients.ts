import type { HttpClient } from '../client.js';
import type {
  ApiClient,
  ApiClientExpandedOrgs,
  ApiClientExpandedRoles,
  ApiClientExpandedAll,
  ContentResponse,
  PagedResponse,
  PaginationOptions,
  SortOption,
  AuditLogRecord,
  AuditLogOptions,
  Realm,
  Instance,
  CreateApiClientRequest,
  UpdateApiClientRequest,
  SetPasswordRequest,
  ApiClientSortField,
  Role,
  GrantRoleOptions,
  ApiClientGrantRoleResult,
  ApiClientRevokeRoleResult,
} from '../types/index.js';
import { formatSort } from './sort.js';
import { validateQuerySize } from './validation.js';
import { mergeTenantsForRole } from './role-tenant-filter.js';
import { CcamError } from '../errors.js';

/** Expand options for API client get endpoint */
export type ExpandApiClients = 'organizations' | 'roles' | 'organizations,roles';

export interface ListApiClientsOptions extends PaginationOptions {
  /**
   * Sort field. Prefer values from {@link ApiClientSortField} for IDE
   * autocomplete and to avoid server-side 400 on non-sortable fields. Accepts
   * any string to tolerate server-side additions.
   */
  sort?: SortOption<ApiClientSortField | string>;
}

export interface GetApiClientOptions {
  expand?: ExpandApiClients;
}

/**
 * Resource class for managing API clients in the Account Manager API.
 * Provides methods for listing, retrieving, and accessing audit logs for API clients.
 */
export class ApiClientsResource {
  private readonly http: HttpClient;

  constructor(httpClient: HttpClient) {
    this.http = httpClient;
  }

  /**
   * List all API clients with optional pagination and sorting.
   * @param opts - Pagination and sort options
   * @returns Paginated list of API clients
   */
  async list(opts?: ListApiClientsOptions): Promise<PagedResponse<ApiClient>> {
    const params: Record<string, unknown> = {};

    if (opts) {
      if (opts.page !== undefined) params.page = opts.page;
      if (opts.size !== undefined) params.size = opts.size;
      const sort = formatSort(opts.sort);
      if (sort) params.sort = sort;
    }

    return this.http.get<PagedResponse<ApiClient>>(
      '/dw/rest/v1/apiclients',
      Object.keys(params).length > 0 ? params : undefined,
      { resource: 'apiClients', operation: 'list' }
    );
  }

  /**
   * Get a specific API client by ID.
   * @param id - API client ID
   * @returns API client resource
   */
  async get(id: string): Promise<ApiClient>;

  /**
   * Get a specific API client by ID with expanded organizations.
   * @param id - API client ID
   * @param opts - Expand options
   * @returns API client with expanded organizations
   */
  async get(id: string, opts: { expand: 'organizations' }): Promise<ApiClientExpandedOrgs>;

  /**
   * Get a specific API client by ID with expanded roles.
   * @param id - API client ID
   * @param opts - Expand options
   * @returns API client with expanded roles
   */
  async get(id: string, opts: { expand: 'roles' }): Promise<ApiClientExpandedRoles>;

  /**
   * Get a specific API client by ID with expanded organizations and roles.
   * @param id - API client ID
   * @param opts - Expand options
   * @returns API client with expanded organizations and roles
   */
  async get(id: string, opts: { expand: 'organizations,roles' }): Promise<ApiClientExpandedAll>;

  async get(id: string, opts?: GetApiClientOptions): Promise<ApiClient | ApiClientExpandedOrgs | ApiClientExpandedRoles | ApiClientExpandedAll> {
    const params: Record<string, unknown> | undefined = opts?.expand ? { expand: opts.expand } : undefined;

    return this.http.get<ApiClient>(
      `/dw/rest/v1/apiclients/${id}`,
      params,
      { resource: 'apiClients', operation: 'get' }
    );
  }

  /**
   * Get audit log records for an API client.
   * @param id - API client ID
   * @param opts - Options including querySize
   * @returns List of audit log records (not paginated)
   */
  async auditLogs(id: string, opts?: AuditLogOptions): Promise<ContentResponse<AuditLogRecord>> {
    validateQuerySize(opts?.querySize);
    const params: Record<string, unknown> | undefined = opts?.querySize !== undefined ? { querySize: opts.querySize } : undefined;

    return this.http.get<ContentResponse<AuditLogRecord>>(
      `/dw/rest/v1/apiclients/${id}/audit-log-records`,
      params,
      { resource: 'apiClients', operation: 'auditLogs' }
    );
  }

  /**
   * Get realms assigned to an API client via role-tenant filter.
   * @param id - API client ID
   * @returns List of assigned realms
   */
  async assignedRealms(id: string): Promise<ContentResponse<Realm>> {
    return this.http.get<ContentResponse<Realm>>(
      `/dw/rest/v1/apiclients/${id}/assigned-realms`,
      undefined,
      { resource: 'apiClients', operation: 'assignedRealms' }
    );
  }

  /**
   * Get instances assigned to an API client via role-tenant filter.
   * @param id - API client ID
   * @returns List of assigned instances
   */
  async assignedInstances(id: string): Promise<ContentResponse<Instance>> {
    return this.http.get<ContentResponse<Instance>>(
      `/dw/rest/v1/apiclients/${id}/assigned-instances`,
      undefined,
      { resource: 'apiClients', operation: 'assignedInstances' }
    );
  }

  /**
   * Create a new API client.
   * @param data - API client fields (id and name required)
   * @returns Created API client
   */
  async create(data: CreateApiClientRequest): Promise<ApiClient> {
    return this.http.post<ApiClient>(
      '/dw/rest/v1/apiclients',
      data,
      undefined,
      { resource: 'apiClients', operation: 'create' }
    );
  }

  /**
   * Update an API client (JSON merge semantics).
   * @param id - API client ID
   * @param data - Fields to update
   * @returns Updated API client
   */
  async update(id: string, data: UpdateApiClientRequest): Promise<ApiClient> {
    return this.http.put<ApiClient>(
      `/dw/rest/v1/apiclients/${id}`,
      data,
      undefined,
      { resource: 'apiClients', operation: 'update' }
    );
  }

  /**
   * Delete an API client.
   * The server rejects with 412 Precondition Failed unless the client has been
   * disabled for at least 7 days. Set `active: false` via update() first, then
   * wait out the cooldown before calling delete().
   * @param id - API client ID
   */
  async delete(id: string): Promise<void> {
    return this.http.delete(
      `/dw/rest/v1/apiclients/${id}`,
      undefined,
      { resource: 'apiClients', operation: 'delete' }
    );
  }

  /**
   * Change an API client's secret.
   * For clients that already have a password, `data.old` must be provided and match.
   * @param id - API client ID
   * @param data - New secret (and current secret when the client already has one)
   */
  async setPassword(id: string, data: SetPasswordRequest): Promise<void> {
    return this.http.put<void>(
      `/dw/rest/v1/apiclients/${id}/password`,
      data,
      undefined,
      { resource: 'apiClients', operation: 'setPassword' }
    );
  }

  /**
   * Switch an API client between public and confidential.
   * @param id - API client ID
   * @param isPublic - true for public client, false for confidential
   */
  async setAuthType(id: string, isPublic: boolean): Promise<void> {
    return this.http.post<void>(
      `/dw/rest/v1/apiclients/${id}/client-authentication-type`,
      { public: isPublic },
      undefined,
      { resource: 'apiClients', operation: 'setAuthType' }
    );
  }

  /**
   * Grant a role to an API client. Idempotent: if the client already has the
   * role (and, when tenants are provided, already has all requested tenants
   * in its `roleTenantFilter`), returns `{ changed: false }` and skips the PUT.
   *
   * Implementation is a read-modify-write: GET /apiclients/{id}, GET /roles/{roleId},
   * then a conditional PUT /apiclients/{id}. AM exposes no If-Match / ETag,
   * so there is a small race window between the GET and the PUT. PUT is
   * PATCH-semantics: only `roles` and (when tenants given) `roleTenantFilter`
   * are sent.
   *
   * Non-GLOBAL roles granted without tenants will be inert until tenants are
   * set. The SDK does not warn; the CLI surfaces this case.
   *
   * @throws {@link CcamError} when the role has `scope: GLOBAL` but tenants were provided.
   * @throws {@link CcamNotFoundError} when the API client or role is not found.
   */
  async grantRole(
    id: string,
    roleId: string,
    opts?: GrantRoleOptions,
  ): Promise<ApiClientGrantRoleResult> {
    const apiClient = await this.get(id);
    const role = await this.http.get<Role>(
      `/dw/rest/v1/roles/${roleId}`,
      undefined,
      { resource: 'apiClients', operation: 'grantRole' },
    );

    const tenants = opts?.tenants;
    const wantsTenants = tenants !== undefined && tenants.length > 0;

    if (wantsTenants && role.scope === 'GLOBAL') {
      throw new CcamError(
        `Role ${roleId} has scope GLOBAL and cannot have tenants`,
        { status: 400, resource: 'apiClients', operation: 'grantRole' },
      );
    }

    const hasRole = apiClient.roles.includes(roleId);
    const nextRoles = hasRole ? apiClient.roles : [...apiClient.roles, roleId];

    let nextFilter: string | undefined;
    let filterChanged = false;
    if (wantsTenants) {
      const merged = mergeTenantsForRole(
        apiClient.roleTenantFilter ?? '',
        role.roleEnumName,
        tenants!,
      );
      if (merged.changed) {
        nextFilter = merged.filter;
        filterChanged = true;
      }
    }

    if (hasRole && !filterChanged) {
      return { apiClient, changed: false, roleScope: role.scope };
    }

    const body: Record<string, unknown> = { roles: nextRoles };
    if (filterChanged) {
      body.roleTenantFilter = nextFilter;
    }

    const updated = await this.http.put<ApiClient>(
      `/dw/rest/v1/apiclients/${id}`,
      body,
      undefined,
      { resource: 'apiClients', operation: 'grantRole' },
    );
    return { apiClient: updated, changed: true, roleScope: role.scope };
  }

  /**
   * Revoke a role from an API client. Idempotent: returns `{ changed: false }`
   * and skips the PUT if the role is not present. AM strips the corresponding
   * `roleTenantFilter` entry server-side.
   */
  async revokeRole(id: string, roleId: string): Promise<ApiClientRevokeRoleResult> {
    const apiClient = await this.get(id);

    if (!apiClient.roles.includes(roleId)) {
      return { apiClient, changed: false };
    }

    const nextRoles = apiClient.roles.filter((r) => r !== roleId);
    const updated = await this.http.put<ApiClient>(
      `/dw/rest/v1/apiclients/${id}`,
      { roles: nextRoles },
      undefined,
      { resource: 'apiClients', operation: 'revokeRole' },
    );
    return { apiClient: updated, changed: true };
  }
}
