import type { Link } from './common.js';
import type { RoleScope, RoleTargetType } from './enums.js';
import type { ServiceType } from './service-type.js';

/**
 * Role resource defining a set of permissions for users or API clients.
 */
export interface Role {
  /** Unique identifier for the role (typically kebab-case, e.g. "ccdx-sbx-user") */
  id: string;

  /** Human-readable description of the role and its purpose */
  description: string;

  /** Uppercase enum name (e.g. "CCDX_SBX_USER"); this is the token used in roleTenantFilter strings */
  roleEnumName: string;

  /** Whether this is an internal system role not visible to customers */
  internalRole: boolean;

  /** Service type this role belongs to (e.g. ECOM, CDN) */
  serviceType: string;

  /** List of permission names granted by this role */
  permissions: string[];

  /** Scope indicating if role applies globally or to specific instances */
  scope: RoleScope | string;

  /** Target type indicating what this role can be assigned to (User, ApiClient, or null) */
  targetType: RoleTargetType | string | null;

  /** Whether two-factor authentication is required for this role */
  twoFAEnabled: boolean;

  /** Whether this role grants elevated/privileged access */
  privileged: boolean;

  /** HATEOAS links for related resources */
  links: Link[];
}

/**
 * Role with serviceType expanded to a full ServiceType object.
 * Returned by get() or list() with expand='serviceType'.
 */
export interface RoleExpanded extends Omit<Role, 'serviceType'> {
  /** Full ServiceType object instead of just the string ID */
  serviceType: ServiceType;
}

