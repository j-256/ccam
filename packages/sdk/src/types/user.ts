import type { Link } from './common.js';
import type { Organization } from './organization.js';
import type { Role } from './role.js';
import type { UserState, VerifierType } from './enums.js';
import type { RoleTenantFilterString, RoleTenantFilterMap } from './role-tenant-filter.js';

/**
 * Multi-factor authentication verifier device.
 */
export interface Verifier {
  /** Unique identifier for the verifier device */
  id: string;

  /**
   * Type of verifier (sfa, totp, webauthn.cross-platform).
   * Union with `string` is intentional: the server may add types; prefer
   * comparing against {@link VerifierType} values but tolerate unknown strings.
   */
  type: VerifierType | string;

  /** User-friendly display name for the device */
  displayName: string;

  /** Current status of the verifier (e.g. ACTIVE) */
  status: string;
}

/**
 * Base user fields shared between User and UserExpanded.
 */
interface UserBase {
  /** Unique identifier for the user (UUID) */
  id: string;

  /** Email address used for login and communication */
  mail: string;

  /** User's first (given) name */
  firstName: string;

  /** User's last (family) name */
  lastName: string;

  /** Full display name (typically firstName + lastName) */
  displayName: string;

  /** Business phone number */
  businessPhone: string | null;

  /** Home phone number */
  homePhone: string | null;

  /** Mobile phone number */
  mobilePhone: string | null;

  /** Preferred locale code (e.g. "fr", "en") */
  preferredLocale: string | null;

  /** List of role IDs assigned to this user */
  roles: string[];

  /** Primary organization UUID for the user */
  primaryOrganization: string;

  /** See {@link RoleTenantFilterString}. */
  roleTenantFilter: RoleTenantFilterString;

  /** See {@link RoleTenantFilterMap}. */
  roleTenantFilterMap: RoleTenantFilterMap;

  /** Unix timestamp (milliseconds) when password expires */
  passwordExpirationTimestamp: number | null;

  /** Unix timestamp (milliseconds) when password was last modified */
  passwordModificationTimestamp: number | null;

  /** ISO-8601 timestamp of user creation */
  createdAt: string;

  /** ISO-8601 timestamp of last modification */
  lastModified: string;

  /** Date string of last login (e.g. "2026-04-07") */
  lastLoginDate: string | null;

  /**
   * Current state of the user account (ENABLED, DELETED, INITIAL).
   * Union with `string` is intentional: the server may add states; prefer
   * comparing against {@link UserState} values but tolerate unknown strings.
   */
  userState: UserState | string;

  /** Unix timestamp (milliseconds) when activation code was created */
  activationCodeCreationTimestamp: number | null;

  /** Salesforce User ID if linked to Salesforce Identity */
  sfUserId: string | null;

  /** List of MFA verifier devices registered for this user */
  verifiers: Verifier[];

  /** Unix timestamp (milliseconds) when user was deleted */
  deleteTimestamp: number | null;

  /** Support ticket ID associated with the last administrative action. Only present when applicable */
  supportTicketId?: string;

  /** HATEOAS links for related resources */
  links: Link[];
}

/**
 * User resource from the Account Manager API.
 * Organizations and roles are returned as ID strings.
 */
export interface User extends UserBase {
  /** List of organization IDs this user belongs to */
  organizations: string[];
}

/**
 * User resource with expanded organization objects.
 * Returned by get() or getByLogin() with expand='organizations'.
 */
export interface UserExpanded extends UserBase {
  /** List of full Organization objects this user belongs to */
  organizations: Organization[];
}

/**
 * User resource with expanded role objects.
 * Returned by get() with expand='roles'.
 */
export interface UserExpandedRoles extends Omit<User, 'roles'> {
  /** List of full Role objects assigned to this user */
  roles: Role[];
}

/**
 * User resource with both organizations and roles expanded.
 * Returned by get() with expand='organizations,roles'.
 */
export interface UserExpandedAll extends Omit<User, 'organizations' | 'roles'> {
  /** List of full Organization objects this user belongs to */
  organizations: Organization[];
  /** List of full Role objects assigned to this user */
  roles: Role[];
}

/**
 * Request body for updating a user. All fields optional (JSON merge semantics).
 */
export interface UpdateUserRequest {
  /** Email address */
  mail?: string;

  /** First name (max 40 chars) */
  firstName?: string;

  /** Last name (max 40 chars) */
  lastName?: string;

  /** Display name (max 100 chars) */
  displayName?: string;

  /** Business phone */
  businessPhone?: string | null;

  /** Home phone */
  homePhone?: string | null;

  /** Mobile phone */
  mobilePhone?: string | null;

  /** Locale code */
  preferredLocale?: string | null;

  /** Role IDs */
  roles?: string[];

  /** Organization IDs */
  organizations?: string[];

  /** Primary organization UUID */
  primaryOrganization?: string;

  /** See {@link RoleTenantFilterString}. */
  roleTenantFilter?: RoleTenantFilterString;

  /** Support ticket ID associated with this change */
  supportTicketId?: string;
}

/**
 * Request body for creating a user.
 */
export interface CreateUserRequest extends UpdateUserRequest {
  mail: string;
  firstName: string;
  lastName: string;
  primaryOrganization: string;
}

/**
 * Request body for POST /users/{id}/reset.
 */
export interface ResetUserRequest {
  /** Optional support ticket ID */
  supportTicketId?: string;
}

/**
 * Request body for POST /users/{id}/disable.
 */
export interface DisableUserRequest {
  /** Optional support ticket ID */
  supportTicketId?: string;
}

/**
 * Options for {@link UsersResource.grantRole} / {@link ApiClientsResource.grantRole}.
 *
 * Shared between User and ApiClient forms of grant. Only `tenants` is
 * currently supported; kept as an object for future expansion.
 */
export interface GrantRoleOptions {
  /**
   * Tenant tokens to grant for a tenant-scoped role. Merged (union) into the
   * existing `roleTenantFilter` entry for this role. Required for non-GLOBAL
   * roles to be functional; rejected for GLOBAL-scope roles.
   */
  tenants?: string[];
}

/**
 * Result of {@link UsersResource.grantRole}.
 *
 * `user` reflects current server state: the pre-op GET response when no write
 * occurred, or the PUT response otherwise. `changed` is true iff a PUT was
 * issued. `roleScope` is the scope of the granted role (e.g. `"GLOBAL"`,
 * `"INSTANCE"`), from the role lookup the SDK performed -- surfaced so CLI
 * callers can warn when a non-GLOBAL role is granted without tenants.
 */
export interface GrantRoleResult {
  user: User;
  changed: boolean;
  roleScope: string;
}

/**
 * Result of {@link UsersResource.revokeRole}.
 *
 * `user` reflects current server state: the pre-op GET response when no write
 * occurred, or the PUT response otherwise. `changed` is true iff a PUT was
 * issued.
 */
export interface RevokeRoleResult {
  user: User;
  changed: boolean;
}
