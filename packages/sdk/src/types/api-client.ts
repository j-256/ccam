import type { Link } from './common.js';
import type { Organization } from './organization.js';
import type { Role } from './role.js';
import type { TokenEndpointAuthMethod } from './enums.js';
import type { RoleTenantFilterString, RoleTenantFilterMap } from './role-tenant-filter.js';

/**
 * API Client resource for programmatic access to Account Manager and SFCC services.
 * API clients use OAuth 2.0 client credentials flow for authentication.
 */
export interface ApiClient {
  /** Unique identifier for the API client */
  id: string;

  /** Display name of the API client */
  name: string;

  /** Optional description of the API client's purpose */
  description: string | null;

  /** JWT public key for token verification (PEM format) */
  jwtPublicKey: string | null;

  /** Allowed OAuth redirect URLs for authorization code flow */
  redirectUrls: string[];

  /** OAuth scopes granted to this API client */
  scopes: string[];

  /** Default OAuth scopes applied when none specified */
  defaultScopes: string[];

  /** Organizations this API client has access to (UUIDs or names depending on endpoint) */
  organizations: string[];

  /** Number of organizations this API client belongs to */
  organizationCount: number;

  /** Whether the API client is currently active */
  active: boolean;

  /** List of role IDs assigned to this API client */
  roles: string[];

  /** See {@link RoleTenantFilterString}. */
  roleTenantFilter: RoleTenantFilterString;

  /** See {@link RoleTenantFilterMap}. */
  roleTenantFilterMap: RoleTenantFilterMap;

  /**
   * Token endpoint authentication method (e.g. "client_secret_basic", "private_key_jwt").
   * Union with `string` is intentional: the server may add methods; prefer
   * comparing against {@link TokenEndpointAuthMethod} values but tolerate
   * unknown strings.
   */
  tokenEndpointAuthMethod: TokenEndpointAuthMethod | string;

  /** Unix timestamp (milliseconds) when password/secret was last modified */
  passwordModificationTimestamp: number | null;

  /** Date string of last authentication (e.g. "2026-04-10") */
  lastAuthenticatedDate: string | null;

  /** ISO-8601 timestamp when API client was disabled */
  disabledTimestamp: string | null;

  /** ISO-8601 timestamp of API client creation */
  createdAt: string;

  /** Whether this is a public client (cannot keep credentials confidential) */
  publicClient: boolean;

  /**
   * Server-computed flag: true when the client is confidential
   * (`publicClient === false`) and has never had a password set.
   * Read-only -- the server derives it; setting it via update() has no effect.
   */
  needsInitialPassword: boolean;

  /** HATEOAS links for related resources */
  links: Link[];
}

/**
 * API Client with organizations expanded to full Organization objects.
 * Returned by get() with expand='organizations'.
 */
export interface ApiClientExpandedOrgs extends Omit<ApiClient, 'organizations'> {
  /** List of full Organization objects this API client belongs to */
  organizations: Organization[];
}

/**
 * API Client with roles expanded to full Role objects.
 * Returned by get() with expand='roles'.
 */
export interface ApiClientExpandedRoles extends Omit<ApiClient, 'roles'> {
  /** List of full Role objects assigned to this API client */
  roles: Role[];
}

/**
 * API Client with both organizations and roles expanded.
 * Returned by get() with expand='organizations,roles'.
 */
export interface ApiClientExpandedAll extends Omit<ApiClient, 'organizations' | 'roles'> {
  /** List of full Organization objects this API client belongs to */
  organizations: Organization[];
  /** List of full Role objects assigned to this API client */
  roles: Role[];
}

/**
 * Request body for updating an API client. All fields optional (JSON merge semantics).
 */
export interface UpdateApiClientRequest {
  /** Display name (max 200 chars) */
  name?: string;

  /** Description (max 256 chars) */
  description?: string | null;

  /** JWT public key (PEM format, max 8192 chars) */
  jwtPublicKey?: string | null;

  /** OAuth redirect URIs */
  redirectUrls?: string[];

  /** OAuth scopes */
  scopes?: string[];

  /** Default OAuth scopes */
  defaultScopes?: string[];

  /** Organization IDs */
  organizations?: string[];

  /** Whether the client is active */
  active?: boolean;

  /** Role IDs */
  roles?: string[];

  /** See {@link RoleTenantFilterString}. */
  roleTenantFilter?: RoleTenantFilterString;

  /** Token endpoint auth method */
  tokenEndpointAuthMethod?: TokenEndpointAuthMethod | string;
}

/**
 * Request body for creating an API client.
 */
export interface CreateApiClientRequest extends UpdateApiClientRequest {
  /** Client ID (unique identifier) */
  id: string;

  name: string;

  /** Whether this is a public client (cannot keep credentials confidential). Cannot be changed after creation. */
  publicClient?: boolean;
}

/**
 * Request body for PUT /apiclients/{id}/password.
 * For clients with an existing password, `old` must be provided and match.
 * For new clients without a password, only `new` is required.
 */
export interface SetPasswordRequest {
  /** New client secret */
  new: string;

  /** Current client secret. Required when the client already has a password set. */
  old?: string;
}

/**
 * Request body for POST /apiclients/{id}/client-authentication-type.
 */
export interface SetAuthTypeRequest {
  /** true for public client, false for confidential */
  public: boolean;
}
