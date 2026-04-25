import type { HttpClient } from '../client.js';
import type {
  Organization,
  Realm,
  RealmExpanded,
  Instance,
  ContentResponse,
  PagedResponse,
  PaginationOptions,
  SortOption,
  AuditLogRecord,
  AuditLogOptions,
  UpdateOrganizationRequest,
  SfMyDomainVerificationResponse,
} from '../types/index.js';
import { formatSort } from './sort.js';

export interface ListOrganizationsOptions extends PaginationOptions {
  sort?: SortOption<string>;
}

export interface FindByNameOptions extends PaginationOptions {
  term?: string;
  startsWith?: string;
  ignoreCase?: boolean;
}

export interface FindBySfAccountIdOptions extends PaginationOptions {
  sfAccountId: string;
}

/**
 * Resource class for managing organizations in the Account Manager API.
 * Provides methods for listing, searching, and retrieving organization data.
 */
export class OrganizationsResource {
  private readonly http: HttpClient;

  readonly search: {
    findByName: (opts: FindByNameOptions) => Promise<ContentResponse<Organization>>;
    findBySfAccountId: (opts: FindBySfAccountIdOptions) => Promise<ContentResponse<Organization>>;
  };

  constructor(httpClient: HttpClient) {
    this.http = httpClient;

    this.search = {
      findByName: (opts) => this.findByName(opts),
      findBySfAccountId: (opts) => this.findBySfAccountId(opts),
    };
  }

  /**
   * List all organizations with optional pagination and sorting.
   * @param opts - Pagination and sort options
   * @returns Paginated list of organizations
   */
  async list(opts?: ListOrganizationsOptions): Promise<PagedResponse<Organization>> {
    const params: Record<string, unknown> = {};

    if (opts) {
      if (opts.page !== undefined) params.page = opts.page;
      if (opts.size !== undefined) params.size = opts.size;
      const sort = formatSort(opts.sort);
      if (sort) params.sort = sort;
    }

    return this.http.get<PagedResponse<Organization>>(
      '/dw/rest/v1/organizations',
      Object.keys(params).length > 0 ? params : undefined,
      { resource: 'organizations', operation: 'list' }
    );
  }

  /**
   * Get a specific organization by ID.
   * @param id - Organization ID (may be a string name, not necessarily a UUID)
   * @returns Organization resource
   */
  async get(id: string): Promise<Organization> {
    return this.http.get<Organization>(
      `/dw/rest/v1/organizations/${id}`,
      undefined,
      { resource: 'organizations', operation: 'get' }
    );
  }

  /**
   * Find organizations by name.
   * @param opts - Search options (term or startsWith with optional ignoreCase)
   * @returns Paginated list of organizations
   */
  private async findByName(opts: FindByNameOptions): Promise<ContentResponse<Organization>> {
    const params: Record<string, unknown> = {};

    if (opts.term !== undefined) params.term = opts.term;
    if (opts.startsWith !== undefined) params.startsWith = opts.startsWith;
    if (opts.ignoreCase !== undefined) params.ignoreCase = opts.ignoreCase;
    if (opts.page !== undefined) params.page = opts.page;
    if (opts.size !== undefined) params.size = opts.size;

    return this.http.get<ContentResponse<Organization>>(
      '/dw/rest/v1/organizations/search/findByName',
      params,
      { resource: 'organizations', operation: 'search.findByName' }
    );
  }

  /**
   * Find organizations by Salesforce Account ID.
   * @param opts - Salesforce Account ID and pagination options
   * @returns Paginated list of organizations
   */
  private async findBySfAccountId(
    opts: FindBySfAccountIdOptions
  ): Promise<ContentResponse<Organization>> {
    const params: Record<string, unknown> = { sfAccountId: opts.sfAccountId };

    if (opts.page !== undefined) params.page = opts.page;
    if (opts.size !== undefined) params.size = opts.size;

    return this.http.get<ContentResponse<Organization>>(
      '/dw/rest/v1/organizations/search/findBySfAccountId',
      params,
      { resource: 'organizations', operation: 'search.findBySfAccountId' }
    );
  }

  /**
   * Get realms belonging to an organization.
   * @param orgId - Organization UUID
   * @returns Paginated list of realms
   */
  async realms(orgId: string): Promise<ContentResponse<Realm>>;

  /**
   * Get realms belonging to an organization with instances expanded to full objects.
   * @param orgId - Organization UUID
   * @param opts - Expand options
   * @returns Paginated list of realms with expanded instances
   */
  async realms(orgId: string, opts: { expand: 'instance' }): Promise<ContentResponse<RealmExpanded>>;

  async realms(orgId: string, opts?: { expand: 'instance' }): Promise<ContentResponse<Realm> | ContentResponse<RealmExpanded>> {
    const params: Record<string, unknown> | undefined = opts?.expand ? { expand: opts.expand } : undefined;

    return this.http.get<ContentResponse<Realm>>(
      `/dw/rest/v1/organizations/${orgId}/realms`,
      params,
      { resource: 'organizations', operation: 'realms' }
    );
  }

  /**
   * Get instances belonging to an organization.
   * @param orgId - Organization UUID
   * @returns Paginated list of instances
   */
  async instances(orgId: string): Promise<ContentResponse<Instance>> {
    return this.http.get<ContentResponse<Instance>>(
      `/dw/rest/v1/organizations/${orgId}/instances`,
      undefined,
      { resource: 'organizations', operation: 'instances' }
    );
  }

  /**
   * Get the Salesforce My Domain verification URI for an organization.
   * Used as part of setting up Salesforce Identity federation.
   * @param orgId - Organization UUID
   * @returns Object containing the verification URI
   */
  async getSfMyDomainVerification(orgId: string): Promise<SfMyDomainVerificationResponse> {
    return this.http.get<SfMyDomainVerificationResponse>(
      `/dw/rest/v1/organizations/${orgId}/sf-my-domain-verification`,
      undefined,
      { resource: 'organizations', operation: 'getSfMyDomainVerification' }
    );
  }

  /**
   * Get audit log records for an organization.
   * @param orgId - Organization UUID
   * @param opts - Options including querySize
   * @returns List of audit log records (not paginated)
   */
  async auditLogs(orgId: string, opts?: AuditLogOptions): Promise<ContentResponse<AuditLogRecord>> {
    const params: Record<string, unknown> | undefined = opts?.querySize !== undefined ? { querySize: opts.querySize } : undefined;

    return this.http.get<ContentResponse<AuditLogRecord>>(
      `/dw/rest/v1/organizations/${orgId}/audit-log-records`,
      params,
      { resource: 'organizations', operation: 'auditLogs' }
    );
  }

  /**
   * Update an organization (JSON merge semantics).
   * Note: `realms` is a restricted attribute and cannot be modified.
   * @param id - Organization ID
   * @param data - Fields to update
   * @returns Updated organization
   */
  async update(id: string, data: UpdateOrganizationRequest): Promise<Organization> {
    return this.http.put<Organization>(
      `/dw/rest/v1/organizations/${id}`,
      data,
      undefined,
      { resource: 'organizations', operation: 'update' }
    );
  }
}
